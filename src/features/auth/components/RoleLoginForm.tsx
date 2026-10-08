import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { UserRole } from '../../../api/types';
import { loginByRole, resendOtp } from '../../../api/auth';
import { ApiError } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';
import { loginSchema } from '../schemas';
import { theme } from '../../../theme';
import { t } from '../../../i18n';
import { Config } from '../../../config';
import { getRoleHome } from '../../../utils/roleGuard';
import { BrandLogo } from '../../../components/BrandLogo';

interface RoleLoginFormProps {
  role: UserRole;
  initialEmail?: string;
}

export const RoleLoginForm: React.FC<RoleLoginFormProps> = ({ role, initialEmail = '' }) => {
  const router = useRouter();
  const setSessionAuth = useAuthStore((s) => s.setSessionAuth);

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isNetworkError, setIsNetworkError] = useState(false);

  // Cooldown countdown timer for 429 / TOO_MANY_ATTEMPTS
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleLogin = async () => {
    if (cooldownSeconds > 0 || isSubmitting) return;

    setGeneralError(null);
    setFieldErrors({});
    setIsNetworkError(false);

    // Client-side schema validation
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'email' && !errors.email) {
          errors.email = issue.message;
        } else if (issue.path[0] === 'password' && !errors.password) {
          errors.password = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await loginByRole(role, {
        email: email.trim().toLowerCase(),
        password,
      });

      await setSessionAuth(role, data.token, data.user);
      const targetHome = getRoleHome(role);
      router.replace(targetHome as any);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_CREDENTIALS') {
          // Never disclose whether the email exists
          setGeneralError(t('errors.INVALID_CREDENTIALS'));
        } else if (err.code === 'ACCOUNT_NOT_VERIFIED' && role === 'customer') {
          // Trigger resend-otp and navigate to OTP verification screen
          try {
            await resendOtp({ email: email.trim().toLowerCase() });
          } catch {
            // Non-blocking if resend was rate-limited
          }
          router.push({
            pathname: '/(auth)/otp' as any,
            params: { email: email.trim().toLowerCase() },
          });
        } else if (err.code === 'PENDING_APPROVAL') {
          // Navigate to waiting-for-approval screen
          router.push({
            pathname: '/(auth)/waiting-approval' as any,
            params: {
              role,
              email: email.trim().toLowerCase(),
              fromLogin: 'true',
            },
          });
        } else if (err.code === 'ACCOUNT_REMOVED') {
          setGeneralError(
            t('errors.ACCOUNT_REMOVED', {
              contact: `${Config.support.phone} / ${Config.support.email}`,
            })
          );
        } else if (err.status === 429 || err.code === 'TOO_MANY_ATTEMPTS') {
          const waitTime = err.retryAfterSeconds ?? 60;
          setCooldownSeconds(waitTime);
          setGeneralError(err.message || t('errors.TOO_MANY_ATTEMPTS'));
        } else if (err.code === 'VALIDATION_ERROR') {
          const errors: { email?: string; password?: string } = {};
          if (err.errors.email?.[0]) errors.email = err.errors.email[0];
          if (err.errors.password?.[0]) errors.password = err.errors.password[0];
          setFieldErrors(errors);
        } else if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT_ERROR') {
          setIsNetworkError(true);
          setGeneralError(err.message);
        } else {
          setGeneralError(err.message || t('errors.UNKNOWN_ERROR'));
        }
      } else {
        setGeneralError(t('errors.UNKNOWN_ERROR'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubheader = () => {
    switch (role) {
      case 'customer':
        return t('loginSubheaderCustomer');
      case 'seller':
        return t('loginSubheaderSeller');
      case 'rider':
        return t('loginSubheaderRider');
      case 'admin':
        return t('loginSubheaderAdmin');
    }
  };

  const getRegisterRoute = () => {
    switch (role) {
      case 'customer':
        return '/(auth)/register';
      case 'seller':
        return '/(auth)/seller-register';
      case 'rider':
        return '/(auth)/rider-register';
      case 'admin':
        return null;
    }
  };

  const registerRoute = getRegisterRoute();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <BrandLogo variant="mark" height={28} style={{ marginBottom: theme.spacing.sm }} />
          <Text style={styles.title}>{t('loginHeader')}</Text>
          <Text style={styles.subtitle}>{getSubheader()}</Text>
        </View>

        {generalError ? (
          <View
            style={[
              styles.errorBanner,
              isNetworkError && styles.networkErrorBanner,
            ]}
          >
            <Text style={styles.errorBannerText}>{generalError}</Text>
            {isNetworkError && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>{t('retry')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {cooldownSeconds > 0 ? (
          <View style={styles.cooldownBanner}>
            <Text style={styles.cooldownText}>
              {t('retryCountdown', { seconds: cooldownSeconds })}
            </Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('emailLabel')}</Text>
            <TextInput
              style={[
                styles.input,
                fieldErrors.email ? styles.inputError : undefined,
              ]}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!isSubmitting}
            />
            {fieldErrors.email ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
            ) : null}
          </View>

          {/* Password Input with Show/Hide */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('passwordLabel')}</Text>
            <View
              style={[
                styles.passwordRow,
                fieldErrors.password ? styles.inputError : undefined,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                placeholder={t('passwordPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isSubmitting}
              />
              <TouchableOpacity
                style={styles.showHideButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.showHideText}>
                  {showPassword ? t('hidePassword') : t('showPassword')}
                </Text>
              </TouchableOpacity>
            </View>
            {fieldErrors.password ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>
            ) : null}
          </View>

          {/* Forgot Password Link (Hidden for admin) */}
          {role !== 'admin' && (
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => {
                router.push({
                  pathname: '/(auth)/forgot-password' as any,
                  params: { role, email },
                });
              }}
              disabled={isSubmitting}
            >
              <Text style={styles.forgotPasswordText}>
                {t('forgotPasswordLink')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || cooldownSeconds > 0) && styles.submitButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isSubmitting || cooldownSeconds > 0}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.card} />
            ) : (
              <Text style={styles.submitButtonText}>
                {cooldownSeconds > 0
                  ? t('retryCountdown', { seconds: cooldownSeconds })
                  : t('loginSubmit')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Registration Link (Hidden for admin) */}
          {registerRoute && (
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{t('noAccount')} </Text>
              <TouchableOpacity
                onPress={() => router.push(registerRoute as any)}
                disabled={isSubmitting}
              >
                <Text style={styles.footerLink}>{t('signUpLink')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Back link */}
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.replace('/(auth)/welcome' as any)}
            disabled={isSubmitting}
          >
            <Text style={styles.backLinkText}>← {t('back')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
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
  fieldErrorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: 4,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  showHideButton: {
    paddingHorizontal: theme.spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  showHideText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  submitButton: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
  submitButtonText: {
    color: theme.colors.card,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  errorBanner: {
    backgroundColor: '#FDE8E8',
    borderColor: '#F98080',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  networkErrorBanner: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  errorBannerText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.sm,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  retryButtonText: {
    color: theme.colors.card,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  cooldownBanner: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  cooldownText: {
    color: '#E65100',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    minHeight: 44,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  footerLink: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  backLinkText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
});
