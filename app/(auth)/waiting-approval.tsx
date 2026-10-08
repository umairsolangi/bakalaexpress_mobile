import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';
import { UserRole } from '../../src/api/types';
import { isValidRole } from '../../src/api/session';

export default function WaitingApprovalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    role?: string;
    email?: string;
    fromLogin?: string;
  }>();

  const roleParam = params.role as string | undefined;
  const role: UserRole = isValidRole(roleParam) ? roleParam : 'seller';
  const email = params.email || '';
  const fromLogin = params.fromLogin === 'true';

  const handleBackToLogin = () => {
    router.replace({
      pathname: '/(auth)/login' as any,
      params: { role, email },
    });
  };

  const handleTryAgain = () => {
    router.replace({
      pathname: '/(auth)/login' as any,
      params: { role, email },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>⏳</Text>
        </View>

        <Text style={styles.title}>{t('waitingApprovalTitle')}</Text>

        <Text style={styles.description}>
          {t('waitingApprovalDesc')}
        </Text>

        {email ? (
          <View style={styles.emailBadge}>
            <Text style={styles.emailText}>{email}</Text>
          </View>
        ) : null}

        <View style={styles.actionButtons}>
          {fromLogin && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleTryAgain}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{t('tryAgainLogin')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={fromLogin ? styles.secondaryButton : styles.primaryButton}
            onPress={handleBackToLogin}
            activeOpacity={0.8}
          >
            <Text
              style={
                fromLogin
                  ? styles.secondaryButtonText
                  : styles.primaryButtonText
              }
            >
              {t('backToLogin')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  emailBadge: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emailText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.medium,
  },
  actionButtons: {
    width: '100%',
    gap: theme.spacing.md,
  },
  primaryButton: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: theme.colors.card,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  secondaryButton: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
});
