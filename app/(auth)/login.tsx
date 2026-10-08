import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RoleLoginForm } from '../../src/features/auth/components/RoleLoginForm';
import { UserRole } from '../../src/api/types';
import { isValidRole } from '../../src/api/session';
import { Config } from '../../src/config';
import { theme } from '../../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string; email?: string }>();

  const roleParam = params.role as string | undefined;
  const activeRole: UserRole = isValidRole(roleParam) ? roleParam : 'customer';

  // Guard: if admin login is disabled via feature flag, do not allow viewing admin login
  useEffect(() => {
    if (activeRole === 'admin' && !Config.enableAdminLogin) {
      router.replace('/(auth)/welcome' as any);
    }
  }, [activeRole, router]);

  return (
    <View style={styles.container}>
      <RoleLoginForm
        role={activeRole}
        initialEmail={params.email || ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
