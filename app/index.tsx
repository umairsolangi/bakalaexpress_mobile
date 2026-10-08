import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { theme } from '../src/theme';
import { t } from '../src/i18n';
import { getRoleHome } from '../src/utils/roleGuard';
import { BrandLogo } from '../src/components/BrandLogo';

export default function SplashScreen() {
  const router = useRouter();
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { isValid, role } = await initAuth();
      if (!isMounted) return;

      if (isValid && role) {
        const homePath = getRoleHome(role);
        router.replace(homePath as any);
      } else {
        router.replace('/(auth)/welcome' as any);
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [initAuth, router]);

  return (
    <View style={styles.container}>
      <View style={styles.brandBox}>
        <BrandLogo variant="full" width={220} style={styles.logo} />
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>🌿 {t('tagline')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Starting Bakala Express...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  brandBox: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: theme.spacing.lg,
  },
  badgePill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  footer: {
    position: 'absolute',
    bottom: 56,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: theme.colors.mutedText,
    fontWeight: theme.fontWeight.medium,
  },
});
