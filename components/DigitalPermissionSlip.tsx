import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Platform,
  ColorValue,
} from 'react-native';
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
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { PermissionSlipVisualStyle } from '@/types/database';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Defs, RadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Style config type for reuse
interface StyleConfig {
  name: string;
  description: string;
  backgroundColors: [string, string, string];
  accentColor: string;
  secondaryAccent?: string;
  textColor: string;
  borderStyle: string;
  sealColor: string;
  flourish: string;
}

// Visual style configurations
const STYLE_CONFIGS: Record<PermissionSlipVisualStyle, StyleConfig> = {
  minimalist: {
    name: 'Minimalist',
    description: 'Elegant typography with gold accents',
    backgroundColors: ['#FFFFFF', '#FEFDFB', '#FBF9F4'],
    accentColor: colors.champagneGold,
    textColor: colors.midnightNavy,
    borderStyle: 'clean',
    sealColor: colors.champagneGold,
    flourish: '✦',
  },
  floral: {
    name: 'Floral & Organic',
    description: 'Soft watercolor with sage & terracotta',
    backgroundColors: ['#F7FAF6', '#FEF7F4', '#F5F0E8'],
    accentColor: '#8B9A7D', // Sage Green
    secondaryAccent: colors.boldTerracotta,
    textColor: '#4A5548',
    borderStyle: 'organic',
    sealColor: colors.boldTerracotta,
    flourish: '🌿',
  },
  modern: {
    name: 'Modern & Architectural',
    description: 'Bold geometric lines with navy & gold',
    backgroundColors: [colors.midnightNavy, '#0A2540', '#011627'],
    accentColor: colors.champagneGold,
    textColor: colors.parchmentWhite,
    borderStyle: 'geometric',
    sealColor: colors.champagneGold,
    flourish: '◆',
  },
};

interface DigitalPermissionSlipProps {
  permissionStatement: string;
  visualStyle: PermissionSlipVisualStyle;
  signatureData?: string | null;
  signedAt?: string | null;
  userName?: string;
  dreamTitle?: string;
  onSign?: (signatureData: string) => void;
  showSignatureArea?: boolean;
  animated?: boolean;
}

// Signature canvas component
function SignatureCanvas({
  onSignatureComplete,
  style,
}: {
  onSignatureComplete: (data: string) => void;
  style: PermissionSlipVisualStyle;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const config = STYLE_CONFIGS[style];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => `${prev} L${locationX},${locationY}`);
      },
      onPanResponderRelease: () => {
        if (currentPath) {
          setPaths((prev) => [...prev, currentPath]);
          setCurrentPath('');
        }
      },
    })
  ).current;

  const handleDone = () => {
    const allPaths = [...paths, currentPath].filter(Boolean).join(' ');
    if (allPaths) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSignatureComplete(allPaths);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaths([]);
    setCurrentPath('');
  };

  const hasSignature = paths.length > 0 || currentPath.length > 0;
  const strokeColor = style === 'modern' ? colors.champagneGold : colors.midnightNavy;

  return (
    <View style={signatureStyles.container}>
      <Text style={[signatureStyles.label, { color: config.textColor }]}>
        Sign here to make it official
      </Text>
      <View
        style={[
          signatureStyles.canvas,
          style === 'modern' && signatureStyles.canvasDark,
        ]}
        {...panResponder.panHandlers}
      >
        <Svg style={StyleSheet.absoluteFill}>
          {paths.map((path, index) => (
            <Path
              key={index}
              d={path}
              stroke={strokeColor}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath && (
            <Path
              d={currentPath}
              stroke={strokeColor}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
        {!hasSignature && (
          <Text
            style={[
              signatureStyles.placeholder,
              style === 'modern' && signatureStyles.placeholderDark,
            ]}
          >
            Draw your signature
          </Text>
        )}
      </View>
      <View style={signatureStyles.buttons}>
        <TouchableOpacity onPress={handleClear} style={signatureStyles.clearButton}>
          <Text
            style={[
              signatureStyles.clearText,
              style === 'modern' && signatureStyles.clearTextDark,
            ]}
          >
            Clear
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDone}
          style={[
            signatureStyles.doneButton,
            !hasSignature && signatureStyles.doneButtonDisabled,
          ]}
          disabled={!hasSignature}
        >
          <LinearGradient
            colors={
              hasSignature
                ? [config.accentColor, config.sealColor]
                : [colors.gray300, colors.gray400]
            }
            style={signatureStyles.doneGradient}
          >
            <Text style={signatureStyles.doneText}>Sign & Seal</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Wax seal component with premium animation
function WaxSeal({
  style,
  signed,
  animated = true,
}: {
  style: PermissionSlipVisualStyle;
  signed: boolean;
  animated?: boolean;
}) {
  const config = STYLE_CONFIGS[style];
  const scale = useSharedValue(0);
  const rotation = useSharedValue(-180);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (signed && animated) {
      // Dramatic entrance
      scale.value = withDelay(
        200,
        withSpring(1, { damping: 8, stiffness: 120 })
      );
      rotation.value = withDelay(
        200,
        withSpring(0, { damping: 12, stiffness: 100 })
      );
      // Continuous shimmer
      shimmer.value = withDelay(
        800,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    } else if (signed) {
      scale.value = 1;
      rotation.value = 0;
    }
  }, [signed, animated]);

  const sealAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    opacity: scale.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.2, 0.6, 0.2]),
  }));

  if (!signed) return null;

  return (
    <Animated.View style={[sealStyles.container, sealAnimatedStyle]}>
      <LinearGradient
        colors={[config.sealColor, config.accentColor]}
        style={sealStyles.outer}
      >
        <View style={sealStyles.inner}>
          <View style={sealStyles.innerBorder}>
            <Text style={sealStyles.sealText}>P</Text>
            <Text style={sealStyles.approvedText}>SEALED</Text>
          </View>
        </View>
        <Animated.View style={[sealStyles.shimmerOverlay, shimmerStyle]} />
      </LinearGradient>
      {/* Wax drip effect */}
      <View style={[sealStyles.dripLeft, { backgroundColor: config.sealColor }]} />
      <View style={[sealStyles.dripRight, { backgroundColor: config.sealColor }]} />
    </Animated.View>
  );
}

