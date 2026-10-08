import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'orange';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  textStyle,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'orange':
        return styles.orangeBg;
      case 'success':
        return styles.successBg;
      case 'warning':
        return styles.warningBg;
      case 'danger':
        return styles.dangerBg;
      case 'info':
        return styles.infoBg;
      case 'neutral':
      default:
        return styles.neutralBg;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'orange':
        return styles.orangeText;
      case 'success':
        return styles.successText;
      case 'warning':
        return styles.warningText;
      case 'danger':
        return styles.dangerText;
      case 'info':
        return styles.infoText;
      case 'neutral':
      default:
        return styles.neutralText;
    }
  };

  return (
    <View style={[styles.badge, getContainerStyle(), style]}>
      <Text style={[styles.text, getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  orangeBg: {
    backgroundColor: '#FFF3EC',
  },
  orangeText: {
    color: '#FF6A1A',
  },
  successBg: {
    backgroundColor: theme.colors.successLight,
  },
  successText: {
    color: '#065F46',
  },
  warningBg: {
    backgroundColor: theme.colors.warningLight,
  },
  warningText: {
    color: '#92400E',
  },
  dangerBg: {
    backgroundColor: theme.colors.errorLight,
  },
  dangerText: {
    color: '#991B1B',
  },
  infoBg: {
    backgroundColor: theme.colors.primaryLight,
  },
  infoText: {
    color: theme.colors.primaryDark,
  },
  neutralBg: {
    backgroundColor: theme.colors.cardMuted,
  },
  neutralText: {
    color: theme.colors.textSecondary,
  },
});
