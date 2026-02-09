import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { useBoostStore } from '@/hooks/useBoostStore';
import { useGroq } from '@/hooks/useGroq';
import { BOOST_CATALOG, getBoostTypeLabel, BoostProduct, BoostContent } from '@/types/boosts';
import { ConfettiAnimation } from '@/components/ConfettiAnimation';

export default function BoostDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { boostId } = useLocalSearchParams<{ boostId: string }>();
  const { isPremium, isBoostPurchased, purchaseBoost } = useBoostStore();
  const { generateText, isLoading: isGenerating } = useGroq();

  const [boost, setBoost] = useState<BoostProduct | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const buttonScale = useSharedValue(1);

  useEffect(() => {
    const foundBoost = BOOST_CATALOG.find((b) => b.id === boostId);
    if (foundBoost) {
      setBoost({
        ...foundBoost,
        isPurchased: isBoostPurchased(foundBoost.id),
      });
    }
  }, [boostId, isBoostPurchased]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const displayPrice = boost
    ? isPremium
      ? boost.premiumPrice
      : boost.basePrice
    : 0;
  const savings = boost
    ? Math.round((1 - boost.premiumPrice / boost.basePrice) * 100)
    : 0;

  const handlePurchase = async () => {
    if (!boost) return;

    setIsPurchasing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Generate content using AI
      const prompt = `Generate comprehensive content for a "${boost.title}" guide about "${boost.subtitle}".

This is a ${getBoostTypeLabel(boost.type)} for ${boost.category}.
Description: ${boost.description}

Generate the content in this EXACT JSON format:
{
  "title": "${boost.title}",
  "introduction": "A compelling 2-3 sentence introduction about why this guide matters and what they'll learn.",
  "sections": [
    {
      "id": "section1",
      "title": "Section Title",
      "icon": "🎯",
      "content": "Main section content (2-3 paragraphs)",
      "subsections": [
        {"title": "Subsection 1", "content": "Detailed content"},
        {"title": "Subsection 2", "content": "Detailed content"}
      ]
    },
    {
      "id": "section2",
      "title": "Another Section",
      "icon": "✨",
      "content": "Section content",
      "subsections": []
    }
  ],
  "conclusion": "An inspiring conclusion (1-2 sentences)",
  "quickTips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"],
  "actionItems": [
    {"id": "action1", "title": "First Step", "description": "What to do first", "isCompleted": false},
    {"id": "action2", "title": "Second Step", "description": "What to do next", "isCompleted": false}
  ]
}

Include 4-6 detailed sections. Make it practical, actionable, and inspiring. Use appropriate emojis for section icons.`;

      const response = await generateText(prompt);

      let content: BoostContent;
      try {
        // Extract JSON from the response
        const jsonMatch = response?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch {
        // Fallback content if parsing fails
        content = {
          title: boost.title,
          introduction: `Welcome to your ${boost.title} journey! This guide will help you achieve your goals with practical, actionable steps.`,
          sections: [
            {
              id: 'getting-started',
              title: 'Getting Started',
              icon: '🚀',
              content: `Let's begin your journey with ${boost.subtitle}. This section covers the foundational steps you need to take.`,
            },
            {
              id: 'key-strategies',
              title: 'Key Strategies',
              icon: '💡',
              content: 'Here are the core strategies that will help you succeed on this path.',
            },
            {
              id: 'next-steps',
              title: 'Your Next Steps',
              icon: '🎯',
              content: 'Now that you understand the basics, here are your immediate action items.',
            },
          ],
          conclusion: 'You have everything you need to succeed. Start taking action today!',
          quickTips: [
            'Start small and build momentum',
            'Track your progress daily',
            'Celebrate small wins',
            'Stay consistent',
            'Ask for support when needed',
          ],
          actionItems: [
            {
              id: 'step1',
              title: 'Review This Guide',
              description: 'Read through all sections at least once',
              isCompleted: false,
            },
            {
              id: 'step2',
              title: 'Take Your First Action',
              description: 'Complete one item from the guide today',
              isCompleted: false,
            },
          ],
        };
      }

      // Save the purchase
      await purchaseBoost(boost.id, content);

      // Success animation
      buttonScale.value = withSequence(
        withSpring(1.1, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );

      setShowConfetti(true);
      setPurchaseSuccess(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Update local state
      setBoost({ ...boost, isPurchased: true });
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Purchase Failed', 'There was an error processing your purchase. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleViewInLibrary = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/library-reader',
      params: { boostId: boost?.id },
    });
  };

  if (!boost) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.champagneGold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      {showConfetti && <ConfettiAnimation active count={80} />}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.typeBadgeContainer}>
          <LinearGradient
            colors={[colors.champagneGold, colors.goldDark]}
            style={styles.typeBadge}
          >
            <Text style={styles.typeText}>{getBoostTypeLabel(boost.type)}</Text>
          </LinearGradient>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section */}
        <Animated.View entering={FadeInDown} style={styles.heroSection}>
          <Text style={styles.heroIcon}>{boost.icon}</Text>
          <Text style={styles.heroTitle}>{boost.title}</Text>
          <Text style={styles.heroSubtitle}>{boost.subtitle}</Text>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>{boost.description}</Text>

          {/* Meta info */}
          <View style={styles.metaRow}>
            {boost.estimatedReadTime && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>⏱️</Text>
                <Text style={styles.metaText}>{boost.estimatedReadTime}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📖</Text>
              <Text style={styles.metaText}>Digital Guide</Text>
            </View>
          </View>
        </Animated.View>

        {/* Tags */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.tagsSection}>
          <Text style={styles.sectionLabel}>Topics Covered</Text>
          <View style={styles.tagsContainer}>
            {boost.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* What's included */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.includedSection}>
          <Text style={styles.sectionLabel}>What&apos;s Included</Text>
          <View style={styles.includedList}>
            {[
              { icon: '📚', text: 'Comprehensive guide with actionable steps' },
              { icon: '✅', text: 'Personalized action items to track' },
              { icon: '💡', text: 'Quick tips for immediate results' },
              { icon: '🎯', text: 'AI-personalized content for your journey' },
              { icon: '♾️', text: 'Lifetime access in your Library' },
            ].map((item, index) => (
              <View key={index} style={styles.includedItem}>
                <Text style={styles.includedIcon}>{item.icon}</Text>
                <Text style={styles.includedText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Purchase success message */}
        {purchaseSuccess && (
          <Animated.View entering={FadeIn} style={styles.successCard}>
            <LinearGradient
              colors={[colors.vibrantTeal + '20', colors.tealLight + '10']}
              style={styles.successGradient}
            >
              <Text style={styles.successIcon}>🎉</Text>
              <Text style={styles.successTitle}>Purchase Complete!</Text>
              <Text style={styles.successText}>
                Your {boost.title} has been added to your Library. Enjoy your new guide!
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Bottom padding for button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Purchase button */}
      <View style={[styles.purchaseContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {boost.isPurchased ? (
          <TouchableOpacity style={styles.viewButton} onPress={handleViewInLibrary}>
            <LinearGradient
              colors={[colors.vibrantTeal, colors.tealDark]}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>📚 View in Library</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <>
            {/* Price display */}
            <View style={styles.priceSection}>
              {isPremium && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{savings}% Bold Adventurer</Text>
                </View>
              )}
              <View style={styles.priceRow}>
                {isPremium && (
                  <Text style={styles.originalPrice}>${boost.basePrice.toFixed(2)}</Text>
                )}
                <Text style={styles.currentPrice}>${displayPrice.toFixed(2)}</Text>
              </View>
            </View>

            <Animated.View style={buttonStyle}>
              <TouchableOpacity
                style={styles.purchaseButton}
                onPress={handlePurchase}
                disabled={isPurchasing || isGenerating}
              >
                <LinearGradient
                  colors={[colors.champagneGold, colors.goldDark]}
                  style={styles.buttonGradient}
                >
                  {isPurchasing || isGenerating ? (
                    <View style={styles.loadingButton}>
                      <ActivityIndicator size="small" color={colors.white} />
                      <Text style={styles.buttonText}>
                        {isGenerating ? 'Creating your guide...' : 'Processing...'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>✨ Purchase Boost</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.parchmentWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  backIcon: {
    fontSize: 20,
    color: colors.midnightNavy,
  },
  typeBadgeContainer: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  typeBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  typeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  heroIcon: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.lg,
    color: colors.gray500,
    textAlign: 'center',
  },
  descriptionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  descriptionText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaIcon: {
    fontSize: 16,
  },
  metaText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  tagsSection: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.champagneGold + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.champagneGold + '40',
  },
  tagText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.goldDark,
  },
  includedSection: {
    marginBottom: spacing.xl,
  },
  includedList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    ...shadows.sm,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray100,
  },
  includedIcon: {
    fontSize: 20,
    marginRight: spacing.md,
    width: 30,
  },
  includedText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    flex: 1,
  },
  successCard: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.vibrantTeal + '40',
  },
  successGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.tealDark,
    marginBottom: spacing.sm,
  },
  successText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
  },
  purchaseContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.parchmentWhite,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    ...shadows.lg,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  discountBadge: {
    backgroundColor: colors.champagneGold + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  discountText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.goldDark,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  originalPrice: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.lg,
    color: colors.gray400,
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
  },
  purchaseButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.glow,
  },
  viewButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  buttonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  buttonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.white,
  },
});
