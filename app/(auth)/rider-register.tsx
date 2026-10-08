import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { registerRider } from '../../src/api/auth';
import { ApiError } from '../../src/api/client';
import {
  riderStep1Schema,
  riderStep2Schema,
  riderStep3Schema,
  RiderStep1FormData,
  RiderStep2FormData,
} from '../../src/features/rider/schemas';
import { buildRiderRegisterFormData } from '../../src/features/rider/utils';
import { formatCnic, maskCnic, stripCnic } from '../../src/utils/cnic';
import { ImageSlotPicker, ImageSlotValue } from '../../src/components/ImageSlotPicker';
import { cleanupTempFiles } from '../../src/utils/image';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

export default function RiderRegisterScreen() {
  const router = useRouter();

  // Wizard Step: 1 = Personal, 2 = Vehicle, 3 = Documents, 4 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Step 2 Fields
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [cnicDisplay, setCnicDisplay] = useState('');

  // Step 3 Documents
  const [profileImage, setProfileImage] = useState<ImageSlotValue | null>(null);
  const [cnicFront, setCnicFront] = useState<ImageSlotValue | null>(null);
  const [cnicBack, setCnicBack] = useState<ImageSlotValue | null>(null);
  const [licenseImage, setLicenseImage] = useState<ImageSlotValue | null>(null);
  const [vehicleImage, setVehicleImage] = useState<ImageSlotValue | null>(null);
  const [regBook, setRegBook] = useState<ImageSlotValue | null>(null);

  // Errors & Loading
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 -> Step 2 validation
  const handleNextStep1 = () => {
    setGeneralError(null);
    setStepErrors({});
    const result = riderStep1Schema.safeParse({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      phone,
      address,
    });

    if (!result.success) {
      const errMap: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = String(issue.path[0]);
        if (!errMap[path]) errMap[path] = issue.message;
      }
      setStepErrors(errMap);
      return;
    }

    setCurrentStep(2);
  };

  // Step 2 -> Step 3 validation
  const handleNextStep2 = () => {
    setGeneralError(null);
    setStepErrors({});
    const result = riderStep2Schema.safeParse({
      vehicle_type: vehicleType,
      vehicle_number: vehicleNumber,
      cnic_number: cnicDisplay,
    });

    if (!result.success) {
      const errMap: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = String(issue.path[0]);
        if (!errMap[path]) errMap[path] = issue.message;
      }
      setStepErrors(errMap);
      return;
    }

    setCurrentStep(3);
  };

  // Step 3 -> Review validation
  const handleNextStep3 = () => {
    setGeneralError(null);
    setStepErrors({});
    const result = riderStep3Schema.safeParse({
      profile_image: profileImage ? { uri: profileImage.uri } : undefined,
      cnic_front: cnicFront ? { uri: cnicFront.uri } : undefined,
      cnic_back: cnicBack ? { uri: cnicBack.uri } : undefined,
      license_image: licenseImage ? { uri: licenseImage.uri } : undefined,
      vehicle_image: vehicleImage ? { uri: vehicleImage.uri } : undefined,
      registration_book: regBook ? { uri: regBook.uri } : undefined,
    });

    if (!result.success) {
      const errMap: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = String(issue.path[0]);
        if (!errMap[path]) errMap[path] = issue.message;
      }
      setStepErrors(errMap);
      return;
    }

    setCurrentStep(4);
  };

  const handleBack = () => {
    setGeneralError(null);
    setStepErrors({});
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep((prev) => ((prev - 1) as 1 | 2 | 3));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setGeneralError(null);
    setStepErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        phone,
        address,
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber,
        cnic_number: cnicDisplay,
        profile_image: profileImage!,
        cnic_front: cnicFront!,
        cnic_back: cnicBack!,
        license_image: licenseImage!,
        vehicle_image: vehicleImage!,
        registration_book: regBook!,
      };

      const formData = await buildRiderRegisterFormData(payload);
      await registerRider(formData);

      // Clean up temporary image files on success
      await cleanupTempFiles([
        profileImage?.uri,
        cnicFront?.uri,
        cnicBack?.uri,
        licenseImage?.uri,
        vehicleImage?.uri,
        regBook?.uri,
      ]);

      // Navigate to waiting-approval screen
      router.replace({
        pathname: '/(auth)/waiting-approval' as any,
        params: {
          role: 'rider',
          email: email.trim().toLowerCase(),
        },
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'VALIDATION_ERROR' && err.errors) {
          const mapped: Record<string, string> = {};
          let firstErrorStep: 1 | 2 | 3 | null = null;

          for (const [key, msgs] of Object.entries(err.errors)) {
            if (msgs && msgs[0]) {
              mapped[key] = msgs[0];

              if (!firstErrorStep) {
                if (['name', 'email', 'password', 'phone', 'address'].includes(key)) {
                  firstErrorStep = 1;
                } else if (['vehicle_type', 'vehicle_number', 'cnic_number'].includes(key)) {
                  firstErrorStep = 2;
                } else if (
                  [
                    'profile_image',
                    'cnic_front',
                    'cnic_back',
                    'license_image',
                    'vehicle_image',
                    'registration_book',
                  ].includes(key)
                ) {
                  firstErrorStep = 3;
                }
              }
            }
          }

          setStepErrors(mapped);
          if (firstErrorStep) {
            setCurrentStep(firstErrorStep);
          }
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError(t('errors.UNKNOWN_ERROR'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return t('step1Title');
      case 2:
        return t('step2Title');
      case 3:
        return t('step3Title');
      case 4:
        return t('stepReviewTitle');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header & Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={isSubmitting}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backButtonText}>← {t('back')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('riderRegisterTitle')}</Text>
          <Text style={styles.subtitle}>{t('riderRegisterSubtitle')}</Text>

          {/* Progress Bar & Step Label */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(currentStep / 4) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.stepLabelsRow}>
              <Text style={styles.stepNumberText}>
                {t('step', { current: currentStep, total: 4 })}
              </Text>
              <Text style={styles.stepTitleText}>{getStepTitle()}</Text>
            </View>
          </View>
        </View>

        {generalError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{generalError}</Text>
          </View>
        ) : null}

        {/* STEP 1: PERSONAL INFORMATION */}
        {currentStep === 1 && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('nameLabel')}</Text>
              <TextInput
                style={[styles.input, stepErrors.name && styles.inputError]}
                placeholder={t('namePlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={setName}
              />
              {stepErrors.name ? (
                <Text style={styles.fieldError}>{stepErrors.name}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('emailLabel')}</Text>
              <TextInput
                style={[styles.input, stepErrors.email && styles.inputError]}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {stepErrors.email ? (
                <Text style={styles.fieldError}>{stepErrors.email}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('passwordLabel')}</Text>
              <TextInput
                style={[styles.input, stepErrors.password && styles.inputError]}
                placeholder={t('passwordPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              {stepErrors.password ? (
                <Text style={styles.fieldError}>{stepErrors.password}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('confirmPasswordLabel')}</Text>
              <TextInput
                style={[
                  styles.input,
                  stepErrors.password_confirmation && styles.inputError,
                ]}
                placeholder={t('confirmPasswordPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                secureTextEntry
                autoCapitalize="none"
              />
              {stepErrors.password_confirmation ? (
                <Text style={styles.fieldError}>
                  {stepErrors.password_confirmation}
                </Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('phoneLabel')}</Text>
              <TextInput
                style={[styles.input, stepErrors.phone && styles.inputError]}
                placeholder={t('phonePlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={phone}
                onChangeText={(val) => setPhone(val.replace(/\D/g, '').slice(0, 11))}
                keyboardType="number-pad"
                maxLength={11}
              />
              {stepErrors.phone ? (
                <Text style={styles.fieldError}>{stepErrors.phone}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('addressPersonalLabel')}</Text>
              <TextInput
                style={[styles.input, stepErrors.address && styles.inputError]}
                placeholder={t('addressPersonalPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={address}
                onChangeText={setAddress}
              />
              {stepErrors.address ? (
                <Text style={styles.fieldError}>{stepErrors.address}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleNextStep1}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>{t('next')} →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: VEHICLE & CNIC */}
        {currentStep === 2 && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('vehicleTypeLabel')}</Text>
              <TextInput
                style={[styles.input, stepErrors.vehicle_type && styles.inputError]}
                placeholder={t('vehicleTypePlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={vehicleType}
                onChangeText={setVehicleType}
              />
              {stepErrors.vehicle_type ? (
                <Text style={styles.fieldError}>{stepErrors.vehicle_type}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('vehicleNumberLabel')}</Text>
              <TextInput
                style={[
                  styles.input,
                  stepErrors.vehicle_number && styles.inputError,
                ]}
                placeholder={t('vehicleNumberPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                autoCapitalize="characters"
              />
              {stepErrors.vehicle_number ? (
                <Text style={styles.fieldError}>
                  {stepErrors.vehicle_number}
                </Text>
              ) : null}
            </View>

            {/* CNIC Number with Mask */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('cnicLabel')}</Text>
              <TextInput
                style={[styles.input, stepErrors.cnic_number && styles.inputError]}
                placeholder={t('cnicPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={cnicDisplay}
                onChangeText={(val) => setCnicDisplay(formatCnic(val))}
                keyboardType="number-pad"
                maxLength={15} // 13 digits + 2 hyphens
              />
              {stepErrors.cnic_number ? (
                <Text style={styles.fieldError}>{stepErrors.cnic_number}</Text>
              ) : null}
            </View>

            <View style={styles.stepButtonRow}>
              <TouchableOpacity
                style={styles.stepBackButton}
                onPress={handleBack}
              >
                <Text style={styles.stepBackButtonText}>← {t('previous')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stepNextButton}
                onPress={handleNextStep2}
              >
                <Text style={styles.actionButtonText}>{t('next')} →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: DOCUMENTS (ALL 6 SLOTS) */}
        {currentStep === 3 && (
          <View style={styles.formCard}>
            <ImageSlotPicker
              label={`1. ${t('docProfileImage')}`}
              value={profileImage}
              onChange={setProfileImage}
              error={stepErrors.profile_image}
            />

            <ImageSlotPicker
              label={`2. ${t('docCnicFront')}`}
              value={cnicFront}
              onChange={setCnicFront}
              error={stepErrors.cnic_front}
            />

            <ImageSlotPicker
              label={`3. ${t('docCnicBack')}`}
              value={cnicBack}
              onChange={setCnicBack}
              error={stepErrors.cnic_back}
            />

            <ImageSlotPicker
              label={`4. ${t('docLicense')}`}
              value={licenseImage}
              onChange={setLicenseImage}
              error={stepErrors.license_image}
            />

            <ImageSlotPicker
              label={`5. ${t('docVehicleImage')}`}
              value={vehicleImage}
              onChange={setVehicleImage}
              error={stepErrors.vehicle_image}
            />

            <ImageSlotPicker
              label={`6. ${t('docRegBook')}`}
              value={regBook}
              onChange={setRegBook}
              error={stepErrors.registration_book}
            />

            <View style={styles.stepButtonRow}>
              <TouchableOpacity
                style={styles.stepBackButton}
                onPress={handleBack}
              >
                <Text style={styles.stepBackButtonText}>← {t('previous')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stepNextButton}
                onPress={handleNextStep3}
              >
                <Text style={styles.actionButtonText}>{t('next')} →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 4: REVIEW & SUBMIT */}
        {currentStep === 4 && (
          <View style={styles.formCard}>
            <Text style={styles.reviewHeader}>Confirm Application Details</Text>

            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>{t('nameLabel')}</Text>
              <Text style={styles.reviewValue}>{name}</Text>
            </View>
            <View style={styles.reviewDivider} />

            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>{t('emailLabel')}</Text>
              <Text style={styles.reviewValue}>{email}</Text>
            </View>
            <View style={styles.reviewDivider} />

            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>{t('phoneLabel')}</Text>
              <Text style={styles.reviewValue}>{phone}</Text>
            </View>
            <View style={styles.reviewDivider} />

            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>{t('vehicleTypeLabel')}</Text>
              <Text style={styles.reviewValue}>{vehicleType} ({vehicleNumber})</Text>
            </View>
            <View style={styles.reviewDivider} />

            {/* CNIC masked except last 4 digits */}
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>{t('cnicLabel')}</Text>
              <Text style={styles.reviewValue}>{maskCnic(cnicDisplay)}</Text>
            </View>
            <View style={styles.reviewDivider} />

            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Documents Uploaded</Text>
              <Text style={styles.reviewValue}>6 of 6 Verified ✓</Text>
            </View>

            {/* Clear verification disclaimer */}
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>🔒 {t('docDisclaimer')}</Text>
            </View>

            <View style={styles.stepButtonRow}>
              <TouchableOpacity
                style={styles.stepBackButton}
                onPress={handleBack}
                disabled={isSubmitting}
              >
                <Text style={styles.stepBackButtonText}>← {t('previous')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.stepNextButton,
                  isSubmitting && styles.actionButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={theme.colors.card} />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {t('submit')} Application
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    minHeight: 36,
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  backButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  progressSection: {
    marginTop: theme.spacing.xs,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.medium,
  },
  stepTitleText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  errorBanner: {
    backgroundColor: '#FDE8E8',
    borderColor: '#F98080',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorBannerText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  fieldError: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: 4,
  },
  actionButton: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  actionButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
  actionButtonText: {
    color: theme.colors.card,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  stepButtonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  stepBackButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBackButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  stepNextButton: {
    flex: 2,
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewHeader: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  reviewLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  reviewValue: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.semibold,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  disclaimerBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.lg,
  },
  disclaimerText: {
    fontSize: theme.fontSize.xs,
    color: '#166534',
    lineHeight: 18,
  },
});
