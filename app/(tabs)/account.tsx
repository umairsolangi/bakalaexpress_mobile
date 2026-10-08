import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { DeleteAccountModal } from '../../src/features/auth/components/DeleteAccountModal';
import { CustomerUser } from '../../src/api/types';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user) as CustomerUser | null;
  const logout = useAuthStore((s) => s.logout);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('logoutConfirmTitle'),
      t('logoutConfirmMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logoutButton'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  return (
    <Screen scrollable style={styles.container}>
      <Header title={t('accountTitle')} />

      <View style={styles.body}>
        {user ? (
          <>
            {/* User Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Badge label="Verified Customer" variant="success" style={styles.badge} />
              </View>
            </View>

            {/* Quick Actions / My Orders */}
            <TouchableOpacity
              style={styles.ordersNavCard}
              activeOpacity={0.7}
              onPress={() => router.push('/orders' as any)}
            >
              <View style={styles.ordersNavLeft}>
                <View style={styles.ordersNavIconWrap}>
                  <Text style={styles.ordersNavIcon}>📦</Text>
                </View>
                <View>
                  <Text style={styles.ordersNavTitle}>My Orders</Text>
                  <Text style={styles.ordersNavSubtitle}>
                    Track deliveries & view past order receipts
                  </Text>
                </View>
              </View>
              <Text style={styles.ordersNavArrow}>›</Text>
            </TouchableOpacity>

            {/* Quick Actions / My Favorites */}
            <TouchableOpacity
              style={styles.ordersNavCard}
              activeOpacity={0.7}
              onPress={() => router.push('/favorites' as any)}
            >
              <View style={styles.ordersNavLeft}>
                <View style={[styles.ordersNavIconWrap, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={styles.ordersNavIcon}>❤️</Text>
                </View>
                <View>
                  <Text style={styles.ordersNavTitle}>My Favorites</Text>
                  <Text style={styles.ordersNavSubtitle}>
                    Saved grocery stores & favorite items
                  </Text>
                </View>
              </View>
              <Text style={styles.ordersNavArrow}>›</Text>
            </TouchableOpacity>

            {/* Notifications Inbox */}
            <TouchableOpacity
              style={styles.ordersNavCard}
              activeOpacity={0.7}
              onPress={() => router.push('/notifications' as any)}
            >
              <View style={styles.ordersNavLeft}>
                <View style={[styles.ordersNavIconWrap, { backgroundColor: '#E0E7FF' }]}>
                  <Text style={styles.ordersNavIcon}>🔔</Text>
                </View>
                <View>
                  <Text style={styles.ordersNavTitle}>Notifications</Text>
                  <Text style={styles.ordersNavSubtitle}>
                    Order updates, deliveries & announcements
                  </Text>
                </View>
              </View>
              <Text style={styles.ordersNavArrow}>›</Text>
            </TouchableOpacity>

            {/* Details Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>{t('profileInfo')}</Text>
                <TouchableOpacity
                  onPress={() => router.push('/profile/edit' as any)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.editLink}>Edit ✏️</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('mobileLabel')}</Text>
                <Text style={styles.infoValue}>
                  {user.mobile || user.phone || 'Not provided'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('cityLabel')}</Text>
                <Text style={styles.infoValue}>{user.city || 'Karachi'}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('addressLabel')}</Text>
                <Text style={styles.infoValue}>
                  {user.address || 'Baldia Town, Karachi'}
                </Text>
              </View>
            </View>

            {/* Security Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Security</Text>
              </View>
              <TouchableOpacity
                style={styles.securityRow}
                onPress={() => router.push('/profile/change-password' as any)}
              >
                <Text style={styles.securityLabel}>Change Password</Text>
                <Text style={styles.ordersNavArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* About Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>{t('aboutBakala')}</Text>
              <Text style={styles.aboutText}>
                Hyper-local grocery delivery network designed exclusively for Baldia Town, Karachi.
              </Text>
              <Text style={styles.versionText}>{t('version')}</Text>
            </View>

            {/* Logout Button */}
            <Button
              title={t('logoutButton')}
              onPress={handleLogout}
              variant="outline"
              style={styles.logoutButton}
              textStyle={styles.logoutText}
            />

            {/* Delete Account Row */}
            <TouchableOpacity
              style={styles.deleteAccountRow}
              onPress={() => setShowDeleteModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
            >
              <Text style={styles.deleteAccountText}>{t('deleteAccountButton')}</Text>
            </TouchableOpacity>

            <DeleteAccountModal
              visible={showDeleteModal}
              role="customer"
              onClose={() => setShowDeleteModal(false)}
            />
          </>
        ) : (
          /* Guest State */
          <View style={styles.guestContainer}>
            <View style={styles.guestIconCircle}>
              <Text style={styles.guestIcon}>👤</Text>
            </View>

            <Text style={styles.guestTitle}>{t('guestAccountTitle')}</Text>
            <Text style={styles.guestSubtitle}>{t('guestAccountSubtitle')}</Text>

            <View style={styles.guestActions}>
              <Button
                title={t('loginButton')}
                onPress={() => router.push('/(auth)/login')}
                style={styles.guestBtn}
              />
              <Button
                title={t('registerButton')}
                onPress={() => router.push('/(auth)/register')}
                variant="outline"
                style={styles.guestBtn}
              />
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    padding: theme.spacing.screen,
    gap: theme.spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
    gap: theme.spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryDark,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    marginTop: 6,
  },
  ordersNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  ordersNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  ordersNavIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordersNavIcon: {
    fontSize: 22,
  },
  ordersNavTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  ordersNavSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  ordersNavArrow: {
    fontSize: 24,
    color: theme.colors.textMuted,
    fontWeight: '300',
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  editLink: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  securityLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  aboutText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  versionText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  logoutButton: {
    marginTop: theme.spacing.md,
    borderColor: theme.colors.error,
  },
  logoutText: {
    color: theme.colors.error,
  },
  guestContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.xl,
    ...theme.shadow.md,
  },
  guestIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  guestIcon: {
    fontSize: 36,
  },
  guestTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  guestSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
    maxWidth: 280,
  },
  guestActions: {
    width: '100%',
    gap: theme.spacing.md,
  },
  guestBtn: {
    width: '100%',
  },
  deleteAccountRow: {
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  deleteAccountText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.medium,
    textDecorationLine: 'underline',
  },
});
