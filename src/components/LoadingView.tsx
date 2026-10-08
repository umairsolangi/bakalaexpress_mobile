import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { theme } from '../theme';
import { t } from '../i18n';

export interface LoadingViewProps {
  message?: string;
  style?: ViewStyle;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ message, style }) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.text}>{message || t('loading')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  text: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
});
