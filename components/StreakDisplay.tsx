import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { StreakData } from '@/hooks/useStreak';

interface StreakDisplayProps {
  streak: StreakData;
  isBoldToday: boolean;
  compact?: boolean;
  showWeekView?: boolean;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function StreakDisplay({
  streak,
  isBoldToday,
  compact = false,
  showWeekView = true,
}: StreakDisplayProps) {
  // Get current day of week (0 = Sunday)
  const today = new Date().getDay();

  // Reorder days to show week ending today
  const getOrderedDays = () => {
    const ordered: { day: string; active: boolean; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayIndex = (today - i + 7) % 7;
      ordered.push({
        day: DAYS_OF_WEEK[dayIndex],
        active: streak.weekActivity[i] || false,
        isToday: i === 0,
      });
    }
    return ordered;
  };

  const orderedDays = getOrderedDays();

  if (compact) {
    return (
      <Animated.View entering={FadeIn} style={styles.compactContainer}>
        <View style={styles.compactFlame}>
          <Text style={styles.compactFlameEmoji}>{streak.currentStreak > 0 ? '🔥' : '💫'}</Text>
        </View>
        <Text style={styles.compactNumber}>{streak.currentStreak}</Text>
        <Text style={styles.compactLabel}>day{streak.currentStreak !== 1 ? 's' : ''}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.container}>
      {/* Main Streak Display */}
      <View style={styles.mainDisplay}>
        <View style={styles.streakIconContainer}>
          {streak.currentStreak > 0 ? (
            <LinearGradient
              colors={[colors.boldTerracotta, colors.terracottaDark]}
              style={styles.streakIconGradient}
            >
              <Text style={styles.streakEmoji}>🔥</Text>
            </LinearGradient>
          ) : (
            <View style={styles.streakIconInactive}>
              <Text style={styles.streakEmoji}>💫</Text>
            </View>
          )}
        </View>

        <View style={styles.streakInfo}>
          <View style={styles.streakNumberRow}>
            <Text style={styles.streakNumber}>{streak.currentStreak}</Text>
            <Text style={styles.streakUnit}>day streak</Text>
          </View>
          <Text style={styles.streakMessage}>
            {streak.currentStreak === 0
              ? 'Take a bold action to start your streak!'
              : isBoldToday
                ? "You've been bold today! 💪"
                : 'Keep it going with an action today!'}
          </Text>
        </View>
      </View>

      {/* Week View */}
      {showWeekView && (
        <View style={styles.weekView}>
          <Text style={styles.weekLabel}>This Week</Text>
          <View style={styles.weekDays}>
            {orderedDays.map((item, index) => (
              <View key={index} style={styles.dayColumn}>
                <View
                  style={[
                    styles.dayDot,
                    item.active && styles.dayDotActive,
                    item.isToday && styles.dayDotToday,
                  ]}
                >
                  {item.active && (
                    <Text style={styles.dayDotEmoji}>
                      {item.isToday ? '⭐' : '✓'}
                    </Text>
                  )}
                </View>
                <Text style={[styles.dayLabel, item.isToday && styles.dayLabelToday]}>
                  {item.day}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{streak.longestStreak}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{streak.totalBoldDays}</Text>
          <Text style={styles.statLabel}>Total Bold Days</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Mini version for home screen
export function StreakBadge({
  currentStreak,
  isBoldToday,
}: {
  currentStreak: number;
  isBoldToday: boolean;
}) {
  return (
    <View style={styles.badge}>
      <LinearGradient
        colors={
          currentStreak > 0
            ? [colors.boldTerracotta + '20', colors.terracottaDark + '10']
            : [colors.gray200, colors.gray100]
        }
        style={styles.badgeGradient}
      >
        <Text style={styles.badgeEmoji}>
          {currentStreak > 0 ? '🔥' : '💫'}
        </Text>
        <Text style={[styles.badgeNumber, currentStreak > 0 && styles.badgeNumberActive]}>
          {currentStreak}
        </Text>
        {isBoldToday && currentStreak > 0 && (
          <View style={styles.boldTodayDot} />
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact version
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  compactFlame: {
    marginRight: spacing.xs,
  },
  compactFlameEmoji: {
    fontSize: 16,
  },
  compactNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.boldTerracotta,
  },
  compactLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginLeft: spacing.xs,
  },

  // Full version
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    ...shadows.md,
  },
  mainDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  streakIconContainer: {
    marginRight: spacing.lg,
  },
  streakIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakIconInactive: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakEmoji: {
    fontSize: 28,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 36,
    color: colors.midnightNavy,
    lineHeight: 40,
  },
  streakUnit: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
    marginLeft: spacing.sm,
  },
  streakMessage: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginTop: spacing.xs,
  },

  // Week View
  weekView: {
    backgroundColor: colors.warmCream,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  weekLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  dayDotActive: {
    backgroundColor: colors.vibrantTeal,
  },
  dayDotToday: {
    borderWidth: 2,
    borderColor: colors.boldTerracotta,
  },
  dayDotEmoji: {
    fontSize: 14,
    color: colors.white,
  },
  dayLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: 10,
    color: colors.gray500,
  },
  dayLabelToday: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.boldTerracotta,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.champagneGold,
  },
  statLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.md,
  },

  // Badge version
  badge: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    position: 'relative',
  },
  badgeEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  badgeNumber: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  badgeNumberActive: {
    color: colors.boldTerracotta,
  },
  boldTodayDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.vibrantTeal,
  },
});
