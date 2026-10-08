import React, { useState, useEffect } from 'react';
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
import { getLocationsMeta } from '../../src/api/browse';
import { registerSeller } from '../../src/api/auth';
import { LocationCategory } from '../../src/api/types';
import { ApiError } from '../../src/api/client';
import { sellerRegisterSchema } from '../../src/features/seller/schemas';
import { buildSellerRegisterFormData } from '../../src/features/seller/utils';
import { ImageSlotPicker, ImageSlotValue } from '../../src/components/ImageSlotPicker';
import { cleanupTempFiles } from '../../src/utils/image';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

export default function SellerRegisterScreen() {
  const router = useRouter();

  // Location metadata from customer/meta/locations
  const [sectors, setSectors] = useState<string[]>(['4A', '4B', '4C']);
  const [availableNearAreas, setAvailableNearAreas] = useState<string[]>([]);
  const [categories, setCategories] = useState<LocationCategory[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [city] = useState('Karachi');
  const [area] = useState('Baldia Town');
  const [sector, setSector] = useState('4A');
  const [selectedNearAreas, setSelectedNearAreas] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<number | string>('');
  const [fullAddress, setFullAddress] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [profileImage, setProfileImage] = useState<ImageSlotValue | null>(null);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await getLocationsMeta();
        if (res.data) {
          if (res.data.sectors && res.data.sectors.length > 0) {
            setSectors(res.data.sectors);
          }
          if (res.data.near_areas && res.data.near_areas.length > 0) {
            setAvailableNearAreas(res.data.near_areas);
          }
          if (res.data.categories && res.data.categories.length > 0) {
            setCategories(res.data.categories);
            setCategoryId(res.data.categories[0].id);
          }
        }
      } catch {
        // Fallback default options
        setAvailableNearAreas(['Ali Chowk', 'Gulshan-e-Ghazi', 'Saeedabad', 'Rasheedabad']);
      } finally {
        setIsLoadingMeta(false);
      }
    }
    loadMeta();
  }, []);

  const toggleNearArea = (nearArea: string) => {
    setSelectedNearAreas((prev) =>
      prev.includes(nearArea)
        ? prev.filter((a) => a !== nearArea)
        : [...prev, nearArea]
    );
    if (fieldErrors.near_areas) {
      setFieldErrors((prev) => ({ ...prev, near_areas: '' }));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setGeneralError(null);
    setFieldErrors({});

    // Validate with zod schema
    const validationResult = sellerRegisterSchema.safeParse({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      city,
      area,
      sector,
      catalog_category_id: categoryId,
      near_areas: selectedNearAreas,
      full_address: fullAddress,
      terms: termsAccepted,
      profile_image: profileImage ? { uri: profileImage.uri } : undefined,
    });

    if (!validationResult.success) {
      const errMap: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const path = String(issue.path[0]);
        if (!errMap[path]) {
          errMap[path] = issue.message;
        }
      }
      setFieldErrors(errMap);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = await buildSellerRegisterFormData({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        city,
        area,
        sector,
        catalog_category_id: categoryId,
        near_areas: selectedNearAreas,
        full_address: fullAddress,
        terms: true,
        profile_image: profileImage!,
      });

      await registerSeller(formData);

      // Clean up temporary local image file on success
      if (profileImage?.uri) {
        await cleanupTempFiles([profileImage.uri]);
      }

      // Navigate to waiting-for-approval screen
      router.replace({
        pathname: '/(auth)/waiting-approval' as any,
        params: {
          role: 'seller',
          email: email.trim().toLowerCase(),
        },
      });
    } catch (err: unknown) {
      console.error('[SellerRegister Error]', err);
      if (err instanceof ApiError) {
        if (err.code === 'VALIDATION_ERROR' && err.errors) {
          const mapped: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(err.errors)) {
            if (msgs && msgs[0]) mapped[key] = msgs[0];
          }
          setFieldErrors(mapped);
        } else {
          setGeneralError(err.message);
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message || t('errors.UNKNOWN_ERROR'));
      } else {
        setGeneralError(t('errors.UNKNOWN_ERROR'));
      }
    } finally {
      setIsSubmitting(false);
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backButtonText}>← {t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('sellerRegisterTitle')}</Text>
          <Text style={styles.subtitle}>{t('sellerRegisterSubtitle')}</Text>
        </View>

        {generalError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{generalError}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          {/* Shop Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('nameLabel')}</Text>
            <TextInput
              style={[styles.input, fieldErrors.name && styles.inputError]}
              placeholder="e.g. Al-Madina Superstore"
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={setName}
              editable={!isSubmitting}
            />
            {fieldErrors.name ? (
              <Text style={styles.fieldError}>{fieldErrors.name}</Text>
            ) : null}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('emailLabel')}</Text>
            <TextInput
              style={[styles.input, fieldErrors.email && styles.inputError]}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
            {fieldErrors.email ? (
              <Text style={styles.fieldError}>{fieldErrors.email}</Text>
            ) : null}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('passwordLabel')}</Text>
            <TextInput
              style={[styles.input, fieldErrors.password && styles.inputError]}
              placeholder={t('passwordPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isSubmitting}
            />
            {fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password}</Text>
            ) : null}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('confirmPasswordLabel')}</Text>
            <TextInput
              style={[
                styles.input,
                fieldErrors.password_confirmation && styles.inputError,
              ]}
              placeholder={t('confirmPasswordPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              secureTextEntry
              autoCapitalize="none"
              editable={!isSubmitting}
            />
            {fieldErrors.password_confirmation ? (
              <Text style={styles.fieldError}>
                {fieldErrors.password_confirmation}
              </Text>
            ) : null}
          </View>

          {/* Profile / Store Front Image */}
          <ImageSlotPicker
            label={t('profileImageLabel')}
            value={profileImage}
            onChange={(val) => {
              setProfileImage(val);
              if (fieldErrors.profile_image) {
                setFieldErrors((prev) => ({ ...prev, profile_image: '' }));
              }
            }}
            error={fieldErrors.profile_image}
            disabled={isSubmitting}
          />

          {/* Shop Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('shopCategoryLabel')}</Text>
            {isLoadingMeta ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <View style={styles.chipsContainer}>
                {categories.map((cat) => {
                  const isSelected = String(categoryId) === String(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => setCategoryId(cat.id)}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {fieldErrors.catalog_category_id ? (
              <Text style={styles.fieldError}>
                {fieldErrors.catalog_category_id}
              </Text>
            ) : null}
          </View>

          {/* Sector Single Select */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('sectorLabel')}</Text>
            <View style={styles.sectorRow}>
              {sectors.map((sec) => {
                const isSelected = sector === sec;
                return (
                  <TouchableOpacity
                    key={sec}
                    style={[
                      styles.sectorButton,
                      isSelected && styles.sectorButtonSelected,
                    ]}
                    onPress={() => setSector(sec)}
                    disabled={isSubmitting}
                  >
                    <Text
                      style={[
                        styles.sectorButtonText,
                        isSelected && styles.sectorButtonTextSelected,
                      ]}
                    >
                      Sector {sec}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {fieldErrors.sector ? (
              <Text style={styles.fieldError}>{fieldErrors.sector}</Text>
            ) : null}
          </View>

          {/* Near Areas Multi-Select Chip List */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('nearAreasLabel')}</Text>
            <View style={styles.chipsContainer}>
              {availableNearAreas.map((areaItem) => {
                const isSelected = selectedNearAreas.includes(areaItem);
                return (
                  <TouchableOpacity
                    key={areaItem}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                    onPress={() => toggleNearArea(areaItem)}
                    disabled={isSubmitting}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {areaItem} {isSelected ? '✓' : '+'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {fieldErrors.near_areas ? (
              <Text style={styles.fieldError}>{fieldErrors.near_areas}</Text>
            ) : null}
          </View>

          {/* Full Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('fullAddressLabel')}</Text>
            <TextInput
              style={[
                styles.input,
                styles.addressInput,
                fieldErrors.full_address && styles.inputError,
              ]}
              placeholder={t('fullAddressPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
              value={fullAddress}
              onChangeText={setFullAddress}
              editable={!isSubmitting}
            />
            {fieldErrors.full_address ? (
              <Text style={styles.fieldError}>{fieldErrors.full_address}</Text>
            ) : null}
          </View>

          {/* Terms Checkbox */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxTouch}
              onPress={() => setTermsAccepted(!termsAccepted)}
              disabled={isSubmitting}
            >
              <View
                style={[
                  styles.checkbox,
                  termsAccepted && styles.checkboxChecked,
                ]}
              >
                {termsAccepted ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
            </TouchableOpacity>

            <View style={styles.termsTextRow}>
              <Text style={styles.termsNormalText}>I agree to the </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/terms' as any)}
                disabled={isSubmitting}
              >
                <Text style={styles.termsLinkText}>
                  Terms of Service & Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {fieldErrors.terms ? (
            <Text style={styles.fieldError}>{fieldErrors.terms}</Text>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.card} />
            ) : (
              <Text style={styles.submitButtonText}>
                {t('registerSubmit')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  addressInput: {
    height: 80,
    paddingTop: theme.spacing.sm,
    textAlignVertical: 'top',
  },
  fieldError: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: 4,
  },
  sectorRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sectorButton: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  sectorButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  sectorButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  sectorButtonTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  chipTextSelected: {
    color: theme.colors.card,
    fontWeight: theme.fontWeight.semibold,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  checkboxTouch: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.card,
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsTextRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 6,
  },
  termsNormalText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  termsLinkText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
  submitButton: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
  submitButtonText: {
    color: theme.colors.card,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