// Gold shimmer animation for celebrations
function GoldShimmerEffect({ active }: { active: boolean }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (active) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        3,
        false
      );
    }
  }, [active]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-400, 400]) }],
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.8, 0]),
  }));

  if (!active) return null;

  return (
    <Animated.View style={[shimmerEffectStyles.shimmer, shimmerStyle]}>
      <LinearGradient
        colors={['transparent', colors.champagneGold + '60', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

export function DigitalPermissionSlip({
  permissionStatement,
  visualStyle,
  signatureData,
  signedAt,
  userName = 'Bold Dreamer',
  dreamTitle,
  onSign,
  showSignatureArea = false,
  animated = true,
}: DigitalPermissionSlipProps) {
  const config = STYLE_CONFIGS[visualStyle];
  const isSigned = !!signatureData && !!signedAt;
  const [showCelebration, setShowCelebration] = useState(false);

  const handleSign = (data: string) => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
    onSign?.(data);
  };

  const formattedDate = signedAt
    ? new Date(signedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const Container = animated ? Animated.View : View;
  const entering = animated ? FadeInDown.duration(600).springify() : undefined;

  return (
    <Container style={styles.container} entering={entering}>
      {/* Main card */}
      <View style={styles.cardWrapper}>
        <GoldShimmerEffect active={showCelebration} />

        <LinearGradient
          colors={config.backgroundColors}
          style={styles.card}
        >
          {/* Border decoration based on style */}
          {visualStyle === 'minimalist' && <MinimalistBorder config={config} />}
          {visualStyle === 'floral' && <FloralBorder config={config} />}
          {visualStyle === 'modern' && <ModernBorder config={config} />}

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.labelText, { color: config.accentColor }]}>
              OFFICIAL
            </Text>
            <Text style={[styles.titleText, { color: config.textColor }]}>
              Digital Permission Slip
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
            <Text style={[styles.certifyText, { color: config.textColor + 'AA' }]}>
              This certifies that
            </Text>
            <Text style={[styles.permissionText, { color: config.textColor }]}>
              {permissionStatement}
            </Text>
          </View>

          {/* Signature section */}
          {showSignatureArea && !isSigned ? (
            <SignatureCanvas onSignatureComplete={handleSign} style={visualStyle} />
          ) : (
            <View style={styles.signatureSection}>
              <View style={styles.signatureRow}>
                <View style={styles.signatureBlock}>
                  <View
                    style={[
                      styles.signatureLine,
                      { borderBottomColor: config.textColor + '40' },
                    ]}
                  >
                    {isSigned && signatureData && (
                      <Svg style={styles.signatureSvg} viewBox="0 0 200 40">
                        <Path
                          d={signatureData}
                          stroke={config.textColor}
                          strokeWidth={1.5}
                          fill="none"
                          strokeLinecap="round"
                        />
                      </Svg>
                    )}
                  </View>
                  <Text style={[styles.signatureLabel, { color: config.textColor + '80' }]}>
                    Your Signature
                  </Text>
                </View>
                <View style={styles.dateBlock}>
                  <Text style={[styles.dateText, { color: config.textColor }]}>
                    {formattedDate}
                  </Text>
                  <Text style={[styles.dateLabel, { color: config.textColor + '80' }]}>
                    Date Sealed
                  </Text>
                </View>
              </View>

              {/* Signed by section */}
              <View style={styles.signedBySection}>
                <Text style={[styles.signedByText, { color: config.accentColor }]}>
                  Signed: {userName}
                </Text>
                <Text style={[styles.signedBySubtext, { color: config.textColor + '60' }]}>
                  by the community
                </Text>
              </View>
            </View>
          )}

          {/* Wax seal */}
          <WaxSeal style={visualStyle} signed={isSigned} animated={animated} />
        </LinearGradient>
      </View>
    </Container>
  );
}

// Style-specific border components
function MinimalistBorder({ config }: { config: StyleConfig }) {
  return (
    <>
      <View style={[minimalistStyles.cornerTL, { borderColor: config.accentColor }]} />
      <View style={[minimalistStyles.cornerTR, { borderColor: config.accentColor }]} />
      <View style={[minimalistStyles.cornerBL, { borderColor: config.accentColor }]} />
      <View style={[minimalistStyles.cornerBR, { borderColor: config.accentColor }]} />
    </>
  );
}

function FloralBorder({ config }: { config: StyleConfig }) {
  const secondaryColor = config.secondaryAccent || config.accentColor;
  return (
    <>
      <View style={floralStyles.border}>
        <View style={[floralStyles.innerBorder, { borderColor: config.accentColor + '40' }]} />
      </View>
      {/* Decorative elements */}
      <Text style={[floralStyles.leafTopLeft, { color: config.accentColor }]}>
        🌿
      </Text>
      <Text style={[floralStyles.leafTopRight, { color: config.accentColor }]}>
        🌿
      </Text>
      <Text style={[floralStyles.leafBottomLeft, { color: secondaryColor }]}>
        🍃
      </Text>
      <Text style={[floralStyles.leafBottomRight, { color: secondaryColor }]}>
        🍃
      </Text>
    </>
  );
}

function ModernBorder({ config }: { config: StyleConfig }) {
  return (
    <>
      <View style={[modernStyles.borderTop, { backgroundColor: config.accentColor }]} />
      <View style={[modernStyles.borderBottom, { backgroundColor: config.accentColor }]} />
      <View style={[modernStyles.accentLineLeft, { backgroundColor: config.accentColor + '30' }]} />
      <View style={[modernStyles.accentLineRight, { backgroundColor: config.accentColor + '30' }]} />
      {/* Geometric shapes */}
      <View style={[modernStyles.diamond, { borderColor: config.accentColor + '40' }]} />
    </>
  );
}

// Style selector component
export function PermissionSlipStyleSelector({
  selectedStyle,
  onSelectStyle,
}: {
  selectedStyle: PermissionSlipVisualStyle;
  onSelectStyle: (style: PermissionSlipVisualStyle) => void;
}) {
  const styles_arr: PermissionSlipVisualStyle[] = ['minimalist', 'floral', 'modern'];

  return (
    <View style={selectorStyles.container}>
      <Text style={selectorStyles.title}>Choose Your Style</Text>
      <Text style={selectorStyles.subtitle}>
        Select a visual style for your permission slip
      </Text>
      <View style={selectorStyles.optionsContainer}>
        {styles_arr.map((style) => {
          const config = STYLE_CONFIGS[style];
          const isSelected = selectedStyle === style;

          return (
            <TouchableOpacity
              key={style}
              style={[
                selectorStyles.option,
                isSelected && selectorStyles.optionSelected,
                isSelected && { borderColor: config.accentColor },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectStyle(style);
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={config.backgroundColors}
                style={selectorStyles.optionPreview}
              >
                <Text style={selectorStyles.optionFlourish}>{config.flourish}</Text>
                {isSelected && (
                  <View style={[selectorStyles.checkmark, { backgroundColor: config.accentColor }]}>
                    <Text style={selectorStyles.checkmarkText}>✓</Text>
                  </View>
                )}
              </LinearGradient>
              <Text style={[selectorStyles.optionName, isSelected && { color: config.accentColor }]}>
                {config.name}
              </Text>
              <Text style={selectorStyles.optionDescription}>{config.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
    ...shadows.xl,
  },
  cardWrapper: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    position: 'relative',
  },
  card: {
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  labelText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    letterSpacing: 4,
    marginBottom: spacing.sm,
  },
  titleText: {
    fontFamily: typography.fontFamily.headingItalic,
    fontSize: typography.fontSize['2xl'],
    textAlign: 'center',
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    width: '80%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  flourish: {
    marginHorizontal: spacing.md,
    fontSize: 16,
  },
  contentSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.md,
  },
  certifyText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  permissionText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    lineHeight: 28,
  },
  signatureSection: {
    marginTop: spacing.lg,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  signatureBlock: {
    flex: 1,
    marginRight: spacing.xl,
  },
  signatureLine: {
    borderBottomWidth: 1,
    minHeight: 40,
    justifyContent: 'flex-end',
  },
  signatureSvg: {
    width: '100%',
    height: 40,
  },
  signatureLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  dateBlock: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
  },
  dateLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  signedBySection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  signedByText: {
    fontFamily: typography.fontFamily.headingItalic,
    fontSize: typography.fontSize.lg,
  },
  signedBySubtext: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});

// Signature canvas styles
const signatureStyles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  label: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  canvas: {
    height: 120,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  canvasDark: {
    backgroundColor: colors.midnightNavy + '80',
    borderColor: colors.champagneGold + '40',
  },
  placeholder: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    position: 'absolute',
  },
  placeholderDark: {
    color: colors.champagneGold + '60',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  clearButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  clearText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  clearTextDark: {
    color: colors.parchmentWhite + '80',
  },
  doneButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    flex: 1,
    marginLeft: spacing.md,
    ...shadows.sm,
  },
  doneButtonDisabled: {
    opacity: 0.6,
  },
  doneGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  doneText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
});

// Wax seal styles
const sealStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 80,
    width: 70,
    height: 70,
    ...shadows.lg,
  },
  outer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerBorder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.white,
  },
  approvedText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 6,
    color: colors.white,
    letterSpacing: 2,
    marginTop: -2,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 35,
  },
  dripLeft: {
    position: 'absolute',
    bottom: -8,
    left: 10,
    width: 8,
    height: 12,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  dripRight: {
    position: 'absolute',
    bottom: -5,
    right: 15,
    width: 6,
    height: 8,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
});

