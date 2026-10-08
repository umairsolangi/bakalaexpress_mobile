import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { UserRole } from '../../../api/types';
import { deleteAccountByRole } from '../../../api/auth';
import { ApiError } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';
import { theme } from '../../../theme';
import { t } from '../../../i18n';

interface DeleteAccountModalProps {
  visible: boolean;
  role: UserRole;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  role,
  onClose,
}) => {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCustomer = role === 'customer';

  const resetState = () => {
    setPassword('');
    setReason('');
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (!password.trim()) {
      setErrorMessage(t('enterPasswordToConfirm'));
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await deleteAccountByRole(role, {
        password: password.trim(),
        reason: reason.trim() || undefined,
      });

      if (isCustomer) {
        // Customer account is deleted immediately
        Alert.alert(t('deleteAccountConfirmTitle'), t('deletionSuccessCustomer'), [
          {
            text: t('confirm'),
            onPress: async () => {
              handleClose();
              await clearAuth();
              router.replace('/(auth)/welcome' as any);
            },
          },
        ]);
      } else {
        // Partner deletion request submitted
        Alert.alert(t('deleteAccountConfirmTitle'), t('deletionSuccessPartner'), [
          {
            text: t('confirm'),
            onPress: () => {
              handleClose();
            },
          },
        ]);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'HAS_ACTIVE_ORDERS') {
          setErrorMessage(t('errors.HAS_ACTIVE_ORDERS'));
        } else if (err.code === 'INVALID_PASSWORD' || err.code === 'WRONG_PASSWORD') {
          setErrorMessage(t('errors.INVALID_PASSWORD'));
        } else if (
          err.code === 'DELETION_REQUEST_PENDING' ||
          err.code === 'DELETION_COOLDOWN'
        ) {
          setErrorMessage(t('errors.DELETION_REQUEST_PENDING'));
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage(t('errors.UNKNOWN_ERROR'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{t('deleteAccountConfirmTitle')}</Text>
          <Text style={styles.modalPrompt}>
            {isCustomer
              ? t('deleteAccountPromptCustomer')
              : t('deleteAccountPromptPartner')}
          </Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Password Input */}
          <Text style={styles.inputLabel}>{t('passwordLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('passwordPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              if (errorMessage) setErrorMessage(null);
            }}
            editable={!isSubmitting}
          />

          {/* Reason Input for partners */}
          {!isCustomer && (
            <>
              <Text style={styles.inputLabel}>{t('deleteReasonLabel')}</Text>
              <TextInput
                style={[styles.input, styles.reasonInput]}
                placeholder={t('deleteReasonPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={3}
                value={reason}
                onChangeText={setReason}
                editable={!isSubmitting}
              />
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, isSubmitting && styles.deleteButtonDisabled]}
              onPress={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.card} size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>{t('deleteAccountButton')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadow.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  modalPrompt: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  errorBox: {
    backgroundColor: '#FDE8E8',
    borderColor: '#F98080',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
  },
  inputLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.md,
  },
  reasonInput: {
    height: 80,
    paddingTop: theme.spacing.sm,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  cancelButton: {
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  deleteButton: {
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: theme.colors.card,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
});
