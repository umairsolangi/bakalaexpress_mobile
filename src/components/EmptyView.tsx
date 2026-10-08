import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Button } from './Button';
import { theme } from '../theme';
import { t } from '../i18n';

export interface EmptyViewProps {
  title?: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: string;
  style?: ViewStyle;
}

export const EmptyView: React.FC<EmptyViewProps> = ({
  title,
  subtitle,
  actionTitle,
  onAction,
  icon = '🔍',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title || t('empty')}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="outline"
          style={styles.actionButton}
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
    margin: theme.spacing.lg,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    maxWidth: 280,
  },
  actionButton: {
    minWidth: 140,
  },
});