// Gold shimmer effect styles
const shimmerEffectStyles = StyleSheet.create({
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    zIndex: 10,
  },
});

// Minimalist border styles
const minimalistStyles = StyleSheet.create({
  cornerTL: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 30,
    height: 30,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 30,
    height: 30,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    width: 30,
    height: 30,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 30,
    height: 30,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },
});

// Floral border styles
const floralStyles = StyleSheet.create({
  border: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  innerBorder: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
  },
  leafTopLeft: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    fontSize: 20,
    transform: [{ rotate: '-45deg' }],
    opacity: 0.6,
  },
  leafTopRight: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    fontSize: 20,
    transform: [{ rotate: '45deg' }, { scaleX: -1 }],
    opacity: 0.6,
  },
  leafBottomLeft: {
    position: 'absolute',
    bottom: 60,
    left: spacing.sm,
    fontSize: 16,
    transform: [{ rotate: '45deg' }],
    opacity: 0.5,
  },
  leafBottomRight: {
    position: 'absolute',
    bottom: 60,
    right: spacing.sm,
    fontSize: 16,
    transform: [{ rotate: '-45deg' }, { scaleX: -1 }],
    opacity: 0.5,
  },
});

// Modern border styles
const modernStyles = StyleSheet.create({
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  accentLineLeft: {
    position: 'absolute',
    top: '20%',
    left: 0,
    width: 3,
    height: '60%',
  },
  accentLineRight: {
    position: 'absolute',
    top: '20%',
    right: 0,
    width: 3,
    height: '60%',
  },
  diamond: {
    position: 'absolute',
    top: spacing['2xl'],
    right: spacing['2xl'],
    width: 20,
    height: 20,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
});

// Style selector styles
const selectorStyles = StyleSheet.create({
  container: {
    marginVertical: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  option: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    ...shadows.sm,
  },
  optionSelected: {
    borderWidth: 3,
    ...shadows.glow,
  },
  optionPreview: {
    height: 80,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  optionFlourish: {
    fontSize: 28,
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionName: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: 2,
  },
  optionDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: 10,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 14,
  },
});

export { STYLE_CONFIGS };
