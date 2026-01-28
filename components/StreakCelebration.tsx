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
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { ConfettiAnimation } from './ConfettiAnimation';

interface StreakCelebrationProps {
  visible: boolean;
  streakCount: number;
  milestone: { title: string; emoji: string } | null;
  onClose: () => void;
  onShare?: () => void;
}

export function StreakCelebration({
  visible,
  streakCount,
  milestone,
  onClose,
  onShare,
}: StreakCelebrationProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Pulsing animation for the streak number
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        3,
        true
      );

      // Subtle rotation for playfulness
      rotation.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 200 }),
          withTiming(2, { duration: 400 }),
          withTiming(0, { duration: 200 })
        ),
        2,
        false
      );

      // Glow effect
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const numberStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1 + glow.value * 0.2 }],
  }));

  if (!visible) return null;

  const isFirstStreak = streakCount === 1;
  const isMilestone = milestone !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint="dark" style={styles.overlay}>
        {/* Confetti for milestones */}
        {isMilestone && <ConfettiAnimation active={true} />}

        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.card}>
          {/* Glow effect behind emoji */}
          <Animated.View style={[styles.glowCircle, glowStyle]} />

          {/* Main emoji */}
          <Animated.View style={[styles.emojiContainer, numberStyle]}>
            <Text style={styles.mainEmoji}>
              {milestone?.emoji || (isFirstStreak ? '🌱' : '🔥')}
            </Text>
          </Animated.View>

          {/* Title */}
          <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
            {milestone?.title || (isFirstStreak ? 'You Started a Streak!' : `${streakCount} Day Streak!`)}
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text entering={FadeInDown.delay(300)} style={styles.subtitle}>
            {isFirstStreak
              ? "Your journey begins! Come back tomorrow to keep it going."
              : isMilestone
                ? "What an achievement! You're building something amazing."
                : "Your boldness is building momentum!"}
          </Animated.Text>

          {/* Streak number badge */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.streakBadge}>
            <LinearGradient
              colors={[colors.boldTerracotta, colors.terracottaDark]}
              style={styles.badgeGradient}
            >
              <Text style={styles.badgeNumber}>{streakCount}</Text>
              <Text style={styles.badgeLabel}>days</Text>
            </LinearGradient>
          </Animated.View>

          {/* Encouragement */}
          <Animated.Text entering={FadeInDown.delay(500)} style={styles.encouragement}>
            {getEncouragement(streakCount)}
          </Animated.Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            {onShare && (
              <TouchableOpacity style={styles.shareButton} onPress={onShare}>
                <Text style={styles.shareButtonText}>Share 🎉</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.continueButton} onPress={onClose}>
              <LinearGradient
                colors={[colors.vibrantTeal, colors.tealDark]}
                style={styles.continueGradient}
              >
                <Text style={styles.continueText}>Keep Going</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

function getEncouragement(streak: number): string {
  if (streak === 1) {
    return "The first step is always the boldest. You've got this!";
  }
  if (streak < 3) {
    return "Building momentum! Each day makes the next easier.";
  }
  if (streak < 7) {
    return "You're proving to yourself that you can do hard things.";
  }
  if (streak < 14) {
    return "A full week of boldness! This is becoming who you are.";
  }
  if (streak < 30) {
    return "Most people give up by now. You're not most people.";
  }
  if (streak < 50) {
    return "A month of consistent boldness is life-changing.";
  }
  return "You're rewriting your story, one bold day at a time.";
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
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.champagneGold + '40',
  },
  emojiContainer: {
    marginBottom: spacing.lg,
  },
  mainEmoji: {
    fontSize: 72,
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
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  streakBadge: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  badgeNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 40,
    color: colors.white,
  },
  badgeLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.lg,
    color: colors.white + 'CC',
    marginLeft: spacing.sm,
  },
  encouragement: {
    fontFamily: typography.fontFamily.headingItalic || typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  shareButton: {
    backgroundColor: colors.warmCream,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  shareButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
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
});
