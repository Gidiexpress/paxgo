import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { ConfettiAnimation } from './ConfettiAnimation';

interface FirstWinCelebrationProps {
  visible: boolean;
  isFirstWin: boolean;
  message: string;
  onContinue: () => void;
  onUpgrade?: () => void;
  showUpgradeOption?: boolean;
}

export function FirstWinCelebration({
  visible,
  isFirstWin,
  message,
  onContinue,
  onUpgrade,
  showUpgradeOption = false,
}: FirstWinCelebrationProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Trigger haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Pulsing animation
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        3,
        true
      );

      // Subtle wobble
      rotation.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 150 }),
          withTiming(3, { duration: 300 }),
          withTiming(0, { duration: 150 })
        ),
        2,
        false
      );

      // Glow effect
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.5, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1 + glow.value * 0.3 }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
    >
      <BlurView intensity={90} tint="dark" style={styles.overlay}>
        {/* Confetti for first win */}
        {isFirstWin && <ConfettiAnimation active={true} count={60} />}

        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.card}>
          {/* Glow effect */}
          <Animated.View style={[styles.glowCircle, glowStyle]} />

          {/* Main emoji */}
          <Animated.View style={[styles.emojiContainer, emojiStyle]}>
            <Text style={styles.mainEmoji}>
              {isFirstWin ? '🎉' : '✨'}
            </Text>
          </Animated.View>

          {/* Title */}
          <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
            {isFirstWin ? 'Your First Bold Move!' : 'Nice Work!'}
          </Animated.Text>

          {/* Message */}
          <Animated.Text entering={FadeInDown.delay(300)} style={styles.message}>
            {message}
          </Animated.Text>

          {/* First win special message */}
          {isFirstWin && (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.specialMessage}>
              <LinearGradient
                colors={[colors.champagneGold + '20', colors.goldLight + '10']}
                style={styles.specialMessageGradient}
              >
                <Text style={styles.specialMessageText}>
                  🌟 This is just the beginning. Every big change starts with one small, bold step.
                </Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Buttons */}
          <View style={styles.buttons}>
            {showUpgradeOption && isFirstWin && onUpgrade && (
              <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
                <LinearGradient
                  colors={[colors.champagneGold, colors.goldDark]}
                  style={styles.upgradeGradient}
                >
                  <Text style={styles.upgradeText}>Unlock More with $1 Trial</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.continueButton,
                !showUpgradeOption && styles.continueButtonPrimary,
              ]}
              onPress={onContinue}
            >
              {showUpgradeOption ? (
                <Text style={styles.continueTextSecondary}>Maybe Later</Text>
              ) : (
                <LinearGradient
                  colors={[colors.vibrantTeal, colors.tealDark]}
                  style={styles.continueGradient}
                >
                  <Text style={styles.continueText}>
                    {isFirstWin ? "Let's Keep Going!" : 'Continue'}
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['2xl'],
    alignItems: 'center',
    ...shadows.xl,
    overflow: 'visible',
  },
  glowCircle: {
    position: 'absolute',
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.champagneGold + '30',
  },
  emojiContainer: {
    marginBottom: spacing.lg,
  },
  mainEmoji: {
    fontSize: 80,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  specialMessage: {
    width: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  specialMessageGradient: {
    padding: spacing.lg,
  },
  specialMessageText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  upgradeButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  upgradeGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  upgradeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  continueButtonPrimary: {
    ...shadows.md,
  },
  continueGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  continueText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  continueTextSecondary: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
