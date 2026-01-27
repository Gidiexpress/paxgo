import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { colors, typography, borderRadius, shadows, spacing } from '@/constants/theme';
import { MicroAction } from '@/types';

interface ActionCardProps {
  action: MicroAction;
  onComplete: (actionId: string) => void;
  onPress?: () => void;
}

export function ActionCard({ action, onComplete, onPress }: ActionCardProps) {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(action.isCompleted ? 1 : 0);

  useEffect(() => {
    checkScale.value = withSpring(action.isCompleted ? 1 : 0);
  }, [action.isCompleted]);

  const handleComplete = async () => {
    if (!action.isCompleted) {
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animation
      scale.value = withSequence(
        withSpring(1.05),
        withSpring(1)
      );

      onComplete(action.id);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Card
        variant={action.isCompleted ? 'completed' : action.isPremium ? 'premium' : 'default'}
        style={styles.card}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.9}
          style={styles.content}
        >
          <View style={styles.header}>
            <View style={styles.badges}>
              {action.isPremium && (
                <Badge label="Premium Task" variant="premium" />
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

          <Text style={styles.title}>{action.title}</Text>

          {action.description && (
            <Text style={styles.description} numberOfLines={2}>
              {action.description}
            </Text>
          )}

          <View style={styles.footer}>
            <View style={styles.duration}>
              <Text style={styles.clockIcon}>⏱️</Text>
              <Text style={styles.durationText}>{action.duration} min</Text>
            </View>

            {!action.isCompleted ? (
              <Button
                title="Do it now"
                onPress={handleComplete}
                variant="primary"
                size="sm"
                style={styles.actionButton}
              />
            ) : (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Completed</Text>
                <Text style={styles.confetti}>🎉</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
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
  actionButton: {
    minWidth: 100,
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
});
