import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ActionCard } from '@/components/ActionCard';
import { ConfettiAnimation } from '@/components/ConfettiAnimation';
import { useUser, useActions, useDreamProgress, useProofs } from '@/hooks/useStorage';
import { useSubscription } from '@/hooks/useSubscription';
import { useMicroActions } from '@/hooks/useAI';
import { MicroAction } from '@/types';

export default function ActionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user } = useUser();
  const { actions, addAction, completeAction, getTodayActions, loading: actionsLoading } = useActions();
  const { progress, incrementCompletedActions } = useDreamProgress();
  const { addProof } = useProofs();
  const { isPremium, canAccessPremiumActions } = useSubscription();
  const { actions: aiActions, isLoading: aiLoading, generateActions } = useMicroActions();

  const [showConfetti, setShowConfetti] = useState(false);
  const [todayActions, setTodayActions] = useState<MicroAction[]>([]);

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
                {action.isPremium && !isPremium ? (
                  <TouchableOpacity
                    onPress={() => router.push('/paywall')}
                    activeOpacity={0.9}
                  >
                    <Card variant="premium" style={styles.lockedCard}>
                      <View style={styles.lockedHeader}>
                        <Badge label="Premium Task" variant="premium" />
                        <Text style={styles.lockIcon}>🔒</Text>
                      </View>
                      <Text style={styles.lockedTitle}>{action.title}</Text>
                      <Text style={styles.lockedDescription}>
                        Upgrade to unlock premium micro-actions
                      </Text>
                    </Card>
                  </TouchableOpacity>
                ) : (
                  <ActionCard
                    action={action}
                    onComplete={handleCompleteAction}
                    onPress={() => action.isCompleted && handleAddProof(action)}
                  />
                )}
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
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.lg,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.lg,
    paddingBottom: 160,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.lg,
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
  lockedCard: {
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  lockedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lockIcon: {
    fontSize: 20,
  },
  lockedTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
  },
  lockedDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  generateMore: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  generateButton: {
    minWidth: 200,
  },
  summaryCard: {
    marginTop: spacing.xl,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryEmoji: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
  },
  summarySubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  proofButton: {
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    ...shadows.lg,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: '300',
    marginTop: -2,
  },
});
