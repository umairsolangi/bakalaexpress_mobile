import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <Screen scrollable style={styles.container}>
      <Header title="" showBack />
      <View style={styles.content}>
        <Text style={styles.title}>{t('termsTitle')}</Text>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>⚠️ {t('termsNotice')}</Text>
        </View>

        <View style={styles.textBox}>
          <Text style={styles.bodyText}>{t('termsContent')}</Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>{t('close')}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
  },
  content: {
    paddingBottom: theme.spacing.xxxl,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  noticeBox: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  noticeText: {
    fontSize: theme.fontSize.xs,
    color: '#92400E',
    fontWeight: theme.fontWeight.medium,
    lineHeight: 18,
  },
  textBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  bodyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  closeButton: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: theme.colors.card,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
