import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { verifyOtp, resendOtp } from '../../api/auth';
import { ApiError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { t } from '../../i18n';

export interface OtpInputProps {
  email: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({ email }) => {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // 60 second countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const handleDigitChange = (text: string, index: number) => {
    setErrorMessage(null);
    setSuccessInfo(null);

    // Handle paste of 6 digits
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = cleaned[i] || '';
      }
      setDigits(newDigits);
      if (cleaned.length >= 6) {
        inputRefs.current[5]?.focus();
        Keyboard.dismiss();
      } else {
        inputRefs.current[Math.min(5, cleaned.length)]?.focus();
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    // Auto-advance
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otpCode = digits.join('');
  const isComplete = otpCode.length === 6;

  const handleVerify = async () => {
    if (!isComplete) return;

    setErrorMessage(null);
    setSuccessInfo(null);
    setIsVerifying(true);

    try {
      const response = await verifyOtp({
        email: email.toLowerCase().trim(),
        otp: otpCode,
      });

      if (response.data.user) {
        await setAuth(response.data.token, response.data.user);
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_OTP') {
          setErrorMessage(t('wrongOtp'));
        } else if (err.code === 'OTP_EXPIRED') {
          setErrorMessage(t('otpExpired'));
        } else if (err.code === 'TOO_MANY_ATTEMPTS') {
          setErrorMessage(t('otpLocked'));
        } else {
          setErrorMessage(err.message || t('wrongOtp'));
        }
      } else {
        setErrorMessage(t('errors.NETWORK_ERROR'));
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (secondsRemaining > 0 || isResending) return;

    setErrorMessage(null);
    setSuccessInfo(null);
    setIsResending(true);

    try {
      await resendOtp({ email: email.toLowerCase().trim() });
      setSecondsRemaining(60);
      setSuccessInfo(t('otpResentSuccess'));
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || t('errors.TOO_MANY_ATTEMPTS'));
      } else {
        setErrorMessage(t('errors.NETWORK_ERROR'));
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emailDisplay}>{email}</Text>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {successInfo ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{successInfo}</Text>
        </View>
      ) : null}

      <View style={styles.cellsRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleDigitChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={6}
            style={[
              styles.cellInput,
              digit ? styles.cellFilled : null,
              !!errorMessage && styles.cellError,
            ]}
            selectTextOnFocus
          />
        ))}
      </View>

      <Button
        title={t('otpSubmit')}
        onPress={handleVerify}
        loading={isVerifying}
        disabled={!isComplete}
        style={styles.verifyButton}
      />

      <View style={styles.resendContainer}>
        {secondsRemaining > 0 ? (
          <Text style={styles.countdownText}>
            {t('resendCountdown', { seconds: secondsRemaining })}
          </Text>
        ) : (
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResend}
            disabled={isResending}
          >
            <Text style={styles.resendText}>
              {isResending ? t('loading') : t('resendOtp')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  emailDisplay: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.lg,
  },
  cellsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  cellInput: {
    width: 48,
    height: 56,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  cellFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0FDFA',
  },
  cellError: {
    borderColor: theme.colors.borderError,
  },
  errorBox: {
    width: '100%',
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
  },
  successBox: {
    width: '100%',
    backgroundColor: theme.colors.successLight,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  successText: {
    color: '#065F46',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  resendContainer: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  resendButton: {
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
});
