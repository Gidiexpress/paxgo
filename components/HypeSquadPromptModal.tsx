import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';

interface HypeSquadPromptModalProps {
  visible: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  actionsCompleted: number;
}

export function HypeSquadPromptModal({
  visible,
  onAccept,
  onDismiss,
  actionsCompleted,
}: HypeSquadPromptModalProps) {
  const emojiScale = useSharedValue(1);
  const emojiRotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Emoji bounce animation
      emojiScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Subtle wobble
      emojiRotation.value = withRepeat(
        withSequence(
          withDelay(1000, withTiming(-5, { duration: 150 })),
          withTiming(5, { duration: 300 }),
          withTiming(0, { duration: 150 })
        ),
        -1,
        false
      );

      // Glow pulse
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(0.4, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: emojiScale.value },
      { rotate: `${emojiRotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!visible) return null;

  const handleAccept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAccept();
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <BlurView intensity={90} tint="dark" style={styles.overlay}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.card}>
          {/* Glow effect */}
          <Animated.View style={[styles.glowCircle, glowStyle]} />

          {/* Main emoji */}
          <Animated.View style={[styles.emojiContainer, emojiStyle]}>
            <Text style={styles.mainEmoji}>🤝</Text>
          </Animated.View>

          {/* Badge showing actions completed */}
          <Animated.View entering={FadeIn.delay(200)} style={styles.badge}>
            <Text style={styles.badgeText}>{actionsCompleted} Bold Moves!</Text>
          </Animated.View>

          {/* Title */}
          <Animated.Text entering={FadeIn.delay(300)} style={styles.title}>
            Time to Find Your Hype Squad!
          </Animated.Text>

          {/* Message */}
          <Animated.Text entering={FadeIn.delay(400)} style={styles.message}>
            You&apos;ve proven you&apos;re serious about your journey. Now let&apos;s connect you with
            like-minded adventurers who&apos;ll cheer you on every step of the way!
          </Animated.Text>

          {/* Benefits list */}
          <Animated.View entering={FadeIn.delay(500)} style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎉</Text>
              <Text style={styles.benefitText}>Get cheered on for every win</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💪</Text>
              <Text style={styles.benefitText}>Stay accountable together</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✨</Text>
              <Text style={styles.benefitText}>Share inspiration & tips</Text>
            </View>
          </Animated.View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
              <LinearGradient
                colors={[colors.vibrantTeal, colors.tealDark]}
                style={styles.acceptGradient}
              >
                <Text style={styles.acceptText}>Find My Squad</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
              <Text style={styles.dismissText}>Maybe Later</Text>
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
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.vibrantTeal + '30',
  },
  emojiContainer: {
    marginBottom: spacing.md,
  },
  mainEmoji: {
    fontSize: 64,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  badge: {
    backgroundColor: colors.champagneGold + '20',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  badgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  benefitsList: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  benefitText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    flex: 1,
  },
  buttons: {
    width: '100%',
  },
  acceptButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  acceptGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  acceptText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  dismissButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
});
