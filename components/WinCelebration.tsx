import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, shadows, spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// Premium confetti piece with glow effect
interface PremiumConfettiProps {
  index: number;
  color: string;
  onComplete?: () => void;
  isLast?: boolean;
}

function PremiumConfettiPiece({ index, color, onComplete, isLast }: PremiumConfettiProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);
  const glow = useSharedValue(0);

  const startX = Math.random() * width;
  const delay = Math.random() * 400;
  const duration = 2500 + Math.random() * 1500;
  const amplitude = 50 + Math.random() * 50;

  useEffect(() => {
    // Initial pop
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    // Glow pulse
    glow.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.3, { duration: 300 })
      )
    );

    // Falling with sway
    translateY.value = withDelay(
      delay,
      withTiming(height + 100, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Horizontal sway
    translateX.value = withDelay(
      delay,
      withSequence(
        withTiming(amplitude, { duration: duration / 3 }),
        withTiming(-amplitude, { duration: duration / 3 }),
        withTiming(amplitude / 2, { duration: duration / 3 })
      )
    );

    // 3D rotation
    rotate.value = withDelay(
      delay,
      withTiming(720 + Math.random() * 720, {
        duration,
        easing: Easing.linear,
      })
    );

    rotateY.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), {
        duration: duration / 2,
        easing: Easing.linear,
      })
    );

    // Fade out
    opacity.value = withDelay(
      delay + duration - 600,
      withTiming(0, { duration: 600 }, (finished) => {
        if (finished && isLast && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    shadowOpacity: interpolate(glow.value, [0, 1], [0, 0.5]),
    shadowRadius: interpolate(glow.value, [0, 1], [0, 8]),
  }));

  const shapes = ['square', 'rectangle', 'circle', 'star', 'diamond'];
  const shape = shapes[index % shapes.length];

  const renderShape = () => {
    const baseStyle = { backgroundColor: color };

    switch (shape) {
      case 'star':
        return (
          <View style={styles.starContainer}>
            <Text style={[styles.starText, { color }]}>✦</Text>
          </View>
        );
      case 'diamond':
        return (
          <View style={[styles.diamond, baseStyle]} />
        );
      case 'circle':
        return <View style={[styles.circle, baseStyle]} />;
      case 'rectangle':
        return <View style={[styles.rectangle, baseStyle]} />;
      default:
        return <View style={[styles.square, baseStyle]} />;
    }
  };

  return (
    <Animated.View style={[styles.piece, animatedStyle, { shadowColor: color }]}>
      {renderShape()}
    </Animated.View>
  );
}

// Central Win Badge with ring animation
interface WinBadgeProps {
  title?: string;
  subtitle?: string;
}

function WinBadge({ title = 'WIN!', subtitle }: WinBadgeProps) {
  const badgeScale = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    // Badge pop in
    badgeScale.value = withDelay(
      200,
      withSpring(1, { damping: 10, stiffness: 150 })
    );

    // Ring expansion
    ringScale.value = withDelay(
      400,
      withTiming(1.5, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    ringOpacity.value = withDelay(
      400,
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 400 })
      )
    );

    // Text fade in
    textOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 300 })
    );

    // Glow pulse loop
    glowPulse.value = withDelay(
      500,
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.5, { duration: 600 })
      )
    );
  }, []);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    shadowOpacity: interpolate(glowPulse.value, [0, 1], [0.2, 0.6]),
    shadowRadius: interpolate(glowPulse.value, [0, 1], [8, 20]),
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.badgeContainer}>
      {/* Expanding ring */}
      <Animated.View style={[styles.ring, ringAnimatedStyle]}>
        <LinearGradient
          colors={[colors.vibrantTeal, colors.champagneGold]}
          style={styles.ringGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Main badge */}
      <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
        <LinearGradient
          colors={[colors.vibrantTeal, colors.tealDark]}
          style={styles.badgeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={textAnimatedStyle}>
            <Text style={styles.badgeTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.badgeSubtitle}>{subtitle}</Text>
            )}
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// Main Win Celebration Component
interface WinCelebrationProps {
  active: boolean;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
  showBadge?: boolean;
  confettiCount?: number;
}

export function WinCelebration({
  active,
  onComplete,
  title,
  subtitle,
  showBadge = true,
  confettiCount = 60,
}: WinCelebrationProps) {
  // Premium confetti colors using Vibrant Teal and Champagne Gold
  const confettiColors = [
    colors.vibrantTeal,
    colors.champagneGold,
    colors.tealLight,
    colors.goldLight,
    colors.boldTerracotta,
    colors.terracottaLight,
    '#FFD700', // Pure gold
    '#00CED1', // Dark cyan
    '#F0E68C', // Khaki gold
  ];

  // Synchronized haptic feedback
  const triggerHapticSequence = useCallback(async () => {
    if (Platform.OS === 'web') return;

    // Initial impact
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Rapid success pulses synchronized with visual
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 150);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 300);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 450);

    // Final celebration notification
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 600);
  }, []);

  useEffect(() => {
    if (active) {
      triggerHapticSequence();
    }
  }, [active, triggerHapticSequence]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Confetti layer */}
      {Array.from({ length: confettiCount }).map((_, index) => (
        <PremiumConfettiPiece
          key={index}
          index={index}
          color={confettiColors[index % confettiColors.length]}
          onComplete={index === confettiCount - 1 ? onComplete : undefined}
          isLast={index === confettiCount - 1}
        />
      ))}

      {/* Central badge */}
      {showBadge && (
        <WinBadge title={title} subtitle={subtitle} />
      )}
    </View>
  );
}

// Compact version for inline celebrations
export function MiniWinBurst({ active, color = colors.vibrantTeal }: { active: boolean; color?: string }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withTiming(1.5, { duration: 200 }),
        withTiming(0, { duration: 300 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(200, withTiming(0, { duration: 200 }))
      );

      // Single haptic pulse
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!active) return null;

  return (
    <Animated.View style={[styles.miniBurst, animatedStyle]}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <View
          key={angle}
          style={[
            styles.burstRay,
            {
              backgroundColor: color,
              transform: [{ rotate: `${angle}deg` }, { translateY: -15 }],
            },
          ]}
        />
      ))}
      <View style={[styles.burstCenter, { backgroundColor: color }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
  piece: {
    position: 'absolute',
    shadowColor: colors.champagneGold,
    shadowOffset: { width: 0, height: 0 },
  },
  square: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  rectangle: {
    width: 6,
    height: 16,
    borderRadius: 2,
  },
  circle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  diamond: {
    width: 10,
    height: 10,
    transform: [{ rotate: '45deg' }],
  },
  starContainer: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: {
    fontSize: 14,
  },
  // Badge styles
  badgeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: height * 0.35,
  },
  badge: {
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
    ...shadows.xl,
    shadowColor: colors.vibrantTeal,
    shadowOffset: { width: 0, height: 0 },
  },
  badgeGradient: {
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  badgeTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['4xl'],
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badgeSubtitle: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  ring: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
  },
  ringGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    borderWidth: 3,
    borderColor: colors.champagneGold,
    backgroundColor: 'transparent',
  },
  // Mini burst styles
  miniBurst: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstRay: {
    position: 'absolute',
    width: 3,
    height: 12,
    borderRadius: 2,
  },
  burstCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
