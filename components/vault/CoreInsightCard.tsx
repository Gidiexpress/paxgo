import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, typography, borderRadius, spacing } from '@/constants/theme';
import { PermissionSlip } from '@/types';

interface CoreInsightCardProps {
  insight: PermissionSlip;
  index: number;
}

export function CoreInsightCard({ insight, index }: CoreInsightCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.container}
    >
      <LinearGradient
        colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']}
        style={styles.gradient}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[colors.champagneGold, colors.goldDark]}
            style={styles.iconGradient}
          >
            <Text style={styles.icon}>💎</Text>
          </LinearGradient>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.label}>Core Insight</Text>
          <Text style={styles.title}>{insight.title}</Text>

          {/* Fear that was addressed */}
          {insight.fear && (
            <View style={styles.fearSection}>
              <Text style={styles.fearLabel}>Addressed fear:</Text>
              <Text style={styles.fearText}>&ldquo;{insight.fear}&rdquo;</Text>
            </View>
          )}

          {/* Permission granted */}
          <View style={styles.permissionSection}>
            <Text style={styles.permissionLabel}>Permission granted:</Text>
            <Text style={styles.permissionText}>&ldquo;{insight.permission}&rdquo;</Text>
          </View>

          {/* Date */}
          <View style={styles.footer}>
            <Text style={styles.signedBy}>Signed by {insight.signedBy}</Text>
            <Text style={styles.date}>
              {new Date(insight.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: colors.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    padding: spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: colors.champagneGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
  content: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.champagneGold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.white,
    marginBottom: spacing.xs,
    lineHeight: 28,
  },
  fearSection: {
    backgroundColor: 'rgba(226, 114, 91, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(226, 114, 91, 0.5)',
  },
  fearLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: 'rgba(226, 114, 91, 0.8)',
    marginBottom: 4,
  },
  fearText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  permissionSection: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.champagneGold,
  },
  permissionLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.champagneGold,
    marginBottom: 4,
  },
  permissionText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  signedBy: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  date: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
