import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { processImageForUpload, ImageValidationError } from '../utils/image';
import { theme } from '../theme';
import { t } from '../i18n';

export interface ImageSlotValue {
  uri: string;
  name?: string;
  type?: string;
}

interface ImageSlotPickerProps {
  label: string;
  value: ImageSlotValue | null;
  onChange: (val: ImageSlotValue | null) => void;
  error?: string;
  disabled?: boolean;
}

export const ImageSlotPicker: React.FC<ImageSlotPickerProps> = ({
  label,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      if (status !== 'granted') {
        let proceed = false;
        await new Promise<void>((resolve) => {
          Alert.alert(
            t('appName'),
            t('cameraPermissionExpl'),
            [
              { text: t('cancel'), style: 'cancel', onPress: () => resolve() },
              {
                text: t('confirm'),
                onPress: () => {
                  proceed = true;
                  resolve();
                },
              },
            ]
          );
        });

        if (!proceed) return;

        const req = await ImagePicker.requestCameraPermissionsAsync();
        if (req.status !== 'granted') {
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processAndSet(result.assets[0]);
      }
    } catch {
      // ignore
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        let proceed = false;
        await new Promise<void>((resolve) => {
          Alert.alert(
            t('appName'),
            t('galleryPermissionExpl'),
            [
              { text: t('cancel'), style: 'cancel', onPress: () => resolve() },
              {
                text: t('confirm'),
                onPress: () => {
                  proceed = true;
                  resolve();
                },
              },
            ]
          );
        });

        if (!proceed) return;

        const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (req.status !== 'granted') {
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processAndSet(result.assets[0]);
      }
    } catch {
      // ignore
    }
  };

  const processAndSet = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsProcessing(true);
    try {
      const processed = await processImageForUpload({
        uri: asset.uri,
        type: 'image/jpeg',
        width: asset.width || undefined,
        height: asset.height || undefined,
        fileName: asset.fileName || 'upload.jpg',
      });

      onChange({
        uri: processed.uri,
        name: processed.name,
        type: processed.type,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : err && typeof err === 'object' && 'message' in err
          ? String((err as any).message)
          : t('imageTooLarge');
      Alert.alert(t('appName'), msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const showPickerOptions = () => {
    if (disabled || isProcessing) return;
    Alert.alert(label, t('profileImageLabel'), [
      { text: t('takePhoto'), onPress: handlePickFromCamera },
      { text: t('chooseGallery'), onPress: handlePickFromGallery },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {isProcessing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      ) : value ? (
        <View style={styles.previewCard}>
          <Image source={{ uri: value.uri }} style={styles.thumbnail} />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={showPickerOptions}
              disabled={disabled}
            >
              <Text style={styles.retakeButtonText}>{t('retakeDoc')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onChange(null)}
              disabled={disabled}
            >
              <Text style={styles.removeButtonText}>{t('removeDoc')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadBox, error ? styles.uploadBoxError : undefined]}
          onPress={showPickerOptions}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.uploadIcon}>📷</Text>
          <Text style={styles.uploadText}>{t('takePhoto')} / {t('chooseGallery')}</Text>
        </TouchableOpacity>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  uploadBox: {
    height: 90,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  uploadBoxError: {
    borderColor: theme.colors.error,
  },
  uploadIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  uploadText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  loadingBox: {
    height: 90,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
  },
  previewActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  retakeButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeButtonText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  removeButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    backgroundColor: '#FDE8E8',
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.semibold,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: 4,
  },
});
