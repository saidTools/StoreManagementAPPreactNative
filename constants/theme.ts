export const colors = {
  primary: '#0A84FF',
  primaryLight: '#409CFF',
  primaryDark: '#0063CC',
  success: '#30D158',
  successLight: '#63E68A',
  warning: '#FF9F0A',
  warningLight: '#FFB340',
  danger: '#FF453A',
  dangerLight: '#FF6961',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  textDisabled: '#C7C7CC',
  border: '#E5E5EA',
  divider: '#F0F0F5',
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: '#000000',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E5EA',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
};

export const typography = {
  heading1: { fontSize: 30, fontWeight: '800' as const, lineHeight: 38, letterSpacing: -0.5 },
  heading2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.3 },
  heading3: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28, letterSpacing: -0.2 },
  heading4: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  button: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const layout = {
  screenPadding: spacing.md,
  cardPadding: spacing.md,
  minTapTarget: 44,
};

export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  layout,
};

export type Theme = typeof theme;
