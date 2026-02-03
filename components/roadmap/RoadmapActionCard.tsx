import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  FadeInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, shadows, borderRadius } from '@/constants/theme';
import { RoadmapAction } from '@/types/database';

interface RoadmapActionCardProps {
  action: RoadmapAction;
  index: number;
  onComplete: (actionId: string) => void;
  onPress: (action: RoadmapAction) => void;
  onRefine?: (action: RoadmapAction) => void;
  animationDelay?: number;
  hasProof?: boolean;
  isLocked?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  research: '🔍',
  planning: '📝',
  action: '⚡',
  reflection: '🪷',
  connection: '🤝',
};

const CATEGORY_COLORS: Record<string, string> = {
  research: colors.vibrantTeal,
  planning: colors.champagneGold,
  action: colors.boldTerracotta,
  reflection: colors.terracottaLight,
  connection: colors.tealLight,
};

export function RoadmapActionCard({
  action,
  index,
  onComplete,
  onPress,
  onRefine,
  animationDelay = 0,
  hasProof = false,
  isLocked = false,
}: RoadmapActionCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const scale = useSharedValue(1);
  const checkboxScale = useSharedValue(action.is_completed ? 1 : 0);
  const checkmarkOpacity = useSharedValue(action.is_completed ? 1 : 0);

  const categoryColor = CATEGORY_COLORS[action.category || 'action'] || colors.boldTerracotta;
  const categoryIcon = CATEGORY_ICONS[action.category || 'action'] || '⚡';

  const handleCheckboxPress = async () => {
    if (action.is_completed) return;

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate checkbox
    checkboxScale.value = withSequence(
      withSpring(1.3, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );
    checkmarkOpacity.value = withTiming(1, { duration: 200 });

    // Trigger completion callback
    onComplete(action.id);
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(action);
  };

  const handlePressIn = () => {
    setIsPressed(true);
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    setIsPressed(false);
    scale.value = withSpring(1, { damping: 15 });
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCheckboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }));

  const animatedCheckmarkStyle = useAnimatedStyle(() => ({
    opacity: checkmarkOpacity.value,
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(animationDelay).springify().damping(15)}
    >
      <Pressable
        onPress={isLocked ? undefined : handleCardPress}
        onPressIn={isLocked ? undefined : handlePressIn}
        onPressOut={isLocked ? undefined : handlePressOut}
        disabled={isLocked}
      >
        <Animated.View
          style={[
            styles.card,
            action.is_completed && styles.cardCompleted,
            isLocked && styles.cardLocked,
            animatedCardStyle,
          ]}
        >
          {/* Lock overlay for locked cards */}
          {isLocked && (
            <View style={styles.lockOverlay}>
              <View style={styles.lockIcon}>
                <Text style={styles.lockIconText}>🔒</Text>
              </View>
            </View>
          )}
          {/* Category badge */}
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
            <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {action.category || 'Action'}
            </Text>
          </View>

          <View style={styles.cardContent}>
            {/* Checkbox */}
            <TouchableOpacity
              onPress={handleCheckboxPress}
              style={styles.checkboxContainer}
              disabled={!!action.is_completed}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.checkbox,
                  action.is_completed && styles.checkboxCompleted,
                  animatedCheckboxStyle,
                ]}
              >
                {action.is_completed && (
                  <LinearGradient
                    colors={[colors.goldLight, colors.champagneGold]}
                    style={styles.checkboxGradient}
                  >
                    <Animated.Text style={[styles.checkmark, animatedCheckmarkStyle]}>
                      ✓
                    </Animated.Text>
                  </LinearGradient>
                )}
              </Animated.View>
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.textContent}>
              <Text
                style={[
                  styles.title,
                  action.is_completed && styles.titleCompleted,
                ]}
                numberOfLines={2}
              >
                {action.title}
              </Text>

              {action.description && (
                <Text
                  style={[
                    styles.description,
                    action.is_completed && styles.descriptionCompleted,
                  ]}
                  numberOfLines={2}
                >
                  {action.description}
                </Text>
              )}

              {/* Duration and Why it matters preview */}
              <View style={styles.metaRow}>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationIcon}>⏱</Text>
                  <Text style={styles.durationText}>{action.duration_minutes || 15} min</Text>
                </View>

                {hasProof && (
                  <View style={styles.proofBadge}>
                    <Text style={styles.proofIcon}>📸</Text>
                    <Text style={styles.proofText}>Proof captured</Text>
                  </View>
                )}

                {!hasProof && action.why_it_matters && (
                  <Text style={styles.whyPreview} numberOfLines={1}>
                    {action.why_it_matters.substring(0, 40)}...
                  </Text>
                )}
              </View>
            </View>

            {/* Arrow indicator */}
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </View>

          {/* Gold shimmer border for completed items */}
          {action.is_completed && (
            <View style={styles.completedBorder}>
              <LinearGradient
                colors={[
                  'transparent',
                  colors.champagneGold + '30',
                  'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerBorder}
              />
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Compact version for inline display
export function RoadmapActionCardCompact({
  action,
  onComplete,
  onPress,
}: Omit<RoadmapActionCardProps, 'index' | 'animationDelay'>) {
  const categoryIcon = CATEGORY_ICONS[action.category || 'action'] || '⚡';

  return (
    <TouchableOpacity
      style={[styles.compactCard, action.is_completed && styles.compactCardCompleted]}
      onPress={() => onPress(action)}
      activeOpacity={0.8}
    >
      <TouchableOpacity
        onPress={() => !action.is_completed && onComplete(action.id)}
        style={styles.compactCheckbox}
        disabled={!!action.is_completed}
      >
        {action.is_completed ? (
          <LinearGradient
            colors={[colors.goldLight, colors.champagneGold]}
            style={styles.compactCheckboxFilled}
          >
            <Text style={styles.compactCheckmark}>✓</Text>
          </LinearGradient>
        ) : (
          <View style={styles.compactCheckboxEmpty} />
        )}
      </TouchableOpacity>

      <Text style={styles.compactIcon}>{categoryIcon}</Text>

      <Text
        style={[styles.compactTitle, action.is_completed && styles.compactTitleCompleted]}
        numberOfLines={1}
      >
        {action.title}
      </Text>

      <Text style={styles.compactDuration}>{action.duration_minutes || 15}m</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardCompleted: {
    backgroundColor: colors.warmCream,
    borderColor: colors.champagneGold + '40',
  },
  cardLocked: {
    opacity: 0.6,
    backgroundColor: colors.gray100,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  lockIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  lockIconText: {
    fontSize: 24,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  categoryIcon: {
    fontSize: 12,
  },
  categoryText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    textTransform: 'capitalize',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkboxCompleted: {
    borderColor: colors.champagneGold,
  },
  checkboxGradient: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  titleCompleted: {
    color: colors.gray500,
    textDecorationLine: 'line-through',
  },
  description: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  descriptionCompleted: {
    color: colors.gray400,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationIcon: {
    fontSize: 12,
  },
  durationText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  whyPreview: {
    flex: 1,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.boldTerracotta,
    fontStyle: 'italic',
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.vibrantTeal + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  proofIcon: {
    fontSize: 10,
  },
  proofText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.vibrantTeal,
  },
  arrowContainer: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 24,
    color: colors.gray400,
    fontWeight: '300',
  },
  completedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    overflow: 'hidden',
  },
  shimmerBorder: {
    flex: 1,
  },

  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.sm,
  },
  compactCardCompleted: {
    backgroundColor: colors.warmCream,
    borderColor: colors.champagneGold + '30',
  },
  compactCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  compactCheckboxEmpty: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 10,
  },
  compactCheckboxFilled: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCheckmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  compactIcon: {
    fontSize: 14,
  },
  compactTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
  },
  compactTitleCompleted: {
    color: colors.gray500,
    textDecorationLine: 'line-through',
  },
  compactDuration: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
  },
});
