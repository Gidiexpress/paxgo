import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { colors, typography, borderRadius, shadows, spacing } from '@/constants/theme';
import { PermissionSlip as PermissionSlipType } from '@/types';
import { PermissionSlipStyle, PERMISSION_SLIP_STYLES } from '@/services/aiService';
import { useEffect } from 'react';

const { width } = Dimensions.get('window');

interface PermissionSlipProps {
  slip: PermissionSlipType;
  style?: PermissionSlipStyle;
  animated?: boolean;
}

// Style-specific gradient colors
const STYLE_GRADIENTS: Record<PermissionSlipStyle, string[]> = {
  'classic': ['#FDF8ED', '#F5EDD6', '#FDF8ED'],
  'royal': ['#FBF7E9', '#E8DFC6', '#FBF7E9'],
  'cosmic': ['#F5F3FF', '#E8E4F7', '#F5F3FF'],
  'sisterhood': ['#FFF5F5', '#FFECEC', '#FFF5F5'],
  'future-self': ['#F0F9FF', '#E0F2FE', '#F0F9FF'],
};

// Style-specific border colors
const STYLE_BORDERS: Record<PermissionSlipStyle, string> = {
  'classic': '#D4C4A8',
  'royal': '#D4AF37',
  'cosmic': '#A78BFA',
  'sisterhood': '#FDA4AF',
  'future-self': '#38BDF8',
};

// Style-specific seal colors
const STYLE_SEAL_COLORS: Record<PermissionSlipStyle, { outer: string; inner: string }> = {
  'classic': { outer: colors.boldTerracotta, inner: colors.terracottaDark },
  'royal': { outer: colors.champagneGold, inner: colors.goldDark },
  'cosmic': { outer: '#8B5CF6', inner: '#6D28D9' },
  'sisterhood': { outer: '#F43F5E', inner: '#BE123C' },
  'future-self': { outer: colors.vibrantTeal, inner: colors.tealDark },
};

// Decorative elements per style
const STYLE_FLOURISH: Record<PermissionSlipStyle, string> = {
  'classic': '✦',
  'royal': '👑',
  'cosmic': '✨',
  'sisterhood': '💫',
  'future-self': '🌟',
};

