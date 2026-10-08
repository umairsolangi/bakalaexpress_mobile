import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordFormData } from '../../src/features/auth/schemas';
import { resetPasswordByRole, forgotPasswordByRole } from '../../src/api/auth';
import { ApiError } from '../../src/api/client';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';
import { UserRole } from '../../src/api/types';
import { isValidRole } from '../../src/api/session';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string; email?: string }>();
  const emailParam = params.email || '';
  const roleParam = params.role as string | undefined;
  const role: UserRole = isValidRole(roleParam) && roleParam !== 'admin' ? roleParam : 'customer';

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // 60-second countdown for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailParam,
      otp: '',
      password: '',
      password_confirmation: '',
    },
  });

  const handleResend = async () => {
    if (resendCountdown > 0 || isResending) return;
    setIsResending(true);
    setResendSuccess(false);
    setGeneralError(null);

    try {
      await forgotPasswordByRole(role, { email: emailParam.toLowerCase().trim() });
      setResendCountdown(60);
      setResendSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
      } else {
        setGeneralError(t('errors.NETWORK_ERROR'));
      }
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    setGeneralError(null);
    setIsSubmitting(true);
    try {
      await resetPasswordByRole(role, {
        email: data.email.toLowerCase().trim(),
        otp: data.otp.trim(),
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      Alert.alert(t('appName'), t('passwordResetSuccess'), [
        {
          text: t('confirm'),
          onPress: () =>
            router.replace({
              pathname: '/(auth)/login' as any,
              params: { role, email: data.email.toLowerCase().trim() },
            }),
        },
      ]);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.errors) {
          Object.entries(err.errors).forEach(([field, messages]) => {
            const fieldName = field as keyof ResetPasswordFormData;
            if (messages && messages[0]) {
              setError(fieldName, { message: messages[0] });
            }
          });
        }
        setGeneralError(err.message);
      } else {
        setGeneralError(t('errors.NETWORK_ERROR'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen keyboardAvoiding scrollable>
      <Header title="" showBack />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('resetPasswordHeader')}</Text>
          <Text style={styles.subtitle}>{t('resetPasswordSubheader')}</Text>
        </View>

        {generalError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{generalError}</Text>
          </View>
        ) : null}

        {resendSuccess ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>{t('otpResentSuccess')}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('emailLabel')}
              placeholder={t('emailPlaceholder')}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="otp"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('resetOtpLabel')}
              placeholder={t('resetOtpPlaceholder')}
              keyboardType="number-pad"
              maxLength={6}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.otp?.message}
            />
          )}
        />

        {/* 60s Resend countdown button */}
        <View style={styles.resendRow}>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendCountdown > 0 || isResending}
            style={styles.resendButton}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          >
            <Text
              style={[
                styles.resendText,
                resendCountdown > 0 && styles.resendTextDisabled,
              ]}
            >
              {resendCountdown > 0
                ? t('resendCountdown', { seconds: resendCountdown })
                : isResending
                ? t('loading')
                : t('resendOtp')}
            </Text>
          </TouchableOpacity>
        </View>

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('newPasswordLabel')}
              placeholder={t('newPasswordPlaceholder')}
              isPassword
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password_confirmation"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('confirmNewPasswordLabel')}
              placeholder={t('confirmNewPasswordPlaceholder')}
              isPassword
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.password_confirmation?.message}
            />
          )}
        />

        <Button
          title={t('resetPasswordSubmit')}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          style={styles.submitButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  errorBannerText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  successBanner: {
    backgroundColor: '#DEF7EC',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#31C48D',
  },
  successBannerText: {
    color: '#03543F',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  resendRow: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  resendButton: {
    minHeight: 32,
    justifyContent: 'center',
  },
  resendText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  resendTextDisabled: {
    color: theme.colors.textMuted,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
});
