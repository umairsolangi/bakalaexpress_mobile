import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { OtpInput } from '../../src/features/auth/OtpInput';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || '';

  return (
    <Screen keyboardAvoiding scrollable>
      <Header title="" showBack onBack={() => router.back()} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('otpHeader')}</Text>
          <Text style={styles.subtitle}>{t('otpSubheader')}</Text>
        </View>

        <OtpInput email={email} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
