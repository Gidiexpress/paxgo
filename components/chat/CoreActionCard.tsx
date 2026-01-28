import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';

interface CoreActionCardProps {
  action: {
    id: string;
    title: string;
    description: string;
    duration: number;
    category: string;
    limitingBelief: string;
  };
  onStartNow: () => void;
  onSaveForLater: () => void;
  disabled?: boolean;
}

export function CoreActionCard({
  action,
  onStartNow,
  onSaveForLater,
  disabled,
}: CoreActionCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleStartNow = async () => {
    if (disabled) return;
    scale.value = withSpring(0.98, {}, () => {
      scale.value = withSpring(1);
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartNow();
  };

  const handleSaveForLater = async () => {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSaveForLater();
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      reflection: '🪞',
      action: '⚡',
      connection: '🤝',
      research: '🔍',
      planning: '📝',
    };
    return icons[category] || '✨';
  };

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(12)}
      style={[animatedStyle, styles.container]}
    >
      <LinearGradient
        colors={[colors.warmCream, colors.parchmentWhite]}
        style={styles.cardBackground}
      >
        {/* Premium Badge */}
        <View style={styles.premiumBadge}>
          <LinearGradient
            colors={[colors.champagneGold, colors.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.premiumBadgeGradient}
          >
            <Text style={styles.premiumBadgeText}>✨ Core Action</Text>
          </LinearGradient>
        </View>

        {/* Limiting Belief Tag */}
        {action.limitingBelief && (
          <View style={styles.beliefTag}>
            <Text style={styles.beliefLabel}>Addresses:</Text>
            <Text style={styles.beliefText}>&quot;{action.limitingBelief}&quot;</Text>
          </View>
        )}

        {/* Action Content */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(action.category)}</Text>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{action.title}</Text>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>⏱️ {action.duration} min</Text>
              </View>
            </View>
          </View>

          <Text style={styles.description}>{action.description}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.startButton, disabled && styles.buttonDisabled]}
              onPress={handleStartNow}
              disabled={disabled}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colors.boldTerracotta, colors.terracottaDark]}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>Begin Now</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, disabled && styles.buttonDisabled]}
              onPress={handleSaveForLater}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Save for Later</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeCorner}>
          <Text style={styles.decorativeText}>❋</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
    marginHorizontal: spacing.xs,
  },
  cardBackground: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.champagneGold + '40',
    overflow: 'hidden',
    ...shadows.lg,
  },
  premiumBadge: {
    position: 'absolute',
    top: -1,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  premiumBadgeGradient: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  premiumBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.midnightNavy,
    letterSpacing: 0.5,
  },
  beliefTag: {
    backgroundColor: colors.midnightNavy + '08',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing['2xl'] + spacing.sm,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.vibrantTeal,
  },
  beliefLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginBottom: 2,
  },
  beliefText: {
    fontFamily: typography.fontFamily.headingItalic,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    fontStyle: 'italic',
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  categoryIcon: {
    fontSize: 28,
    marginRight: spacing.md,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    lineHeight: 28,
    marginBottom: spacing.xs,
  },
  durationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.tealLight + '30',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  durationText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.tealDark,
  },
  description: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  startButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  startButtonGradient: {
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  decorativeCorner: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.md,
    opacity: 0.15,
  },
  decorativeText: {
    fontSize: 48,
    color: colors.champagneGold,
  },
});
