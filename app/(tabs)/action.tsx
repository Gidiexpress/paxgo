import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, shadows, borderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ActionCard } from '@/components/ActionCard';
import { DeepDiveModal } from '@/components/DeepDiveModal';
import { ActiveDeepDiveBanner } from '@/components/ActiveDeepDiveBanner';
import { ConfettiAnimation } from '@/components/ConfettiAnimation';
import { useUser, useActions, useDreamProgress, useDeepDive } from '@/hooks/useStorage';
import { useSubscription } from '@/hooks/useSubscription';
import { useMicroActions } from '@/hooks/useAI';
import { MicroAction } from '@/types';

export default function ActionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user } = useUser();
  const { addAction, completeAction, getTodayActions, syncPendingChatActions, refreshActions, loading: actionsLoading } = useActions();
  const { incrementCompletedActions } = useDreamProgress();
  const { deepDive, hasActiveDeepDive } = useDeepDive();
  const { isPremium } = useSubscription();
  const { actions: aiActions, isLoading: aiLoading, generateActions } = useMicroActions();

  const [showConfetti, setShowConfetti] = useState(false);
  const [todayActions, setTodayActions] = useState<MicroAction[]>([]);
  const [deepDiveAction, setDeepDiveAction] = useState<MicroAction | null>(null);
  const [showDeepDiveModal, setShowDeepDiveModal] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);

  // Sync pending chat actions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const syncFromChat = async () => {
        const count = await syncPendingChatActions();
        if (count > 0) {
          setSyncedCount(count);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Refresh to show synced actions
          await refreshActions();
        }
      };
      syncFromChat();
    }, [syncPendingChatActions, refreshActions])
  );

  // Load or generate today's actions
  useEffect(() => {
    const loadActions = async () => {
      const existing = getTodayActions();
      if (existing.length > 0) {
        setTodayActions(existing);
      } else if (user?.dream) {
        // Generate new actions if none exist
        await generateActions(user.dream, user.stuckPoint);
      }
    };
    loadActions();
  }, [user]);

  // Add AI-generated actions to storage
  useEffect(() => {
    const saveAIActions = async () => {
      if (aiActions.length > 0 && todayActions.length === 0) {
        const newActions: MicroAction[] = [];
        for (const aiAction of aiActions) {
          const action = await addAction({
            title: aiAction.title,
            description: aiAction.description,
            duration: aiAction.duration,
            isPremium: aiAction.category === 'connection' || aiAction.category === 'action',
            isCompleted: false,
            category: aiAction.category,
            dreamId: user?.dream || 'default',
          });
          newActions.push(action);
        }
        setTodayActions(newActions);
      }
    };
    saveAIActions();
  }, [aiActions]);

  // Check for active deep dive on mount and auto-open modal
  useEffect(() => {
    if (hasActiveDeepDive && deepDive) {
      const action = todayActions.find(a => a.id === deepDive.actionId);
      if (action && !action.isCompleted) {
        setDeepDiveAction(action);
        // Small delay to let the screen render first
        setTimeout(() => setShowDeepDiveModal(true), 500);
      }
    }
  }, [hasActiveDeepDive, deepDive, todayActions]);

  const handleCompleteAction = async (actionId: string) => {
    await completeAction(actionId);
    await incrementCompletedActions();
    setTodayActions((prev) =>
      prev.map((a) =>
        a.id === actionId ? { ...a, isCompleted: true, completedAt: new Date().toISOString() } : a
      )
    );

    // Show confetti
    setShowConfetti(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddProof = (action: MicroAction) => {
    router.push({
      pathname: '/add-proof',
      params: { actionId: action.id, actionTitle: action.title },
    });
  };

  const handleOpenDeepDive = (action: MicroAction) => {
    setDeepDiveAction(action);
    setShowDeepDiveModal(true);
  };

  const handleDeepDiveComplete = async () => {
    if (deepDiveAction) {
      await handleCompleteAction(deepDiveAction.id);
      setShowDeepDiveModal(false);
      setDeepDiveAction(null);
    }
  };

  const handleCloseDeepDive = () => {
    setShowDeepDiveModal(false);
    // Don't clear the action - progress is saved
  };

  const completedCount = todayActions.filter((a) => a.isCompleted).length;
  const totalCount = todayActions.length;
  const progressPercent = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.midnightNavy, colors.navyLight]}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        <Text style={styles.headerTitle}>Today&apos;s Bold Moves</Text>
        <Text style={styles.headerSubtitle}>
          {completedCount} of {totalCount} completed
        </Text>
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progressPercent}
            height={10}
            backgroundColor="rgba(255,255,255,0.2)"
            fillColor={colors.vibrantTeal}
          />
        </View>
      </LinearGradient>

      {/* Synced from Chat Banner */}
      {syncedCount > 0 && (
        <Animated.View entering={FadeIn} style={styles.syncedBanner}>
          <View style={styles.syncedContent}>
            <Text style={styles.syncedIcon}>✨</Text>
            <Text style={styles.syncedText}>
              {syncedCount} action{syncedCount !== 1 ? 's' : ''} added from your chat
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSyncedCount(0)}
            style={styles.dismissButton}
          >
            <Text style={styles.dismissText}>×</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Active Deep Dive Banner */}
      {hasActiveDeepDive && deepDive && !showDeepDiveModal && (
        <ActiveDeepDiveBanner
          deepDive={deepDive}
          onPress={() => {
            const action = todayActions.find(a => a.id === deepDive.actionId);
            if (action) {
              handleOpenDeepDive(action);
            }
          }}
        />
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Micro-Action Cards</Text>

        {(actionsLoading || aiLoading) && todayActions.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.boldTerracotta} />
            <Text style={styles.loadingText}>Generating your personalized actions...</Text>
          </View>
        ) : (
          <>
            {todayActions.map((action, index) => (
              <Animated.View key={action.id} entering={FadeInDown.delay(index * 100)}>
                <ActionCard
                  action={action}
                  onComplete={handleCompleteAction}
                  onPress={() => {
                    if (action.isCompleted) {
                      handleAddProof(action);
                    } else if (action.isPremium && !isPremium) {
                      router.push('/paywall');
                    }
                  }}
                  onDeepDive={() => handleOpenDeepDive(action)}
                  hasActiveDeepDive={deepDive?.actionId === action.id && hasActiveDeepDive}
                  isLocked={action.isPremium && !isPremium}
                />
              </Animated.View>
            ))}
          </>
        )}

        {/* Generate More Actions */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.generateMore}>
          <Button
            title="Generate New Actions"
            onPress={() => generateActions(user?.dream || 'personal growth', user?.stuckPoint)}
            variant="outline"
            loading={aiLoading}
            style={styles.generateButton}
          />
        </Animated.View>

        {/* Today's Progress Summary */}
        {completedCount > 0 && (
          <Animated.View entering={FadeInDown} style={styles.summaryCard}>
            <Card variant="elevated">
              <View style={styles.summaryContent}>
                <Text style={styles.summaryEmoji}>🎉</Text>
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryTitle}>
                    {completedCount === totalCount ? 'All done!' : 'Making progress!'}
                  </Text>
                  <Text style={styles.summarySubtitle}>
                    You&apos;ve completed {completedCount} action{completedCount !== 1 ? 's' : ''} today
                  </Text>
                </View>
              </View>
              {completedCount > 0 && (
                <Button
                  title="Add to Proof Gallery"
                  onPress={() => router.push('/add-proof')}
                  variant="gold"
                  size="sm"
                  gradient
                  style={styles.proofButton}
                />
              )}
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      {/* Add Action FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 90 }]}
        onPress={() => router.push('/add-action')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.boldTerracotta, colors.terracottaDark]}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Confetti */}
      <ConfettiAnimation
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Deep Dive Modal */}
      <DeepDiveModal
        visible={showDeepDiveModal}
        action={deepDiveAction}
        onClose={handleCloseDeepDive}
        onComplete={handleDeepDiveComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['4xl'],
    color: colors.white,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.xl,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.xl,
    paddingBottom: 180,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.xl,
    letterSpacing: -0.2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    marginTop: spacing.md,
  },
  generateMore: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  generateButton: {
    minWidth: 200,
  },
  summaryCard: {
    marginTop: spacing['2xl'],
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryEmoji: {
    fontSize: 44,
    marginRight: spacing.lg,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    marginBottom: 2,
  },
  summarySubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    lineHeight: 22,
  },
  proofButton: {
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    ...shadows.xl,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: '300',
    marginTop: -1,
  },
  syncedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.champagneGold + '20',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.champagneGold + '40',
  },
  syncedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  syncedIcon: {
    fontSize: 16,
  },
  syncedText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.terracottaDark,
    flex: 1,
  },
  dismissButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 18,
    color: colors.gray500,
    fontWeight: '300',
  },
});
