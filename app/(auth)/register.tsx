import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { RegisterForm } from '../../src/features/auth/RegisterForm';
import { BrandLogo } from '../../src/components/BrandLogo';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <Screen keyboardAvoiding scrollable>
      <Header title="" showBack />
      <View style={styles.container}>
        <View style={styles.header}>
          <BrandLogo variant="mark" height={28} style={{ marginBottom: theme.spacing.sm }} />
          <Text style={styles.title}>{t('registerHeader')}</Text>
          <Text style={styles.subtitle}>{t('registerSubheader')}</Text>
        </View>

        <RegisterForm />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{t('alreadyHaveAccount')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={styles.linkButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.linkText}>{t('signInLink')}</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: theme.spacing.lg,
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
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  linkButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
});
