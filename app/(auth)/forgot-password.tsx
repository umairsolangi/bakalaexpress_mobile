import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../../src/features/auth/schemas';
import { forgotPasswordByRole } from '../../src/api/auth';
import { ApiError } from '../../src/api/client';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';
import { UserRole } from '../../src/api/types';
import { isValidRole } from '../../src/api/session';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string; email?: string }>();
  const roleParam = params.role as string | undefined;
  const role: UserRole = isValidRole(roleParam) && roleParam !== 'admin' ? roleParam : 'customer';

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: params.email || '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setGeneralError(null);
    setIsSubmitting(true);
    try {
      const emailNormalized = data.email.toLowerCase().trim();
      await forgotPasswordByRole(role, { email: emailNormalized });

      router.push({
        pathname: '/(auth)/reset-password' as any,
        params: { role, email: emailNormalized },
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
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
          <Text style={styles.title}>{t('forgotPasswordHeader')}</Text>
          <Text style={styles.subtitle}>{t('forgotPasswordSubheader')}</Text>
        </View>

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

        <Button
          title={t('sendResetOtpSubmit')}
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
  submitButton: {
    marginTop: theme.spacing.md,
  },
});
