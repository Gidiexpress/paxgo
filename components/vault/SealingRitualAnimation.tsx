import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '@/constants/theme';
import { ProofEntry } from '@/types';

const { width, height } = Dimensions.get('window');

interface SealingRitualAnimationProps {
  proof: ProofEntry;
  onComplete: () => void;
}

export function SealingRitualAnimation({ proof, onComplete }: SealingRitualAnimationProps) {
  const cardScale = useSharedValue(1);
  const cardTranslateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const ripple1Scale = useSharedValue(0);
  const ripple2Scale = useSharedValue(0);
  const ripple3Scale = useSharedValue(0);
  const ripple1Opacity = useSharedValue(0.8);
  const ripple2Opacity = useSharedValue(0.8);
  const ripple3Opacity = useSharedValue(0.8);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    const runAnimation = async () => {
      // Initial haptic
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Phase 1: Card sinks slightly
      cardScale.value = withTiming(0.95, { duration: 300 });
      cardTranslateY.value = withTiming(20, { duration: 300 });

      // Phase 2: Ripple effects
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Ripple 1
        ripple1Scale.value = withTiming(3, { duration: 800, easing: Easing.out(Easing.ease) });
        ripple1Opacity.value = withTiming(0, { duration: 800 });

        // Ripple 2 (delayed)
        setTimeout(() => {
          ripple2Scale.value = withTiming(3, { duration: 800, easing: Easing.out(Easing.ease) });
          ripple2Opacity.value = withTiming(0, { duration: 800 });
        }, 150);

        // Ripple 3 (delayed)
        setTimeout(() => {
          ripple3Scale.value = withTiming(3, { duration: 800, easing: Easing.out(Easing.ease) });
          ripple3Opacity.value = withTiming(0, { duration: 800 });
        }, 300);
      }, 300);

      // Phase 3: Card sinks deeply
      setTimeout(() => {
        cardScale.value = withSpring(0.5, { damping: 10 });
        cardTranslateY.value = withTiming(height * 0.6, {
          duration: 600,
          easing: Easing.in(Easing.ease),
        });
        cardOpacity.value = withTiming(0, { duration: 600 });

        // Final thud haptic
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 500);
      }, 1000);

      // Phase 4: Fade out and complete
      setTimeout(() => {
        overlayOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        });
      }, 1800);
    };

    runAnimation();
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }, { translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));

  const ripple1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ripple1Scale.value }],
    opacity: ripple1Opacity.value,
  }));

  const ripple2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ripple2Scale.value }],
    opacity: ripple2Opacity.value,
  }));

  const ripple3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ripple3Scale.value }],
    opacity: ripple3Opacity.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, overlayStyle]} pointerEvents="none">
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ripple effects */}
      <View style={styles.rippleContainer}>
        <Animated.View
          style={[
            styles.ripple,
            ripple1Style,
            { backgroundColor: colors.vibrantTeal + '60' },
          ]}
        />
        <Animated.View
          style={[
            styles.ripple,
            ripple2Style,
            { backgroundColor: colors.champagneGold + '60' },
          ]}
        />
        <Animated.View
          style={[
            styles.ripple,
            ripple3Style,
            { backgroundColor: colors.vibrantTeal + '60' },
          ]}
        />
      </View>

      {/* Sealing card */}
      <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(26,26,46,0.95)', 'rgba(16,16,36,0.95)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sealIcon}>🔒</Text>
            <Text style={styles.sealText}>Sealing the Win</Text>
            <Text style={styles.proofNote} numberOfLines={2}>
              {proof.note}
            </Text>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Status text */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Adding to Obsidian Vault...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  rippleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  cardContainer: {
    width: width * 0.8,
    maxWidth: 300,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.champagneGold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },
  sealIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  sealText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.champagneGold,
    marginBottom: spacing.sm,
  },
  proofNote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  statusContainer: {
    position: 'absolute',
    bottom: height * 0.2,
  },
  statusText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
  },
});
