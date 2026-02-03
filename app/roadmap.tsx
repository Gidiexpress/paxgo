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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, shadows, borderRadius } from '@/constants/theme';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useUser, useProofs } from '@/hooks/useStorage';
import { RoadmapAction } from '@/types/database';
import { useSubscription } from '@/hooks/useSubscription';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { RoadmapActionCard } from '@/components/roadmap/RoadmapActionCard';
import { FocusModeModal } from '@/components/roadmap/FocusModeModal';
import { GoldConfetti, CelebrationOverlay } from '@/components/roadmap/GoldConfetti';
import { FullTimeline } from '@/components/roadmap/GoldenPathTimeline';
import { Button } from '@/components/ui/Button';
import { WeavingAnimation } from '@/components/roadmap/WeavingAnimation';

export default function RoadmapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ dream?: string; rootMotivation?: string }>();

  const { user } = useUser();
  const { hasProofForAction } = useProofs();
  const { showSuccess, showInfo, showError } = useSnackbar();
  const { isPremium } = useSubscription();
  const {
    activeRoadmap,
    loading,
    error,
    activeProgress,
    completedCount,
    totalCount,
    createRoadmap,
    completeAction,
    refineAction,
    breakDownActionIntoSteps,
    fetchRoadmaps,
  } = useRoadmap();

  const [selectedAction, setSelectedAction] = useState<RoadmapAction | null>(null);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Progress line animation
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(activeProgress * 100, {
      duration: 800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [activeProgress]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRoadmaps();
    setRefreshing(false);
  }, [fetchRoadmaps]);

  const handleActionPress = (action: RoadmapAction) => {
    setSelectedAction(action);
    setShowFocusMode(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleComplete = async (actionId: string) => {
    const success = await completeAction(actionId);

    if (success) {
      // Determine celebration message
      const newCompletedCount = completedCount + 1;
      const action = activeRoadmap?.actions.find((a) => a.id === actionId);

      let celebrationMsg = 'Keep going!';
      if (newCompletedCount === totalCount) {
        celebrationMsg = 'Roadmap Complete!';
      } else if (newCompletedCount === 1) {
        celebrationMsg = 'First step taken!';
      }

      setCelebrationMessage(celebrationMsg);
      setShowCelebration(true);

      // Show top snackbar with personalized encouragement
      const encouragements = [
        `Beautiful work! ${action?.title} complete ✨`,
        `You're on fire! ${newCompletedCount} down, ${totalCount - newCompletedCount} to go 🔥`,
        `That's the spirit! Momentum is building 💫`,
        `One step closer to your dream! Keep shining ✨`,
      ];

      const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
      showSuccess(randomEncouragement, {
        duration: 3500,
        icon: '🎉',
      });

      // Trigger paywall after 2nd or 3rd action if not premium
      if (!isPremium && (newCompletedCount === 2 || newCompletedCount === 3)) {
        setTimeout(() => {
          router.push('/paywall');
        }, 2000); // Show paywall after celebration
      }

      // Close focus mode after brief delay
      setTimeout(() => {
        setShowFocusMode(false);
        setSelectedAction(null);
      }, 500);
    }
  };

  const handleRefine = async (actionId: string, feedback?: string) => {
    setIsRefining(true);
    await refineAction(actionId, feedback);
    setIsRefining(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess('Action refined! Made it feel just right ✨', {
      duration: 3000,
    });
  };

  const handleBreakDown = async (actionId: string) => {
    setIsBreakingDown(true);
    showInfo('Breaking it down into smaller steps...', {
      duration: 2000,
      icon: '🔻',
    });

    const result = await breakDownActionIntoSteps(actionId);
    setIsBreakingDown(false);

    if (result && result.length > 0) {
      showSuccess(`Split into ${result.length} gentler steps! You've got this 💪`, {
        duration: 3500,
        icon: '✨',
      });
      setShowFocusMode(false);
      setSelectedAction(null);
    } else {
      showError('Unable to break down this action. Please try again.');
    }
  };

  const handleCaptureProof = (actionId: string) => {
    setShowFocusMode(false);
    router.push({
      pathname: '/add-proof',
      params: { actionId, actionTitle: selectedAction?.title },
    });
  };

  const handleGenerateNew = async () => {
    const dream = user?.dream || params.dream;
    if (dream) {
      // Navigate to generation screen - it will handle the loading animation and generation
      router.push({
        pathname: '/generate-roadmap',
        params: {
          dream,
          rootMotivation: params.rootMotivation || user?.dream || '',
        },
      });
    } else {
      router.push('/new-dream');
    }
  };

  // Get completed indices for timeline
  const completedIndices = activeRoadmap?.actions
    .map((a, i) => (a.is_completed ? i : -1))
    .filter((i) => i !== -1) || [];

  const activeIndex = activeRoadmap?.actions.findIndex((a) => !a.is_completed) ?? 0;

  // Loading state - Fetching roadmaps
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <WeavingAnimation
          message="Loading your journey..."
          submessage="Fetching your roadmap"
        />
      </View>
    );
  }

  // Empty state - no roadmap yet
  if (!activeRoadmap) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={[colors.parchmentWhite, colors.warmCream]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.emptyContent, { paddingTop: insets.top + spacing['3xl'] }]}>
          <Animated.View entering={FadeInDown}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>Your Golden Path Awaits</Text>
            <Text style={styles.emptySubtitle}>
              Transform your dream into an elegant sequence of achievable micro-actions
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyAction}>
            <Button
              title="Create My Roadmap"
              onPress={handleGenerateNew}
              variant="primary"
              gradient
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={[colors.midnightNavy, colors.navyLight]}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Animated.View entering={FadeIn}>
          <Text style={styles.headerSubtitle}>Your Golden Path</Text>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {activeRoadmap.roadmap_title}
          </Text>
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressAnimatedStyle]}>
              <LinearGradient
                colors={[colors.goldLight, colors.champagneGold]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          <Text style={styles.progressText}>
            {completedCount} of {totalCount} completed
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.boldTerracotta}
          />
        }
      >
        {/* Dream context */}
        {activeRoadmap.dream && (
          <Animated.View entering={FadeInDown.delay(100)} style={styles.dreamCard}>
            <LinearGradient
              colors={[colors.warmCream, colors.parchmentWhite]}
              style={styles.dreamGradient}
            >
              <Text style={styles.dreamLabel}>Your Dream</Text>
              <Text style={styles.dreamText}>{activeRoadmap.dream}</Text>
              {activeRoadmap.root_motivation && (
                <>
                  <View style={styles.motivationDivider} />
                  <Text style={styles.motivationLabel}>Root Motivation</Text>
                  <Text style={styles.motivationText}>
                    &quot;{activeRoadmap.root_motivation}&quot;
                  </Text>
                </>
              )}
            </LinearGradient>
          </Animated.View>
        )}

        {/* Timeline with actions */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <Text style={styles.sectionTitle}>Your Micro-Actions</Text>
            <TouchableOpacity onPress={handleGenerateNew}>
              <Text style={styles.regenerateText}>✨ New Path</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineContainer}>
            {/* Vertical timeline */}
            <FullTimeline
              completedIndices={completedIndices}
              activeIndex={activeIndex}
              totalNodes={totalCount}
              nodeSpacing={160}
            />

            {/* Action cards */}
            <View style={styles.cardsContainer}>
              {activeRoadmap.actions.map((action, index) => {
                // Check if card should be locked (previous action not completed)
                const previousAction = index > 0 ? activeRoadmap.actions[index - 1] : null;
                const isLocked = previousAction ? !previousAction.is_completed : false;

                return (
                  <RoadmapActionCard
                    key={action.id}
                    action={action}
                    index={index}
                    onComplete={handleComplete}
                    onPress={handleActionPress}
                    animationDelay={100 + index * 80}
                    hasProof={hasProofForAction(action.id)}
                    isLocked={isLocked}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* Completion state */}
        {completedCount === totalCount && totalCount > 0 && (
          <Animated.View entering={FadeInUp.delay(300)} style={styles.completionCard}>
            <LinearGradient
              colors={[colors.goldLight + '30', colors.champagneGold + '20']}
              style={styles.completionGradient}
            >
              <Text style={styles.completionEmoji}>🏆</Text>
              <Text style={styles.completionTitle}>Roadmap Complete!</Text>
              <Text style={styles.completionText}>
                You&apos;ve taken bold steps toward your dream. Ready for more?
              </Text>
              <Button
                title="Generate New Roadmap"
                onPress={handleGenerateNew}
                variant="gold"
                gradient
                style={styles.newRoadmapButton}
              />
            </LinearGradient>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Focus Mode Modal */}
      <FocusModeModal
        visible={showFocusMode}
        action={selectedAction}
        onClose={() => {
          setShowFocusMode(false);
          setSelectedAction(null);
        }}
        onComplete={handleComplete}
        onRefine={handleRefine}
        onBreakDown={handleBreakDown}
        onCaptureProof={handleCaptureProof}
        isRefining={isRefining}
        isBreakingDown={isBreakingDown}
        hasProof={selectedAction ? hasProofForAction(selectedAction.id) : false}
      />

      {/* Gold Confetti Celebration */}
      <CelebrationOverlay
        visible={showCelebration}
        message={celebrationMessage}
        submessage="One step closer to your dream"
        onComplete={() => setShowCelebration(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: spacing.xl,
  },
  loadingEmoji: {
    fontSize: 48,
  },
  loadingText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.white,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing['2xl'],
  },
  emptyAction: {
    width: '100%',
    maxWidth: 300,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  backIcon: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '300',
    marginTop: -2,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.white,
    lineHeight: 40,
    marginBottom: spacing.lg,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  dreamCard: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing['2xl'],
    ...shadows.md,
  },
  dreamGradient: {
    padding: spacing.xl,
  },
  dreamLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.boldTerracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  dreamText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    lineHeight: 26,
  },
  motivationDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.lg,
  },
  motivationLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.champagneGold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  motivationText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  timelineSection: {
    marginTop: spacing.md,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
  },
  regenerateText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
  },
  timelineContainer: {
    flexDirection: 'row',
  },
  cardsContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  completionCard: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginTop: spacing.xl,
    ...shadows.lg,
  },
  completionGradient: {
    padding: spacing['2xl'],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.champagneGold + '40',
    borderRadius: borderRadius['2xl'],
  },
  completionEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  completionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    marginBottom: spacing.sm,
  },
  completionText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  newRoadmapButton: {
    minWidth: 200,
  },
});
