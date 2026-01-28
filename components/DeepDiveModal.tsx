import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTextGeneration } from '@fastshot/ai';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Button } from './ui/Button';
import { MicroAction, TinyStep } from '@/types';
import { useDeepDive } from '@/hooks/useStorage';

const { width, height } = Dimensions.get('window');

interface DeepDiveModalProps {
  visible: boolean;
  action: MicroAction | null;
  onClose: () => void;
  onComplete: () => void;
}

// Component for individual tiny step card
interface TinyStepCardProps {
  step: TinyStep;
  isActive: boolean;
  onComplete: () => void;
  index: number;
}

function TinyStepCard({ step, isActive, onComplete, index }: TinyStepCardProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Animated glow pulse
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      // Button pulse hint
      pulseOpacity.value = withDelay(
        2000,
        withRepeat(
          withSequence(
            withTiming(0.3, { duration: 800 }),
            withTiming(0, { duration: 800 })
          ),
          3,
          true
        )
      );
    }
  }, [isActive]);

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);

    // Strong success haptic
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Celebratory animation sequence
    scale.value = withSequence(
      withSpring(0.98, { damping: 15 }),
      withSpring(1.03, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12 })
    );

    // Progress fill animation
    progressWidth.value = withTiming(100, {
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // Add secondary haptic for extra satisfaction
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 200);

    // Delay for celebration feel
    setTimeout(() => {
      onComplete();
      setIsCompleting(false);
    }, 500);
  };

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.96, { damping: 15 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 10 });
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: interpolate(pulseOpacity.value, [0, 0.3], [1, 1.1]) }],
  }));

  if (step.isCompleted) {
    return (
      <Animated.View
        entering={FadeIn.delay(index * 80)}
        style={styles.completedStepCard}
      >
        <Animated.View
          entering={ZoomIn.springify().damping(12)}
          style={styles.completedCheckCircle}
        >
          <Text style={styles.completedCheck}>✓</Text>
        </Animated.View>
        <Text style={styles.completedStepTitle}>{step.title}</Text>
      </Animated.View>
    );
  }

  if (!isActive) {
    return null; // Progressive disclosure - only show active step
  }

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15).delay(100)}
      style={[cardStyle]}
    >
      <View style={styles.activeStepContainer}>
        {/* Animated glow effect */}
        <Animated.View style={[styles.stepGlow, glowStyle]} />

        <View style={styles.activeStepCard}>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>

          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepHint}>Current Step</Text>
          </View>

          <Text style={styles.activeStepTitle}>{step.title}</Text>

          {step.description && (
            <Text style={styles.activeStepDescription}>{step.description}</Text>
          )}

          <Pressable
            onPress={handleComplete}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            disabled={isCompleting}
            style={styles.completeStepButton}
          >
            {/* Pulse hint */}
            <Animated.View style={[styles.buttonPulse, pulseStyle]} />

            <Animated.View style={[styles.buttonInner, buttonAnimatedStyle]}>
              <LinearGradient
                colors={[colors.vibrantTeal, colors.tealDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.completeStepGradient}
              >
                <Text style={styles.completeStepText}>
                  {isCompleting ? '✨ Nice!' : 'Done! Next step →'}
                </Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

export function DeepDiveModal({ visible, action, onClose, onComplete }: DeepDiveModalProps) {
  const insets = useSafeAreaInsets();
  const {
    deepDive,
    startDeepDive,
    setTinySteps,
    completeCurrentStep,
    endDeepDive,
  } = useDeepDive();

  const [isGenerating, setIsGenerating] = useState(false);
  const [localSteps, setLocalSteps] = useState<TinyStep[]>([]);

  const { generateText, isLoading: aiLoading } = useTextGeneration({
    onSuccess: async (response) => {
      if (response) {
        const steps = parseTinySteps(response);
        setLocalSteps(steps);
        if (deepDive) {
          await setTinySteps(steps);
        }
        setIsGenerating(false);
      }
    },
    onError: (err) => {
      console.error('Error generating tiny steps:', err);
      setIsGenerating(false);
      // Generate fallback steps
      const fallbackSteps = generateFallbackSteps(action?.title || '');
      setLocalSteps(fallbackSteps);
      if (deepDive) {
        setTinySteps(fallbackSteps);
      }
    },
  });

  // Initialize or restore deep dive when modal opens
  useEffect(() => {
    if (visible && action) {
      initializeDeepDive();
    }
  }, [visible, action?.id]);

  // Sync local steps with stored deep dive
  useEffect(() => {
    if (deepDive?.tinySteps && deepDive.tinySteps.length > 0) {
      setLocalSteps(deepDive.tinySteps);
    }
  }, [deepDive?.tinySteps]);

  const initializeDeepDive = async () => {
    if (!action) return;

    // Check if we have an existing deep dive for this action
    if (deepDive?.actionId === action.id && deepDive.tinySteps.length > 0) {
      setLocalSteps(deepDive.tinySteps);
      return;
    }

    // Start new deep dive
    await startDeepDive(action.id, action.title);
    setIsGenerating(true);

    // Generate tiny steps using AI
    const prompt = `Break down this task into exactly 4-5 tiny, actionable steps that can each be done in under 2 minutes. The task is: "${action.title}".

For each step, provide a brief title (under 10 words) and a one-sentence description.
Format your response exactly like this (include the numbers):
1. [Step title]: [Brief description]
2. [Step title]: [Brief description]
3. [Step title]: [Brief description]
4. [Step title]: [Brief description]

Make the first step extremely easy and quick to build momentum. Each subsequent step should naturally lead to the next. The final step should complete the task.`;

    generateText(prompt);
  };

  const parseTinySteps = (response: string): TinyStep[] => {
    const lines = response.split('\n').filter(line => line.trim());
    const steps: TinyStep[] = [];

    lines.forEach((line, index) => {
      // Match patterns like "1. Title: Description" or "1. Title - Description"
      const match = line.match(/^\d+\.\s*(.+?)(?::|-)?\s*(.*)$/);
      if (match) {
        const [, title, description] = match;
        steps.push({
          id: `step-${Date.now()}-${index}`,
          title: title.trim(),
          description: description.trim() || '',
          isCompleted: false,
          order: index,
        });
      }
    });

    // Ensure we have at least 3 steps
    if (steps.length < 3) {
      return generateFallbackSteps(action?.title || '');
    }

    return steps.slice(0, 5); // Max 5 steps
  };

  const generateFallbackSteps = (actionTitle: string): TinyStep[] => {
    return [
      {
        id: `step-${Date.now()}-0`,
        title: 'Set a 5-minute timer',
        description: 'Creating a time boundary helps you start without pressure.',
        isCompleted: false,
        order: 0,
      },
      {
        id: `step-${Date.now()}-1`,
        title: 'Open what you need',
        description: 'Get your tools, apps, or materials ready.',
        isCompleted: false,
        order: 1,
      },
      {
        id: `step-${Date.now()}-2`,
        title: 'Take the first small action',
        description: `Start the simplest part of "${actionTitle}".`,
        isCompleted: false,
        order: 2,
      },
      {
        id: `step-${Date.now()}-3`,
        title: 'Review what you did',
        description: 'Celebrate your progress, no matter how small!',
        isCompleted: false,
        order: 3,
      },
    ];
  };

  const handleStepComplete = async () => {
    const isAllComplete = await completeCurrentStep();

    if (isAllComplete) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Wait for celebration animation
      setTimeout(() => {
        onComplete();
        endDeepDive();
      }, 1500);
    }
  };

  const handleClose = async () => {
    // Keep progress - don't clear the deep dive
    onClose();
  };

  const completedCount = localSteps.filter(s => s.isCompleted).length;
  const totalSteps = localSteps.length;
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  const isAllComplete = completedCount === totalSteps && totalSteps > 0;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          exiting={SlideOutDown}
          style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          <LinearGradient
            colors={[colors.parchmentWhite, colors.warmCream]}
            style={StyleSheet.absoluteFill}
          />

          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.headerLabel}>Deep Dive</Text>
              <Text style={styles.actionTitle} numberOfLines={2}>
                {action?.title}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.overallProgress}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {completedCount} of {totalSteps} steps
              </Text>
              <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
            </View>
            <View style={styles.overallProgressTrack}>
              <View
                style={[styles.overallProgressFill, { width: `${progressPercent}%` }]}
              />
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            showsVerticalScrollIndicator={false}
          >
            {isGenerating || aiLoading ? (
              <Animated.View entering={FadeIn} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.boldTerracotta} />
                <Text style={styles.loadingText}>Breaking this down into tiny steps...</Text>
                <Text style={styles.loadingSubtext}>Making it easy for you</Text>
              </Animated.View>
            ) : isAllComplete ? (
              <Animated.View entering={FadeIn} style={styles.celebrationContainer}>
                {/* Confetti-like decorations */}
                <View style={styles.confettiContainer}>
                  <Animated.Text
                    entering={FadeInUp.delay(100).springify()}
                    style={[styles.confettiEmoji, { left: '10%', top: 20 }]}
                  >
                    ✨
                  </Animated.Text>
                  <Animated.Text
                    entering={FadeInUp.delay(200).springify()}
                    style={[styles.confettiEmoji, { right: '15%', top: 10 }]}
                  >
                    🌟
                  </Animated.Text>
                  <Animated.Text
                    entering={FadeInUp.delay(300).springify()}
                    style={[styles.confettiEmoji, { left: '20%', top: 60 }]}
                  >
                    💫
                  </Animated.Text>
                  <Animated.Text
                    entering={FadeInUp.delay(150).springify()}
                    style={[styles.confettiEmoji, { right: '10%', top: 50 }]}
                  >
                    ⭐
                  </Animated.Text>
                </View>

                <Animated.View entering={ZoomIn.springify().damping(10).delay(200)}>
                  <LinearGradient
                    colors={[`${colors.champagneGold}30`, `${colors.vibrantTeal}20`]}
                    style={styles.celebrationBadge}
                  >
                    <Text style={styles.celebrationEmoji}>🎉</Text>
                  </LinearGradient>
                </Animated.View>

                <Animated.Text
                  entering={FadeInUp.springify().delay(400)}
                  style={styles.celebrationTitle}
                >
                  Amazing Work!
                </Animated.Text>
                <Animated.Text
                  entering={FadeInUp.springify().delay(500)}
                  style={styles.celebrationText}
                >
                  You completed all the tiny steps.{'\n'}Small wins lead to big changes!
                </Animated.Text>

                <Animated.View entering={FadeInUp.delay(700)}>
                  <TouchableOpacity
                    style={styles.celebrationButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onComplete();
                      endDeepDive();
                    }}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={[colors.champagneGold, colors.goldDark]}
                      style={styles.celebrationButtonGradient}
                    >
                      <Text style={styles.celebrationButtonText}>Claim Your Win! 🏆</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            ) : (
              <>
                {/* Completed steps (collapsed) */}
                {localSteps.filter(s => s.isCompleted).map((step, index) => (
                  <TinyStepCard
                    key={step.id}
                    step={step}
                    isActive={false}
                    onComplete={() => {}}
                    index={index}
                  />
                ))}

                {/* Current active step */}
                {localSteps.map((step, index) => {
                  const isActive = index === (deepDive?.currentStepIndex || 0) && !step.isCompleted;
                  return (
                    <TinyStepCard
                      key={step.id}
                      step={step}
                      isActive={isActive}
                      onComplete={handleStepComplete}
                      index={index}
                    />
                  );
                })}

                {/* Upcoming steps hint */}
                {totalSteps > 0 && completedCount < totalSteps - 1 && (
                  <Animated.View entering={FadeIn.delay(300)} style={styles.upcomingHint}>
                    <Text style={styles.upcomingText}>
                      {totalSteps - completedCount - 1} more tiny step{totalSteps - completedCount - 1 !== 1 ? 's' : ''} after this
                    </Text>
                  </Animated.View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          {!isGenerating && !aiLoading && !isAllComplete && (
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleClose} style={styles.pauseButton}>
                <Text style={styles.pauseText}>Pause & Save Progress</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.parchmentWhite,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    minHeight: height * 0.75,
    maxHeight: height * 0.9,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 16,
    color: colors.gray600,
  },
  headerContent: {
    paddingRight: spacing['3xl'],
  },
  headerLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  actionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    lineHeight: 32,
  },
  overallProgress: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  progressPercent: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.vibrantTeal,
  },
  overallProgressTrack: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: colors.vibrantTeal,
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  loadingText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    position: 'relative',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  confettiEmoji: {
    position: 'absolute',
    fontSize: 24,
  },
  celebrationBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 3,
    borderColor: colors.champagneGold,
  },
  celebrationEmoji: {
    fontSize: 48,
  },
  celebrationTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.midnightNavy,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  celebrationText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  celebrationButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  celebrationButtonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['3xl'],
    alignItems: 'center',
  },
  celebrationButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
  },
  // Completed step styles
  completedStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    opacity: 0.7,
  },
  completedCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.vibrantTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  completedCheck: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  completedStepTitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textDecorationLine: 'line-through',
    flex: 1,
  },
  // Active step styles
  activeStepContainer: {
    position: 'relative',
    marginVertical: spacing.lg,
  },
  stepGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: colors.boldTerracotta,
    borderRadius: borderRadius['2xl'],
  },
  activeStepCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
    borderWidth: 2,
    borderColor: colors.boldTerracotta,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.gray200,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.vibrantTeal,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.boldTerracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.white,
  },
  stepHint: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.boldTerracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeStepTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    marginBottom: spacing.sm,
  },
  activeStepDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  completeStepButton: {
    position: 'relative',
    borderRadius: borderRadius.xl,
    overflow: 'visible',
  },
  buttonPulse: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: colors.vibrantTeal,
    borderRadius: borderRadius.xl + 4,
    zIndex: -1,
  },
  buttonInner: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  completeStepGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  completeStepText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  upcomingHint: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  upcomingText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
  },
  pauseButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  pauseText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
  },
});
