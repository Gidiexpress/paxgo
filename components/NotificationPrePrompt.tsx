/**
 * Notification Permission Pre-Prompt Modal
 * A beautiful, empathetic modal that explains the value of notifications
 * before the system permission prompt appears
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NotificationPrePromptProps {
  visible: boolean;
  onAllow: () => void;
  onNotNow: () => void;
}

const NOTIFICATION_BENEFITS = [
  {
    icon: '🎯',
    title: 'Daily Nudge',
    description: 'A friendly reminder for your 5-min micro-action',
  },
  {
    icon: '✨',
    title: "Gabby's Reframes",
    description: 'Mindset shifts to start your day with courage',
  },
  {
    icon: '🔥',
    title: 'Streak Savior',
    description: "We'll help you keep your momentum going",
  },
  {
    icon: '🎉',
    title: 'Hype Squad',
    description: 'Know when your crew is cheering you on',
  },
];

function BenefitItem({
  icon,
  title,
  description,
  index,
}: {
  icon: string;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 100).springify()}
      style={styles.benefitItem}
    >
      <View style={styles.benefitIconContainer}>
        <Text style={styles.benefitIcon}>{icon}</Text>
      </View>
      <View style={styles.benefitText}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDescription}>{description}</Text>
      </View>
    </Animated.View>
  );
}

export function NotificationPrePrompt({
  visible,
  onAllow,
  onNotNow,
}: NotificationPrePromptProps) {
  const bellScale = useSharedValue(1);

  // Bell animation
  React.useEffect(() => {
    if (visible) {
      bellScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 150 }),
          withTiming(0.9, { duration: 150 }),
          withTiming(1.05, { duration: 150 }),
          withTiming(1, { duration: 150 }),
          withTiming(1, { duration: 1000 }) // Pause
        ),
        -1
      );
    }
  }, [visible, bellScale]);

  const bellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bellScale.value }],
  }));

  const handleAllow = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAllow();
  }, [onAllow]);

  const handleNotNow = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNotNow();
  }, [onNotNow]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={80} style={styles.overlay} tint="dark">
        <Pressable style={styles.backdrop} onPress={handleNotNow} />

        <Animated.View
          entering={FadeIn}
          style={styles.modalContainer}
        >
          <Animated.View
            entering={FadeInUp.springify()}
            style={styles.modal}
          >
            {/* Header Gradient */}
            <LinearGradient
              colors={[colors.midnightNavy, '#0A2540']}
              style={styles.headerGradient}
            >
              {/* Bell Icon */}
              <Animated.View style={[styles.bellContainer, bellAnimatedStyle]}>
                <LinearGradient
                  colors={[colors.champagneGold, colors.goldDark]}
                  style={styles.bellGradient}
                >
                  <Text style={styles.bellIcon}>🔔</Text>
                </LinearGradient>
              </Animated.View>

              {/* Title */}
              <Animated.Text
                entering={FadeInDown.delay(200)}
                style={styles.title}
              >
                Stay Connected to{'\n'}Your Dreams
              </Animated.Text>

              <Animated.Text
                entering={FadeInDown.delay(300)}
                style={styles.subtitle}
              >
                Get gentle reminders and encouragement from Gabby, your personal mindset coach
              </Animated.Text>
            </LinearGradient>

            {/* Benefits List */}
            <View style={styles.benefitsContainer}>
              {NOTIFICATION_BENEFITS.map((benefit, index) => (
                <BenefitItem
                  key={benefit.title}
                  icon={benefit.icon}
                  title={benefit.title}
                  description={benefit.description}
                  index={index}
                />
              ))}
            </View>

            {/* Promise Badge */}
            <Animated.View
              entering={FadeInDown.delay(700)}
              style={styles.promiseBadge}
            >
              <Text style={styles.promiseIcon}>🤝</Text>
              <Text style={styles.promiseText}>
                We promise: only helpful nudges, never spam
              </Text>
            </Animated.View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <Animated.View entering={FadeInDown.delay(800)} style={styles.buttonWrapper}>
                <TouchableOpacity
                  onPress={handleAllow}
                  style={styles.allowButton}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[colors.champagneGold, colors.goldDark]}
                    style={styles.allowButtonGradient}
                  >
                    <Text style={styles.allowButtonText}>Enable Notifications</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(900)}>
                <TouchableOpacity
                  onPress={handleNotNow}
                  style={styles.notNowButton}
                >
                  <Text style={styles.notNowText}>Maybe Later</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: SCREEN_WIDTH - spacing['3xl'],
    maxWidth: 380,
  },
  modal: {
    backgroundColor: colors.parchmentWhite,
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
    ...shadows.lg,
  },
  headerGradient: {
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  bellContainer: {
    marginBottom: spacing.lg,
  },
  bellGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  bellIcon: {
    fontSize: 40,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.white + 'CC',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  benefitsContainer: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  benefitIcon: {
    fontSize: 22,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: 2,
  },
  benefitDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  promiseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.vibrantTeal + '15',
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  promiseIcon: {
    fontSize: 16,
  },
  promiseText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.tealDark,
  },
  buttonsContainer: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  buttonWrapper: {
    marginBottom: spacing.md,
  },
  allowButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.glow,
  },
  allowButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  allowButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.white,
  },
  notNowButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  notNowText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
  },
});
