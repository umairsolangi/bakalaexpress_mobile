import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  getSellerVerificationStatus,
  submitSellerVerification,
} from '../../src/api/seller';
import { SellerVerificationStatusData } from '../../src/api/types';
import { theme } from '../../src/theme';

export default function SellerVerificationScreen() {
  const router = useRouter();
  const [statusData, setStatusData] = useState<SellerVerificationStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bizDesc, setBizDesc] = useState('');
  const [verifReason, setVerifReason] = useState('');
  const [docs, setDocs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await getSellerVerificationStatus();
      if (res.data) {
        setStatusData(res.data);
      }
    } catch (e) {
      console.warn('[SellerVerificationScreen] fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handlePickDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocs((prev) => [...prev, result.assets[0].uri]);
      }
    } catch {
      Alert.alert('Selection Error', 'Could not open image picker.');
    }
  };

  const handleSubmit = async () => {
    if (!bizDesc.trim()) {
      Alert.alert('Required', 'Please describe your business.');
      return;
    }
    if (!verifReason.trim()) {
      Alert.alert('Required', 'Please state your reason for verification.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitSellerVerification({
        business_description: bizDesc.trim(),
        reason_for_verification: verifReason.trim(),
        documentUris: docs,
      });
      if (res.data) {
        setStatusData({
          is_verified: false,
          has_submitted: true,
          verification: res.data,
        });
      }
      Alert.alert('Submitted', 'Your verification request has been sent for review.');
    } catch (e: any) {
      Alert.alert('Submission Failed', e.message || 'Could not submit verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Checking verification status...</Text>
      </View>
    );
  }

  const isVerified = statusData?.is_verified ?? false;
  const isPending = statusData?.has_submitted && statusData.verification?.status === 'pending';
  const isRejected = statusData?.verification?.status === 'rejected';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Merchant Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isVerified ? (
          <View style={styles.verifiedCard}>
            <Text style={styles.icon}>🛡️</Text>
            <Text style={styles.titleGreen}>Verified Merchant Partner</Text>
            <Text style={styles.descGreen}>
              Your store is fully verified with official Bakala Express merchant credentials.
            </Text>
          </View>
        ) : isPending ? (
          <View style={styles.pendingCard}>
            <Text style={styles.icon}>⏳</Text>
            <Text style={styles.titleAmber}>Under Review</Text>
            <Text style={styles.descAmber}>
              Your verification application has been submitted and is currently being audited by administration.
            </Text>
            <Text style={styles.timeText}>
              Submitted on: {new Date(statusData.verification?.submitted_at || '').toLocaleDateString()}
            </Text>
          </View>
        ) : (
          <View style={styles.formCard}>
            {isRejected && (
              <View style={styles.rejectedBanner}>
                <Text style={styles.rejectedTitle}>⚠️ Previous Request Declined</Text>
                <Text style={styles.rejectedReason}>
                  Reason: {statusData.verification?.rejection_reason || 'Please provide updated documentation'}
                </Text>
              </View>
            )}

            <Text style={styles.formTitle}>Submit Verification Documents</Text>
            <Text style={styles.formDesc}>
              Upload photos of your storefront and registration documents to earn the verified merchant badge.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Description</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={bizDesc}
                onChangeText={setBizDesc}
                placeholder="Brief summary of your grocery store and items sold..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reason for Verification</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={verifReason}
                onChangeText={setVerifReason}
                placeholder="e.g. Official merchant verification for neighborhood delivery..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Documents</Text>
              <TouchableOpacity style={styles.uploadBtn} onPress={handlePickDocument}>
                <Text style={styles.uploadBtnText}>+ Attach Photo / Document</Text>
              </TouchableOpacity>

              {docs.map((uri, idx) => (
                <View key={idx} style={styles.docRow}>
                  <Text style={styles.docName} numberOfLines={1}>
                    📄 Document {idx + 1}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setDocs((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Verification</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: 8,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  headerTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  verifiedCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  titleGreen: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#065F46',
    marginBottom: 6,
  },
  descGreen: {
    fontSize: theme.fontSize.sm,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 20,
  },
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  titleAmber: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#92400E',
    marginBottom: 6,
  },
  descAmber: {
    fontSize: theme.fontSize.sm,
    color: '#B45309',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  timeText: {
    fontSize: theme.fontSize.xs,
    color: '#78350F',
  },
  formCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  rejectedBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  rejectedTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: '#B91C1C',
    marginBottom: 2,
  },
  rejectedReason: {
    fontSize: theme.fontSize.xs,
    color: '#991B1B',
  },
  formTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  formDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    backgroundColor: '#FAFAFA',
    height: 44,
  },
  multiline: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  uploadBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    marginBottom: 8,
  },
  uploadBtnText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.sm,
    marginBottom: 4,
  },
  docName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  removeText: {
    fontSize: theme.fontSize.xs,
    color: '#EF4444',
  },
  submitBtn: {
    height: 46,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
});
