import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { registerSchema, RegisterFormData } from './schemas';
import { registerCustomer } from '../../api/auth';
import { ApiError } from '../../api/client';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { t } from '../../i18n';

export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      mobile: '',
      city: 'Karachi',
      address: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setGeneralError(null);
    setIsSubmitting(true);
    try {
      const emailNormalized = data.email.toLowerCase().trim();
      await registerCustomer({
        name: data.name.trim(),
        email: emailNormalized,
        password: data.password,
        password_confirmation: data.password_confirmation,
        mobile: data.mobile ? data.mobile.trim() : undefined,
        city: data.city ? data.city.trim() : undefined,
        address: data.address ? data.address.trim() : undefined,
      });

      router.push({
        pathname: '/(auth)/otp',
        params: { email: emailNormalized },
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.errors) {
          Object.entries(err.errors).forEach(([field, messages]) => {
            const fieldName = field as keyof RegisterFormData;
            if (messages && messages.length > 0) {
              setError(fieldName, { message: messages[0] });
            }
          });
        }
        setGeneralError(err.message || t('errors.VALIDATION_ERROR'));
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
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('nameLabel')}
            placeholder={t('namePlaceholder')}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.name?.message}
          />
        )}
      />

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

      <Controller
        control={control}
        name="password_confirmation"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('confirmPasswordLabel')}
            placeholder={t('confirmPasswordPlaceholder')}
            isPassword
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.password_confirmation?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="mobile"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('mobileLabel')}
            placeholder={t('mobilePlaceholder')}
            keyboardType="phone-pad"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.mobile?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="city"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('cityLabel')}
            placeholder={t('cityPlaceholder')}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.city?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('addressLabel')}
            placeholder={t('addressPlaceholder')}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.address?.message}
          />
        )}
      />

      <Button
        title={t('registerSubmit')}
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
  submitButton: {
    marginTop: theme.spacing.md,
  },
});
