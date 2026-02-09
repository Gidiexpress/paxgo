import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, shadows, borderRadius } from '@/constants/theme';
import { ConfettiAnimation } from '@/components/ConfettiAnimation';
import { FocusModeModal } from '@/components/roadmap/FocusModeModal';
import { useUser } from '@/hooks/useStorage';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { RoadmapAction } from '@/types/database';

// Get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '☀️ Good morning';
  if (hour < 17) return '🌤️ Good afternoon';
  return '🌙 Good evening';
};

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { showSuccess } = useSnackbar();
  // Note: proof functionality can be added later if needed
  const {
    activeRoadmap,
    roadmaps, // Add roadmaps to destructuring
    loading,
    activeProgress,
    completedCount,
    totalCount,
    completeAction,
    fetchRoadmaps,
    updateRoadmapStatus,
  } = useRoadmap();

  const [selectedAction, setSelectedAction] = useState<RoadmapAction | null>(null);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get the current action (first incomplete action)
  const currentAction = activeRoadmap?.actions?.find((a) => !a.is_completed) || null;

  // Get next action preview
  const nextAction = activeRoadmap?.actions?.find(
    (a, index) => !a.is_completed && activeRoadmap.actions.findIndex((x) => !x.is_completed) !== index
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRoadmaps();
    setRefreshing(false);
  }, [fetchRoadmaps]);

  const handleStartAction = () => {
    if (currentAction) {
      setSelectedAction(currentAction);
      setShowFocusMode(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleComplete = async (actionId: string) => {
    const success = await completeAction(actionId);
    if (success) {
      setShowConfetti(true);
      showSuccess('Action completed! You are making progress! 🔥');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Close focus mode after a brief delay to show completion
      setTimeout(() => {
        setShowFocusMode(false);
        setSelectedAction(null);
      }, 500);
    }
  };

  // Handle sub-action completion without closing the modal
  const handleSubActionComplete = async (subActionId: string) => {
    const success = await completeAction(subActionId);
    if (success) {
      // Show confetti within the modal (handled by FocusModeModal)

      // Update local state to reflect change immediately without reloading
      setSelectedAction((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          subActions: prev.subActions?.map((sub) =>
            sub.id === subActionId
              ? { ...sub, is_completed: true }
              : sub
          ),
        };
      });
    }
  };

  const handleCloseFocusMode = () => {
    setShowFocusMode(false);
    setSelectedAction(null);
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.boldTerracotta} />
        <Text style={styles.loadingText}>Loading your journey...</Text>
      </View>
    );
  }

  // Empty state - no roadmap
  if (!activeRoadmap || !activeRoadmap.actions || activeRoadmap.actions.length === 0) {
    // Check if this is a new user (no roadmaps at all) or just no active one
    const isNewUser = (!roadmaps || roadmaps.length === 0);

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.parchmentWhite, colors.warmCream]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.emptyContainer, { paddingTop: insets.top + spacing['3xl'] }]}>
          <Animated.View entering={FadeInDown}>
            <Text style={styles.emptyIcon}>{isNewUser ? '🎯' : '🌟'}</Text>
            <Text style={styles.emptyTitle}>
              {isNewUser ? 'Ready to Start?' : 'All Caught Up!'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isNewUser
                ? 'Create your first roadmap to begin your journey toward your dream'
                : 'You have no active roadmaps right now. Time for a new dream?'}
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyAction}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/new-dream')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.boldTerracotta, colors.terracottaDark]}
                style={styles.createButtonGradient}
              >
                <Text style={styles.createButtonText}>
                  {isNewUser ? 'Start My Journey' : 'Start New Dream'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {!isNewUser && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/(tabs)/wins')}
              >
                <Text style={styles.secondaryButtonText}>View My Wins</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </View>
    );
  }

  // All complete state
  if (!currentAction) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.vibrantTeal, colors.tealLight]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.celebrateContainer, { paddingTop: insets.top + spacing['3xl'] }]}>
          <Animated.View entering={FadeInDown}>
            <Text style={styles.celebrateIcon}>🎉</Text>
            <Text style={styles.celebrateTitle}>Amazing Work!</Text>
            <Text style={styles.celebrateSubtitle}>
              You've completed all your actions for this dream!
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(200)} style={styles.celebrateAction}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: 'rgba(255,255,255,0.5)' }]}
              onPress={async () => {
                if (activeRoadmap) {
                  await updateRoadmapStatus(activeRoadmap.id, 'completed');
                }
                router.push('/(tabs)/wins');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.parchmentWhite }]}>View Your Wins 🏆</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Main view - show ONE action
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.boldTerracotta} />
        }
      >
        {/* Greeting */}
        <Animated.View entering={FadeIn}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
        </Animated.View>

        {/* Main Action Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.mainCard}>
          <LinearGradient
            colors={[colors.parchmentWhite, colors.warmCream]}
            style={styles.mainCardGradient}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.focusLabel}>🎯 Today's Focus</Text>
              <Text style={styles.stepIndicator}>
                Step {completedCount + 1} of {totalCount}
              </Text>
            </View>

            <Text style={styles.actionTitle}>{currentAction.title}</Text>

            {currentAction.description && (
              <Text style={styles.actionDescription} numberOfLines={2}>
                {currentAction.description}
              </Text>
            )}

            <View style={styles.metaRow}>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>
                  ⏱️ {currentAction.duration_minutes || 15} min
                </Text>
              </View>
              {currentAction.category && (
                <Text style={styles.categoryText}>
                  {currentAction.category.charAt(0).toUpperCase() + currentAction.category.slice(1)}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartAction}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.boldTerracotta, colors.terracottaDark]}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>Start This Action</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Progress Section */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.progressSection}>
          <Text style={styles.progressLabel}>Your Progress</Text>
          <View style={styles.progressDots}>
            {activeRoadmap.actions.map((action, index) => (
              <View
                key={action.id}
                style={[
                  styles.progressDot,
                  action.is_completed && styles.progressDotCompleted,
                  !action.is_completed && index === completedCount && styles.progressDotCurrent,
                ]}
              />
            ))}
          </View>
          <Text style={styles.progressText}>
            {completedCount}/{totalCount} complete
            {completedCount > 0 && ' • Keep going! 🔥'}
          </Text>
        </Animated.View>

        {/* Up Next Preview */}
        {nextAction && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.upNextCard}>
            <Text style={styles.upNextLabel}>Up Next</Text>
            <Text style={styles.upNextTitle} numberOfLines={1}>
              {nextAction.title}
            </Text>
            <Text style={styles.upNextDuration}>
              {nextAction.duration_minutes || 15} min
            </Text>
          </Animated.View>
        )}

        {/* Dream Context */}
        {activeRoadmap.dream && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.dreamContext}>
            <Text style={styles.dreamLabel}>Working toward:</Text>
            <Text style={styles.dreamText} numberOfLines={2}>
              "{activeRoadmap.dream}"
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Confetti */}
      <ConfettiAnimation active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Focus Mode Modal */}
      <FocusModeModal
        visible={showFocusMode}
        action={selectedAction}
        onClose={handleCloseFocusMode}
        onComplete={handleComplete}
        onSubActionComplete={handleSubActionComplete}
        onRefine={() => { }}
        onBreakDown={() => { }}
        onCaptureProof={() => { }}
        isRefining={false}
        isBreakingDown={false}
        hasProof={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
  },
  // Greeting
  greeting: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    marginBottom: spacing.xl,
  },
  // Main Action Card
  mainCard: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.lg,
    marginBottom: spacing.xl,
  },
  mainCardGradient: {
    padding: spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  focusLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
  },
  stepIndicator: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  actionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    marginBottom: spacing.sm,
    lineHeight: 32,
  },
  actionDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  durationBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  durationText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  categoryText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  startButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  startButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  startButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.parchmentWhite,
  },
  // Progress Section
  progressSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  progressLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginBottom: spacing.md,
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray200,
  },
  progressDotCompleted: {
    backgroundColor: colors.vibrantTeal,
  },
  progressDotCurrent: {
    backgroundColor: colors.boldTerracotta,
  },
  progressText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  // Up Next Card
  upNextCard: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  upNextLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  upNextTitle: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  upNextDuration: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  // Dream Context
  dreamContext: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  dreamLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginBottom: spacing.xs,
  },
  dreamText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyAction: {
    marginTop: spacing['2xl'],
    width: '100%',
  },
  createButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  createButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.parchmentWhite,
  },
  // Celebrate State
  celebrateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  celebrateIcon: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  celebrateTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.parchmentWhite,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  celebrateSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.lg,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
  },
  celebrateAction: {
    marginTop: spacing['2xl'],
  },
  secondaryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.boldTerracotta,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.boldTerracotta,
  },
});