export function PermissionSlip({ slip, style = 'classic', animated = true }: PermissionSlipProps) {
  const styleConfig = PERMISSION_SLIP_STYLES[style];
  const gradientColors = STYLE_GRADIENTS[style];
  const borderColor = STYLE_BORDERS[style];
  const sealColors = STYLE_SEAL_COLORS[style];
  const flourish = STYLE_FLOURISH[style];

  // Animated shimmer effect for the seal
  const shimmerOpacity = useSharedValue(0.3);
  const sealRotation = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      // Subtle shimmer animation
      shimmerOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      );

      // Gentle seal rotation on appear
      sealRotation.value = withSequence(
        withDelay(500, withTiming(-5, { duration: 200 })),
        withTiming(5, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );
    }
  }, [animated]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  const sealAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sealRotation.value}deg` }],
  }));

  const Container = animated ? Animated.View : View;
  const enteringAnimation = animated ? FadeInDown.duration(600).springify() : undefined;

  return (
    <Container
      style={styles.container}
      entering={enteringAnimation}
    >
      {/* Paper texture background */}
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.paper}
      >
        {/* Decorative border */}
        <View style={[styles.borderDecor, { borderColor }]}>
          <View style={[styles.innerBorder, { borderColor: `${borderColor}80` }]}>
            {/* Header */}
            <Text style={styles.headerText}>Digital Permission Slip</Text>

            {/* Decorative line with flourish */}
            <View style={styles.decorativeLine}>
              <View style={[styles.lineSegment, { backgroundColor: borderColor }]} />
              <Text style={[styles.flourish, { color: borderColor }]}>{flourish}</Text>
              <View style={[styles.lineSegment, { backgroundColor: borderColor }]} />
            </View>

            {/* Permission content */}
            <View style={styles.contentSection}>
              <Text style={styles.permissionLabel}>This certifies that</Text>
              <Text style={styles.permissionText}>{slip.permission}</Text>
            </View>

            {/* Signature section */}
            <View style={styles.signatureSection}>
              <Text style={styles.signedText}>Signed:</Text>
              <Text style={styles.signatureName}>{slip.signedBy}</Text>
              <Text style={styles.signedBy}>by the community</Text>
            </View>

            {/* Wax seal with animation */}
            <Animated.View style={[styles.waxSeal, sealAnimatedStyle, { backgroundColor: sealColors.outer }]}>
              <View style={[styles.sealInner, { backgroundColor: sealColors.inner }]}>
                <Text style={styles.sealText}>P</Text>
              </View>
              {/* Shimmer overlay */}
              <Animated.View style={[styles.sealShimmer, shimmerStyle]} />
            </Animated.View>

            {/* Corner decorations for royal style */}
            {style === 'royal' && (
              <>
                <View style={[styles.cornerDecor, styles.cornerTopLeft, { borderColor }]} />
                <View style={[styles.cornerDecor, styles.cornerTopRight, { borderColor }]} />
                <View style={[styles.cornerDecor, styles.cornerBottomLeft, { borderColor }]} />
                <View style={[styles.cornerDecor, styles.cornerBottomRight, { borderColor }]} />
              </>
            )}

            {/* Stars for cosmic style */}
            {style === 'cosmic' && (
              <>
                <Text style={[styles.starDecor, styles.starTopRight]}>✦</Text>
                <Text style={[styles.starDecor, styles.starBottomLeft]}>✧</Text>
              </>
            )}
          </View>
        </View>
      </LinearGradient>
    </Container>
  );
}

// Compact version for lists/archive
export function PermissionSlipCompact({
  slip,
  style = 'classic',
}: {
  slip: PermissionSlipType;
  style?: PermissionSlipStyle;
}) {
  const borderColor = STYLE_BORDERS[style];
  const gradientColors = STYLE_GRADIENTS[style];
  const flourish = STYLE_FLOURISH[style];

  return (
    <View style={styles.compactContainer}>
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.compactPaper}
      >
        <View style={[styles.compactBorder, { borderColor }]}>
          <View style={styles.compactHeader}>
            <Text style={styles.compactFlourish}>{flourish}</Text>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {slip.title}
            </Text>
          </View>
          <Text style={styles.compactPermission} numberOfLines={2}>
            {slip.permission}
          </Text>
          <Text style={styles.compactSigned}>— {slip.signedBy}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
    ...shadows.lg,
  },
  paper: {
    borderRadius: borderRadius.lg,
    padding: 3,
  },
  borderDecor: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg - 2,
    borderWidth: 1,
    padding: 8,
  },
  innerBorder: {
    backgroundColor: 'rgba(253, 248, 237, 0.9)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerText: {
    fontFamily: typography.fontFamily.headingItalic,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  decorativeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '80%',
  },
  lineSegment: {
    flex: 1,
    height: 1,
  },
  flourish: {
    marginHorizontal: spacing.md,
    fontSize: 16,
  },
  contentSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  permissionLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: spacing.md,
  },
  signatureSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  signedText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  signatureName: {
    fontFamily: typography.fontFamily.headingItalic,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    marginVertical: spacing.xs,
  },
  signedBy: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    fontStyle: 'italic',
  },
  waxSeal: {
    position: 'absolute',
    bottom: -20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    overflow: 'hidden',
  },
  sealInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sealText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.white,
  },
  sealShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 25,
  },
  // Corner decorations for royal style
  cornerDecor: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 2,
  },
  cornerTopLeft: {
    top: spacing.md,
    left: spacing.md,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    top: spacing.md,
    right: spacing.md,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    bottom: spacing.md,
    left: spacing.md,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    bottom: spacing.md,
    right: spacing.md,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  // Star decorations for cosmic style
  starDecor: {
    position: 'absolute',
    fontSize: 12,
    color: '#A78BFA',
    opacity: 0.6,
  },
  starTopRight: {
    top: spacing.lg,
    right: spacing.lg,
  },
  starBottomLeft: {
    bottom: spacing['2xl'],
    left: spacing.lg,
  },
  // Compact styles for archive
  compactContainer: {
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  compactPaper: {
    borderRadius: borderRadius.md,
    padding: 2,
  },
  compactBorder: {
    backgroundColor: 'rgba(253, 248, 237, 0.95)',
    borderRadius: borderRadius.md - 1,
    borderWidth: 1,
    padding: spacing.md,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  compactFlourish: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  compactTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    flex: 1,
  },
  compactPermission: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  compactSigned: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    fontStyle: 'italic',
    textAlign: 'right',
  },
});
