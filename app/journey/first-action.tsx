import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTextGeneration } from '@fastshot/ai';
import { ConfettiAnimation } from '@/components/ConfettiAnimation';
import { FirstWinCelebration } from '@/components/FirstWinCelebration';
import { useFirstWinPaywall } from '@/hooks/useFirstWinPaywall';
import {
  colors,
  typography,
  borderRadius,
  spacing,
  shadows,
} from '@/constants/theme';

interface MicroAction {
  id: string;
  title: string;
  description: string;
  duration: string;
  emoji: string;
  category: string;
}

const FIRST_ACTION_KEY = '@boldmove_first_action';

export default function FirstActionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { generateText, isLoading } = useTextGeneration();
  const {
    onActionCompleted,
    showCelebration,
    celebrationMessage,
    shouldTriggerFirstWinPaywall,
    triggerPaywallAfterCelebration,
    dismissCelebration,
  } = useFirstWinPaywall();

  const [microAction, setMicroAction] = useState<MicroAction | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Animation values
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    if (microAction) {
      cardScale.value = withSpring(1, { damping: 12 });
      cardOpacity.value = withTiming(1, { duration: 500 });
    }
  }, [microAction]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  // Generate personalized micro-action
  useEffect(() => {
    const generateMicroAction = async () => {
      try {
        const [storedDream, storedStuckPoint, storedMotivation] = await Promise.all([
          AsyncStorage.getItem('@boldmove_dream'),
          AsyncStorage.getItem('@boldmove_stuck_point'),
          AsyncStorage.getItem('@boldmove_core_motivation'),
        ]);

        const dreamText = storedDream || '';
        const stuckPointData = storedStuckPoint ? JSON.parse(storedStuckPoint) : null;
        const motivationText = storedMotivation || '';

        const prompt = `Generate ONE simple, achievable micro-action for someone starting their journey.

Their dream: "${dreamText}"
Their focus area: "${stuckPointData?.title || 'personal growth'}"
Their core motivation: "${motivationText}"

Requirements:
1. Must be completable in 5 minutes or less
2. Must be something they can do RIGHT NOW (no prep needed)
3. Should feel like a small but meaningful first step
4. Should NOT require any purchases, downloads, or special equipment

Format your response EXACTLY like this:
TITLE: [A short, action-oriented title, 5-7 words max]
DESCRIPTION: [One sentence explaining what to do and why it matters]
DURATION: [Time estimate like "2 min" or "5 min"]
EMOJI: [One relevant emoji]
CATEGORY: [One of: mindset, action, connection, reflection]

Examples of good micro-actions:
- Write down 3 things you're grateful for about this dream
- Send a message to someone who inspires you
- Spend 2 minutes visualizing your first small success
- Write one sentence about why you deserve this`;

        const response = await generateText(prompt);

        if (response) {
          const titleMatch = response.match(/TITLE:\s*(.+)/i);
          const descriptionMatch = response.match(/DESCRIPTION:\s*(.+)/i);
          const durationMatch = response.match(/DURATION:\s*(.+)/i);
          const emojiMatch = response.match(/EMOJI:\s*(.+)/i);
          const categoryMatch = response.match(/CATEGORY:\s*(.+)/i);

          const action: MicroAction = {
            id: Date.now().toString(),
            title: titleMatch ? titleMatch[1].trim() : 'Take Your First Bold Step',
            description: descriptionMatch
              ? descriptionMatch[1].trim()
              : 'Write down one reason why you deserve to achieve your dream.',
            duration: durationMatch ? durationMatch[1].trim() : '2 min',
            emoji: emojiMatch ? emojiMatch[1].trim() : '✨',
            category: categoryMatch ? categoryMatch[1].trim().toLowerCase() : 'mindset',
          };

          setMicroAction(action);
          await AsyncStorage.setItem(FIRST_ACTION_KEY, JSON.stringify(action));
        }
      } catch (error) {
        console.error('Failed to generate micro-action:', error);
        // Fallback action
        setMicroAction({
          id: 'fallback',
          title: 'Write Your Bold Declaration',
          description:
            'Open your notes app and write one sentence: "I am ready to pursue [your dream] because I deserve it."',
          duration: '2 min',
          emoji: '✍️',
          category: 'mindset',
        });
      }
    };

    generateMicroAction();
  }, []);

  const handleAccept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAccepted(true);
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate check
    checkScale.value = withSequence(
      withSpring(1.3, { damping: 8 }),
      withSpring(1, { damping: 10 })
    );

    setIsCompleted(true);
    setShowConfetti(true);

    // Track completion
    await onActionCompleted(true);
  };

  const handleCelebrationContinue = () => {
    if (shouldTriggerFirstWinPaywall()) {
      triggerPaywallAfterCelebration(1500);
    } else {
      dismissCelebration();
      // Navigate to main app
      router.replace('/(tabs)');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mindset':
        return colors.vibrantTeal;
      case 'action':
        return colors.boldTerracotta;
      case 'connection':
        return colors.champagneGold;
      case 'reflection':
        return colors.midnightNavy;
      default:
        return colors.vibrantTeal;
    }
  };

  if (isLoading || !microAction) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.boldTerracotta} />
          <Text style={styles.loadingTitle}>Creating Your First Bold Step...</Text>
          <Text style={styles.loadingSubtitle}>
            Personalized just for your journey
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {showConfetti && <ConfettiAnimation active={true} count={60} />}

      <FirstWinCelebration
        visible={showCelebration}
        isFirstWin={true}
        message={celebrationMessage}
        onContinue={handleCelebrationContinue}
        onUpgrade={() => {
          dismissCelebration();
          router.push('/paywall');
        }}
        showUpgradeOption={shouldTriggerFirstWinPaywall()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <Text style={styles.headerEmoji}>🎯</Text>
          <Text style={styles.headerTitle}>Your First Bold Step</Text>
          <Text style={styles.headerSubtitle}>
            Small action, big momentum
          </Text>
        </Animated.View>

        {/* Action Card */}
        <Animated.View style={[styles.actionCard, cardStyle]}>
          <LinearGradient
            colors={[colors.white, colors.warmCream]}
            style={styles.actionCardGradient}
          >
            {/* Category badge */}
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: getCategoryColor(microAction.category) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: getCategoryColor(microAction.category) },
                ]}
              >
                {microAction.category.toUpperCase()}
              </Text>
            </View>

            {/* Emoji */}
            <View style={styles.emojiContainer}>
              <Text style={styles.actionEmoji}>{microAction.emoji}</Text>
            </View>

            {/* Title & Description */}
            <Text style={styles.actionTitle}>{microAction.title}</Text>
            <Text style={styles.actionDescription}>{microAction.description}</Text>

            {/* Duration */}
            <View style={styles.durationContainer}>
              <Text style={styles.durationIcon}>⏱️</Text>
              <Text style={styles.durationText}>{microAction.duration}</Text>
            </View>

            {/* Completion check */}
            {isCompleted && (
              <Animated.View style={[styles.completedBadge, checkStyle]}>
                <LinearGradient
                  colors={[colors.vibrantTeal, colors.tealDark]}
                  style={styles.completedGradient}
                >
                  <Text style={styles.completedCheck}>✓</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Why this matters */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.whyContainer}>
          <Text style={styles.whyTitle}>Why this matters:</Text>
          <Text style={styles.whyText}>
            Every bold journey begins with a single step. This micro-action builds the
            neural pathways for bigger action. Complete it, and you&apos;ve already proven
            you can take action toward your dream.
          </Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          entering={FadeInUp.delay(500)}
          style={styles.actionsContainer}
        >
          {!isAccepted ? (
            <>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAccept}
              >
                <LinearGradient
                  colors={[colors.boldTerracotta, colors.terracottaDark]}
                  style={styles.acceptGradient}
                >
                  <Text style={styles.acceptText}>I Accept This Challenge</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton}>
                <Text style={styles.skipText}>Give me a different action</Text>
              </TouchableOpacity>
            </>
          ) : !isCompleted ? (
            <Animated.View entering={SlideInRight}>
              <View style={styles.inProgressContainer}>
              <Text style={styles.inProgressText}>
                Take a moment to complete this action...
              </Text>
              <Text style={styles.inProgressHint}>
                When you&apos;re done, tap the button below
              </Text>
              </View>

              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleComplete}
              >
                <LinearGradient
                  colors={[colors.vibrantTeal, colors.tealDark]}
                  style={styles.completeGradient}
                >
                  <Text style={styles.completeText}>✓ I Did It!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn} style={styles.completedContainer}>
              <Text style={styles.completedMessage}>
                🎉 Amazing! You just took your first bold step!
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Motivational footer */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.footer}>
          <Text style={styles.footerQuote}>
            &quot;The journey of a thousand miles begins with a single step.&quot;
          </Text>
          <Text style={styles.footerAuthor}>— Lao Tzu</Text>
        </Animated.View>
      </ScrollView>
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
    backgroundColor: colors.parchmentWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginTop: spacing.sm,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  actionCard: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing['2xl'],
    ...shadows.lg,
  },
  actionCardGradient: {
    padding: spacing['2xl'],
    alignItems: 'center',
    position: 'relative',
  },
  categoryBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    letterSpacing: 1,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.parchmentWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  actionEmoji: {
    fontSize: 40,
  },
  actionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  actionDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.parchmentWhite,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  durationIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  durationText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
  },
  completedBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    ...shadows.md,
  },
  completedGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheck: {
    fontSize: 28,
    color: colors.white,
  },
  whyContainer: {
    backgroundColor: colors.warmCream,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
    borderLeftWidth: 4,
    borderLeftColor: colors.champagneGold,
  },
  whyTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
    marginBottom: spacing.sm,
  },
  whyText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    lineHeight: 22,
  },
  actionsContainer: {
    marginBottom: spacing.xl,
  },
  acceptButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  acceptGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  acceptText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textDecorationLine: 'underline',
  },
  inProgressContainer: {
    backgroundColor: colors.vibrantTeal + '15',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  inProgressText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.vibrantTeal,
    textAlign: 'center',
  },
  inProgressHint: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  completeButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  completeGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  completeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.white,
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  completedMessage: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.vibrantTeal,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  footerQuote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footerAuthor: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    marginTop: spacing.xs,
  },
});
