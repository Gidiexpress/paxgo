import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { MicroAction } from '@/types';

interface MilestoneTimelineProps {
  milestones: MicroAction[];
  onClose: () => void;
}

export function MilestoneTimeline({ milestones, onClose }: MilestoneTimelineProps) {
  const insets = useSafeAreaInsets();

  // Sort by completion date
  const sortedMilestones = [...milestones].sort(
    (a, b) =>
      new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
  );

  // Group by month
  const groupedByMonth: { [key: string]: MicroAction[] } = {};
  sortedMilestones.forEach((milestone) => {
    if (milestone.completedAt) {
      const date = new Date(milestone.completedAt);
      const monthKey = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = [];
      }
      groupedByMonth[monthKey].push(milestone);
    }
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Milestone Timeline</Text>
          <Text style={styles.headerSubtitle}>Your Golden Path History</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedByMonth).map(([month, actions], monthIndex) => (
          <View key={month} style={styles.monthSection}>
            <View style={styles.monthHeader}>
              <View style={styles.monthBadge}>
                <Text style={styles.monthText}>{month}</Text>
              </View>
              <View style={styles.monthLine} />
            </View>

            {actions.map((milestone, index) => (
              <Animated.View
                key={milestone.id}
                entering={FadeInRight.delay((monthIndex * 10 + index) * 50)}
                style={styles.milestoneItem}
              >
                {/* Timeline connector */}
                <View style={styles.timelineConnector}>
                  <View style={styles.timelineDot} />
                  {index < actions.length - 1 && <View style={styles.timelineLine} />}
                </View>

                {/* Milestone card */}
                <View style={styles.milestoneCard}>
                  <LinearGradient
                    colors={['rgba(46, 196, 182, 0.1)', 'rgba(46, 196, 182, 0.05)']}
                    style={styles.milestoneCardGradient}
                  >
                    <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                    {milestone.description && (
                      <Text style={styles.milestoneDescription} numberOfLines={2}>
                        {milestone.description}
                      </Text>
                    )}
                    <View style={styles.milestoneFooter}>
                      <View style={styles.milestoneBadge}>
                        <Text style={styles.milestoneBadgeText}>
                          {milestone.duration}min
                        </Text>
                      </View>
                      <Text style={styles.milestoneDate}>
                        {milestone.completedAt &&
                          new Date(milestone.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>
            ))}
          </View>
        ))}

        {sortedMilestones.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>No Milestones Yet</Text>
            <Text style={styles.emptyText}>
              Complete actions to build your Golden Path timeline
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 196, 182, 0.2)',
  },
  headerCenter: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.vibrantTeal,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  closeButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.vibrantTeal,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  monthSection: {
    marginBottom: spacing['2xl'],
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  monthBadge: {
    backgroundColor: 'rgba(46, 196, 182, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(46, 196, 182, 0.4)',
  },
  monthText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.vibrantTeal,
  },
  monthLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(46, 196, 182, 0.2)',
    marginLeft: spacing.md,
  },
  milestoneItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  timelineConnector: {
    width: 40,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.vibrantTeal,
    borderWidth: 2,
    borderColor: 'rgba(46, 196, 182, 0.3)',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(46, 196, 182, 0.3)',
    marginTop: spacing.xs,
  },
  milestoneCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(46, 196, 182, 0.3)',
  },
  milestoneCardGradient: {
    padding: spacing.md,
  },
  milestoneTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  milestoneDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  milestoneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneBadge: {
    backgroundColor: 'rgba(46, 196, 182, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  milestoneBadgeText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.vibrantTeal,
  },
  milestoneDate: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.vibrantTeal,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
