// Paxgo Theme - Warm & Worldly Aesthetic
export const colors = {
  // Primary Palette
  boldTerracotta: '#E2725B',
  midnightNavy: '#011627',
  champagneGold: '#D4AF37',
  parchmentWhite: '#F9F7F2',
  vibrantTeal: '#2EC4B6',

  // Semantic Colors
  primary: '#E2725B',
  secondary: '#011627',
  accent: '#D4AF37',
  background: '#F9F7F2',
  success: '#2EC4B6',

  // Extended Palette
  terracottaLight: '#F0A898',
  terracottaDark: '#C45A45',
  navyLight: '#1A3A4A',
  goldLight: '#E8C868',
  goldDark: '#B8952D',
  tealLight: '#5DD9CE',
  tealDark: '#22A399',

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',

  // Background variations
  paperTexture: '#FBF9F4',
  warmCream: '#FAF6EE',
  softIvory: '#FFFEF9',
};

export const typography = {
  fontFamily: {
    heading: 'PlayfairDisplay_700Bold',
    headingItalic: 'PlayfairDisplay_700Bold_Italic',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemiBold: 'Inter_600SemiBold',
    bodyBold: 'Inter_700Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: colors.midnightNavy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: colors.midnightNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.midnightNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: colors.midnightNavy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  // Premium soft glow for elevated elements
  glow: {
    shadowColor: colors.champagneGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
};

// Editorial-inspired spacing for premium feel
export const editorialSpacing = {
  cardPadding: 20,
  sectionGap: 32,
  screenPadding: 20,
  cardGap: 16,
};

export const gradients = {
  navyToTerracotta: [colors.midnightNavy, colors.boldTerracotta],
  terracottaToGold: [colors.boldTerracotta, colors.champagneGold],
  goldShimmer: [colors.goldLight, colors.champagneGold, colors.goldDark],
  warmSunset: [colors.parchmentWhite, colors.terracottaLight],
  premiumDark: [colors.midnightNavy, '#0A2540', colors.terracottaDark],
};
