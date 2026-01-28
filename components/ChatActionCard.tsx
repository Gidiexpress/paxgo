import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';

interface ChatActionCardProps {
  action: {
    id: string;
    title: string;
    description: string;
    duration: number;
    category: string;
  };
  onStartNow: () => void;
  onSaveForLater: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ChatActionCard({ action, onStartNow, onSaveForLater }: ChatActionCardProps) {
  const scale = useSharedValue(1);
  const startButtonScale = useSharedValue(1);
  const saveButtonScale = useSharedValue(1);

  const handleCardPressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handleCardPressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handleStartNow = async () => {
    startButtonScale.value = withSequence(
      withSpring(0.9, { damping: 15 }),
      withSpring(1, { damping: 10 })
    );
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartNow();
  };

  const handleSaveForLater = async () => {
    saveButtonScale.value = withSequence(
      withSpring(0.9, { damping: 15 }),
      withSpring(1, { damping: 10 })
    );
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaveForLater();
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const startButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: startButtonScale.value }],
  }));

  const saveButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveButtonScale.value }],
  }));

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      research: '🔍',
      planning: '📋',
      action: '🚀',
      reflection: '💭',
      connection: '🤝',
    };
    return icons[category] || '✨';
  };

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)}>
      <AnimatedPressable
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        style={[styles.container, cardStyle]}
      >
        <LinearGradient
          colors={[colors.warmCream, colors.white]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✨ Suggested Action</Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>⏱️ {action.duration} min</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryIcon}>{getCategoryIcon(action.category)}</Text>
              <Text style={styles.categoryLabel}>{action.category}</Text>
            </View>
            <Text style={styles.title}>{action.title}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {action.description}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleSaveForLater}
              activeOpacity={0.8}
            >
              <Animated.View style={[styles.saveButton, saveButtonStyle]}>
                <Text style={styles.saveButtonText}>Save for later</Text>
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleStartNow}
              activeOpacity={0.9}
            >
              <Animated.View style={[styles.startButtonWrapper, startButtonStyle]}>
                <LinearGradient
                  colors={[colors.boldTerracotta, colors.terracottaDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.startButton}
                >
                  <Text style={styles.startButtonText}>Start Now →</Text>
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  gradient: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    backgroundColor: colors.champagneGold + '30',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  badgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.terracottaDark,
    letterSpacing: 0.5,
  },
  durationBadge: {
    backgroundColor: colors.gray100,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  durationText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
  },
  content: {
    marginBottom: spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    textTransform: 'capitalize',
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
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  saveButton: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  startButtonWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  startButton: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
  },
  startButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
    letterSpacing: 0.3,
  },
});
