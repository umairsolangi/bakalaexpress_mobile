import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { loginSchema, LoginFormData } from './schemas';
import { loginCustomer, resendOtp } from '../../api/auth';
import { ApiError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { t } from '../../i18n';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setGeneralError(null);
    setIsSubmitting(true);
    try {
      const response = await loginCustomer({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      if (response.data.user) {
        await setAuth(response.data.token, response.data.user);
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'ACCOUNT_NOT_VERIFIED') {
          // Trigger resend-otp and navigate to OTP screen
          try {
            await resendOtp({ email: data.email.toLowerCase().trim() });
          } catch {
            // Even if resend fails, still redirect to verification
          }
          router.push({
            pathname: '/(auth)/otp',
            params: { email: data.email.toLowerCase().trim() },
          });
          return;
        }

        if (err.code === 'TOO_MANY_ATTEMPTS') {
          setGeneralError(t('errors.TOO_MANY_ATTEMPTS'));
          return;
        }

        // Apply field-specific errors if returned
        if (err.errors) {
          Object.entries(err.errors).forEach(([field, messages]) => {
            if (field === 'email' || field === 'password') {
              setError(field, { message: messages[0] });
            }
          });
        }

        setGeneralError(err.message || t('errors.INVALID_CREDENTIALS'));
      } else {
        setGeneralError(t('errors.NETWORK_ERROR'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {generalError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{generalError}</Text>
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
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('passwordLabel')}
            placeholder={t('passwordPlaceholder')}
            isPassword
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />

      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={() => router.push('/(auth)/forgot-password')}
      >
        <Text style={styles.forgotPasswordText}>{t('forgotPasswordLink')}</Text>
      </TouchableOpacity>

      <Button
        title={t('loginSubmit')}
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        style={styles.submitButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    minHeight: 36,
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  submitButton: {
    marginTop: theme.spacing.sm,
  },
});
