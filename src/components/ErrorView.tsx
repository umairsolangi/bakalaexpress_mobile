import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Button } from './Button';
import { theme } from '../theme';
import { t } from '../i18n';

export interface ErrorViewProps {
  message?: string;
  code?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  message,
  code,
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>⚠️</Text>
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        {message || t('errors.UNKNOWN_ERROR')}
      </Text>
      {code ? (
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{code}</Text>
        </View>
      ) : null}
      {onRetry ? (
        <Button
          title={t('retry')}
          onPress={onRetry}
          style={styles.retryButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    margin: theme.spacing.lg,
    ...theme.shadow.sm,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  message: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  codeBadge: {
    backgroundColor: theme.colors.cardMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
    marginBottom: theme.spacing.lg,
  },
  codeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  retryButton: {
    minWidth: 140,
  },
});
