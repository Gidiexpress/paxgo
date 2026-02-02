import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { PermissionSlip, PermissionSlipVisualStyle } from '@/types/database';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Style configurations for card display
interface CardStyleConfig {
  backgroundColors: [string, string, string];
  accentColor: string;
  textColor: string;
  flourish: string;
}

const CARD_STYLE_CONFIGS: Record<PermissionSlipVisualStyle, CardStyleConfig> = {
  minimalist: {
    backgroundColors: ['#FFFFFF', '#FEFDFB', '#FBF9F4'],
    accentColor: colors.champagneGold,
    textColor: colors.midnightNavy,
    flourish: '✦',
  },
  floral: {
    backgroundColors: ['#F7FAF6', '#FEF7F4', '#F5F0E8'],
    accentColor: '#8B9A7D',
    textColor: '#4A5548',
    flourish: '🌿',
  },
  modern: {
    backgroundColors: [colors.midnightNavy, '#0A2540', '#011627'],
    accentColor: colors.champagneGold,
    textColor: colors.parchmentWhite,
    flourish: '◆',
  },
};

interface PermissionSlipCardProps {
  slip: PermissionSlip;
  onPress?: () => void;
  compact?: boolean;
}

export function PermissionSlipCard({
  slip,
  onPress,
  compact = false,
}: PermissionSlipCardProps) {
  const style = (slip.visual_style || 'minimalist') as PermissionSlipVisualStyle;
  const config = CARD_STYLE_CONFIGS[style];

  const formattedDate = slip.signed_at
    ? new Date(slip.signed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={config.backgroundColors}
          style={styles.compactCard}
        >
          <View style={styles.compactHeader}>
            <Text style={[styles.compactFlourish, { color: config.accentColor }]}>
              {config.flourish}
            </Text>
            <Text style={[styles.compactLabel, { color: config.accentColor }]}>
              Permission Slip
            </Text>
          </View>
          <Text
            style={[styles.compactStatement, { color: config.textColor }]}
            numberOfLines={2}
          >
            {slip.permission_statement}
          </Text>
          <Text style={[styles.compactDate, { color: config.textColor + '80' }]}>
            {formattedDate}
          </Text>
          {slip.signature_data && (
            <View style={styles.compactSeal}>
              <LinearGradient
                colors={[config.accentColor, config.accentColor + '80']}
                style={styles.compactSealGradient}
              >
                <Text style={styles.compactSealText}>P</Text>
              </LinearGradient>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <Animated.View entering={FadeIn.duration(400)} style={styles.cardWrapper}>
        <LinearGradient
          colors={config.backgroundColors}
          style={styles.card}
        >
          {/* Decorative corners */}
          <View style={[styles.corner, styles.cornerTL, { borderColor: config.accentColor }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: config.accentColor }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: config.accentColor }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: config.accentColor }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.labelText, { color: config.accentColor }]}>
              DIGITAL PERMISSION SLIP
            </Text>
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: config.accentColor + '60' }]} />
              <Text style={[styles.flourish, { color: config.accentColor }]}>
                {config.flourish}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: config.accentColor + '60' }]} />
            </View>
          </View>

          {/* Permission statement */}
          <View style={styles.contentSection}>
            <Text style={[styles.permissionText, { color: config.textColor }]}>
              {slip.permission_statement}
            </Text>
          </View>

          {/* Signature section */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBlock}>
              {slip.signature_data && (
                <Svg style={styles.signatureSvg} viewBox="0 0 200 40">
                  <Path
                    d={slip.signature_data}
                    stroke={config.textColor}
                    strokeWidth={1.5}
                    fill="none"
                    strokeLinecap="round"
                  />
                </Svg>
              )}
              <View style={[styles.signatureLine, { borderBottomColor: config.textColor + '40' }]} />
            </View>
            <Text style={[styles.dateText, { color: config.textColor + '80' }]}>
              {formattedDate}
            </Text>
          </View>

          {/* Wax seal */}
          {slip.signature_data && (
            <View style={styles.seal}>
              <LinearGradient
                colors={[config.accentColor, config.accentColor + '80']}
                style={styles.sealGradient}
              >
                <Text style={styles.sealText}>P</Text>
                <Text style={styles.sealSubtext}>SEALED</Text>
              </LinearGradient>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Grid preview for gallery
export function PermissionSlipGridItem({
  slip,
  onPress,
}: {
  slip: PermissionSlip;
  onPress?: () => void;
}) {
  const style = (slip.visual_style || 'minimalist') as PermissionSlipVisualStyle;
  const config = CARD_STYLE_CONFIGS[style];

  return (
    <TouchableOpacity
      style={styles.gridContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={config.backgroundColors}
        style={styles.gridCard}
      >
        <Text style={[styles.gridFlourish, { color: config.accentColor }]}>
          {config.flourish}
        </Text>
        <Text style={[styles.gridLabel, { color: config.accentColor }]}>
          Permission
        </Text>
        {slip.signature_data && (
          <View style={[styles.gridSealBadge, { backgroundColor: config.accentColor }]}>
            <Text style={styles.gridSealText}>✓</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    ...shadows.lg,
  },
  cardWrapper: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
  },
  card: {
    padding: spacing.xl,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    opacity: 0.5,
  },
  cornerTL: {
    top: spacing.md,
    left: spacing.md,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    top: spacing.md,
    right: spacing.md,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    bottom: spacing.md,
    left: spacing.md,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: spacing.md,
    right: spacing.md,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  labelText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    letterSpacing: 3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    width: '70%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  flourish: {
    marginHorizontal: spacing.sm,
    fontSize: 14,
  },
  contentSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  permissionText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureBlock: {
    flex: 1,
    marginRight: spacing.lg,
  },
  signatureSvg: {
    width: '100%',
    height: 30,
  },
  signatureLine: {
    borderBottomWidth: 1,
    marginTop: spacing.xs,
  },
  dateText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
  },
  seal: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing['3xl'],
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    ...shadows.md,
  },
  sealGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.white,
  },
  sealSubtext: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 5,
    color: colors.white,
    letterSpacing: 1,
  },
  // Compact styles
  compactContainer: {
    ...shadows.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  compactCard: {
    padding: spacing.md,
    position: 'relative',
    minHeight: 100,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  compactFlourish: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  compactLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    letterSpacing: 1,
  },
  compactStatement: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
    marginBottom: spacing.sm,
    paddingRight: spacing['2xl'],
  },
  compactDate: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
  },
  compactSeal: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  compactSealGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactSealText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  // Grid styles
  gridContainer: {
    width: (SCREEN_WIDTH - spacing.xl * 3) / 2,
    aspectRatio: 1,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  gridCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gridFlourish: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  gridLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    letterSpacing: 1,
  },
  gridSealBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridSealText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
