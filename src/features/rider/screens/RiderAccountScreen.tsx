import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { RiderProfile } from '../../../api/types';
import { DeleteAccountModal } from '../../auth/components/DeleteAccountModal';
import { theme } from '../../../theme';
import { t } from '../../../i18n';

export const RiderAccountScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user) as RiderProfile | null;
  const logout = useAuthStore((s) => s.logout);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(t('logoutConfirmTitle'), t('logoutConfirmMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logoutButton'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/welcome' as any);
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backButtonText}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('accountTitle')}</Text>
      </View>

      {/* Profile Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>{t('profileInfo')}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('nameLabel')}</Text>
          <Text style={styles.infoValue}>{user?.name || ''}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('emailLabel')}</Text>
          <Text style={styles.infoValue}>{user?.email || ''}</Text>
        </View>

        {user?.phone ? (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('phoneLabel')}</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
          </>
        ) : null}

        {user?.vehicle_type ? (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('vehicleTypeLabel')}</Text>
              <Text style={styles.infoValue}>{user.vehicle_type}</Text>
            </View>
          </>
        ) : null}

        {user?.vehicle_number ? (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('vehicleNumberLabel')}</Text>
              <Text style={styles.infoValue}>{user.vehicle_number}</Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutButtonText}>{t('logoutButton')}</Text>
      </TouchableOpacity>

      {/* Delete Account Row */}
      <TouchableOpacity
        style={styles.deleteRow}
        onPress={() => setShowDeleteModal(true)}
        hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
      >
        <Text style={styles.deleteText}>{t('deleteAccountButton')}</Text>
      </TouchableOpacity>

      <DeleteAccountModal
        visible={showDeleteModal}
        role="rider"
        onClose={() => setShowDeleteModal(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    minHeight: 36,
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  backButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
    ...theme.shadow.sm,
  },
  cardSectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.medium,
    maxWidth: '65%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  logoutButton: {
    height: 48,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    marginBottom: theme.spacing.md,
  },
  logoutButtonText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  deleteRow: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.medium,
    textDecorationLine: 'underline',
  },
});
