import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { colors, typography, borderRadius, shadows, spacing } from '@/constants/theme';
import { MicroAction } from '@/types';

interface ActionCardProps {
  action: MicroAction;
  onComplete: (actionId: string) => void;
  onPress?: () => void;
  onDeepDive?: () => void;
  hasActiveDeepDive?: boolean;
  isLocked?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActionCard({
  action,
  onComplete,
  onPress,
  onDeepDive,
  hasActiveDeepDive,
  isLocked,
}: ActionCardProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const checkScale = useSharedValue(action.isCompleted ? 1 : 0);
  const pressProgress = useSharedValue(0);

  useEffect(() => {
    checkScale.value = withSpring(action.isCompleted ? 1 : 0);
  }, [action.isCompleted]);

  const handlePressIn = () => {
    if (isLocked) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(1, { duration: 150 });
    pressProgress.value = withTiming(1, { duration: 150 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0, { duration: 200 });
    pressProgress.value = withTiming(0, { duration: 200 });
  };

  const handleComplete = async () => {
    if (action.isCompleted || isLocked) return;

    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animation
    scale.value = withSequence(
      withSpring(1.05, { damping: 8 }),
      withSpring(1)
    );

    onComplete(action.id);
  };

  const handleDeepDive = () => {
    if (isLocked) {
      onPress?.();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDeepDive?.();
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.15,
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const borderStyle = useAnimatedStyle(() => {
    const borderWidth = interpolate(
      pressProgress.value,
      [0, 1],
      [0, 2],
      Extrapolation.CLAMP
    );
    return {
      borderWidth,
      borderColor: colors.boldTerracotta,
    };
  });

  if (isLocked) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.lockedCard}>
          <LinearGradient
            colors={[colors.gray200, colors.gray300]}
            style={styles.lockedGradient}
          >
            <View style={styles.lockIcon}>
              <Text style={styles.lockEmoji}>🔒</Text>
            </View>
            <Text style={styles.lockedTitle}>{action.title}</Text>
            <Text style={styles.lockedSubtitle}>Upgrade to unlock</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleDeepDive}
      style={[cardStyle, styles.cardWrapper]}
    >
      {/* Glow effect on press */}
      <Animated.View style={[styles.glowEffect, glowStyle]} />

      <Animated.View style={[styles.cardContainer, borderStyle]}>
        <Card
          variant={action.isCompleted ? 'completed' : action.isPremium ? 'premium' : 'default'}
          style={styles.card}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.badges}>
                {action.isPremium && !action.isCompleted && (
                  <Badge label="Premium Task" variant="premium" />
                )}
                {hasActiveDeepDive && !action.isCompleted && (
                  <Badge label="In Progress" variant="gold" />
                )}
              </View>
              {action.isCompleted ? (
                <Animated.View style={[styles.checkCircle, checkAnimatedStyle]}>
                  <Text style={styles.checkmark}>✓</Text>
                </Animated.View>
              ) : (
                <View style={styles.crownIcon}>
                  <Text style={styles.crown}>👑</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.title}>{action.title}</Text>

            {/* Description */}
            {action.description && (
              <Text style={styles.description} numberOfLines={2}>
                {action.description}
              </Text>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.duration}>
                <Text style={styles.clockIcon}>⏱️</Text>
                <Text style={styles.durationText}>{action.duration} min</Text>
              </View>

              {!action.isCompleted ? (
                <View style={styles.actionButtons}>
                  {/* Deep Dive Button */}
                  <TouchableOpacity
                    onPress={handleDeepDive}
                    style={styles.deepDiveButton}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={[colors.boldTerracotta, colors.terracottaDark]}
                      style={styles.deepDiveGradient}
                    >
                      <Text style={styles.deepDiveText}>
                        {hasActiveDeepDive ? 'Continue' : 'Do it now'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Quick Complete */}
                  <TouchableOpacity
                    onPress={handleComplete}
                    style={styles.quickCompleteButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.quickCompleteText}>✓</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>Completed</Text>
                  <Text style={styles.confetti}>🎉</Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: colors.boldTerracotta,
    borderRadius: borderRadius.xl + 4,
  },
  cardContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  card: {
    marginBottom: 0,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.vibrantTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  crownIcon: {
    opacity: 0.3,
  },
  crown: {
    fontSize: 20,
  },
  title: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clockIcon: {
    fontSize: 14,
  },
  durationText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deepDiveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  deepDiveGradient: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  deepDiveText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  quickCompleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  quickCompleteText: {
    fontSize: 16,
    color: colors.gray600,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.tealLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  completedText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.tealDark,
  },
  confetti: {
    fontSize: 16,
  },
  // Locked card styles
  lockedCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    opacity: 0.7,
  },
  lockedGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  lockIcon: {
    marginBottom: spacing.sm,
  },
  lockEmoji: {
    fontSize: 24,
  },
  lockedTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  lockedSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
});
