import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// Gold-themed confetti piece
interface GoldConfettiPieceProps {
  index: number;
  onComplete?: () => void;
  isLast?: boolean;
}

function GoldConfettiPiece({ index, onComplete, isLast }: GoldConfettiPieceProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  const startX = Math.random() * width;
  const endX = startX + (Math.random() - 0.5) * 150;
  const delay = Math.random() * 400;
  const duration = 2500 + Math.random() * 1000;

  // Gold color variations
  const goldColors = [
    colors.champagneGold,
    colors.goldLight,
    colors.goldDark,
    '#FFD700', // Pure gold
    '#FFC107', // Amber gold
    '#F9A825', // Orange gold
  ];
  const particleColor = goldColors[index % goldColors.length];

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      )
    );

    translateY.value = withDelay(
      delay,
      withTiming(height + 100, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    translateX.value = withDelay(
      delay,
      withSequence(
        withTiming(40, { duration: duration / 4 }),
        withTiming(-40, { duration: duration / 4 }),
        withTiming(30, { duration: duration / 4 }),
        withTiming(endX - startX, { duration: duration / 4 })
      )
    );

    rotate.value = withDelay(
      delay,
      withTiming(720 + Math.random() * 720, {
        duration,
        easing: Easing.linear,
      })
    );

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
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const shapes = ['star', 'diamond', 'circle', 'sparkle'];
  const shape = shapes[index % shapes.length];

  return (
    <Animated.View style={[styles.pieceContainer, animatedStyle]}>
      {shape === 'star' && (
        <View style={[styles.star, { backgroundColor: particleColor }]} />
      )}
      {shape === 'diamond' && (
        <View style={[styles.diamond, { backgroundColor: particleColor }]} />
      )}
      {shape === 'circle' && (
        <View style={[styles.circle, { backgroundColor: particleColor }]} />
      )}
      {shape === 'sparkle' && (
        <View style={styles.sparkleContainer}>
          <View style={[styles.sparkleLine, { backgroundColor: particleColor }]} />
          <View style={[styles.sparkleLineH, { backgroundColor: particleColor }]} />
        </View>
      )}
    </Animated.View>
  );
}

// Shimmer particle for extra luxury feel
interface ShimmerParticleProps {
  index: number;
}

function ShimmerParticle({ index }: ShimmerParticleProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  const x = Math.random() * width;
  const y = Math.random() * height * 0.6;
  const delay = Math.random() * 800;

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.3, { duration: 300 }),
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 400 })
      )
    );

    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.5, { damping: 10 }),
        withTiming(0, { duration: 400 })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x },
      { translateY: y },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.shimmerParticle, animatedStyle]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.8)', colors.champagneGold, 'rgba(255,255,255,0.8)']}
        style={styles.shimmerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

interface GoldConfettiProps {
  active: boolean;
  onComplete?: () => void;
  count?: number;
}

export function GoldConfetti({
  active,
  onComplete,
  count = 40,
}: GoldConfettiProps) {
  useEffect(() => {
    if (active) {
      // Trigger haptic feedback when confetti starts
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Main confetti pieces */}
      {Array.from({ length: count }).map((_, index) => (
        <GoldConfettiPiece
          key={`confetti-${index}`}
          index={index}
          onComplete={onComplete}
          isLast={index === count - 1}
        />
      ))}

      {/* Shimmer particles for extra luxury */}
      {Array.from({ length: 15 }).map((_, index) => (
        <ShimmerParticle key={`shimmer-${index}`} index={index} />
      ))}
    </View>
  );
}

// Celebration overlay with gold confetti and message
interface CelebrationOverlayProps {
  visible: boolean;
  message?: string;
  submessage?: string;
  onComplete?: () => void;
}

export function CelebrationOverlay({
  visible,
  message = 'Well done!',
  submessage = 'One step closer to your dream',
  onComplete,
}: CelebrationOverlayProps) {
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      textOpacity.value = withDelay(
        300,
        withSequence(
          withTiming(1, { duration: 400 }),
          withDelay(1500, withTiming(0, { duration: 400 }))
        )
      );

      textScale.value = withDelay(
        300,
        withSequence(
          withSpring(1.1, { damping: 12 }),
          withSpring(1, { damping: 15 }),
          withDelay(1500, withTiming(0.8, { duration: 300 }))
        )
      );
    }
  }, [visible]);

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.celebrationContainer} pointerEvents="none">
      <GoldConfetti active={visible} onComplete={onComplete} count={50} />

      <Animated.View style={[styles.celebrationTextContainer, textAnimatedStyle]}>
        <LinearGradient
          colors={['rgba(1,22,39,0.9)', 'rgba(1,22,39,0.85)']}
          style={styles.celebrationBg}
        >
          <Text style={styles.celebrationEmoji}>✨</Text>
          <Text style={styles.celebrationMessage}>{message}</Text>
          <Text style={styles.celebrationSubmessage}>{submessage}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

import { Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  pieceContainer: {
    position: 'absolute',
  },
  star: {
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
  },
  diamond: {
    width: 10,
    height: 10,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  circle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sparkleContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleLine: {
    position: 'absolute',
    width: 2,
    height: 14,
    borderRadius: 1,
  },
  sparkleLineH: {
    position: 'absolute',
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  shimmerParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  shimmerGradient: {
    flex: 1,
  },
  celebrationContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1001,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationBg: {
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  celebrationMessage: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: colors.champagneGold,
    textAlign: 'center',
    marginBottom: 4,
  },
  celebrationSubmessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
});
