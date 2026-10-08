import { brand } from './theme/brand';

export const theme = {
  colors: {
    // Brand Core Tokens
    /** Primary button and main action color - Accessible emerald green from Behance reference (#157B42) */
    primary: brand.greenDark, // #157B42
    /** Backwards-compatible alias for primaryDark */
    primaryDark: brand.greenDark,
    /** Pressed state for primary buttons */
    primaryPressed: '#0E5B30',
    /** Brand vibrant green accent for icons, chips, and highlights */
    primaryAccent: brand.green, // #157B42
    /** Secondary warm orange accent for badges, sales, discounts (#FF6A1A) */
    secondary: brand.orange, // #FF6A1A
    secondaryLight: '#FFF3EC',
    /** Accessible on-primary text/icon color */
    onPrimary: '#FFFFFF',
    /** Main background canvas (#FAFAFA) */
    background: brand.background,
    /** Surface/card color */
    surface: '#FFFFFF',
    surfaceSubtle: '#F8F9FA',
    /** Clean 1dp border color */
    border: '#EBEBEB',
    borderFocus: brand.greenDark,
    borderError: '#EF4444',
    /** Typography primary black (#1A1A1A) */
    text: brand.black, // #1A1A1A
    textPrimary: brand.black,
    /** Muted secondary typography (#575757) */
    mutedText: brand.muted, // #575757
    textSecondary: brand.muted,
    textMuted: brand.muted,
    textInverse: '#FFFFFF',
    /** Semantic feedback tokens */
    success: brand.green,
    successLight: '#E8F5EE',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    disabled: '#E5E7EB',
    disabledText: '#9CA3AF',
    overlay: 'rgba(0, 0, 0, 0.6)',
    card: '#FFFFFF',
    cardMuted: '#F8F9FA',
    primaryLight: '#E8F5EE',
    primaryMuted: brand.green,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    screen: 16,
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    caption: 13,
    sm: 14,
    body: 16,
    md: 16,
    lg: 18,
    xl: 20,
    title: 24,
    xxl: 24,
    display: 28,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 8,
    },
  },
  layout: {
    minTapTarget: 48,
  },
} as const;

export type Theme = typeof theme;
