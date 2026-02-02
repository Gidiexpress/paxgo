import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Category {
  id: string;
  title: string;
  icon: string;
  description: string;
  gradient: readonly [string, string];
}

const CATEGORIES: Category[] = [
  {
    id: 'career',
    title: 'Career Growth',
    icon: '🚀',
    description: 'Level up professionally',
    gradient: [colors.boldTerracotta, colors.terracottaDark] as const,
  },
  {
    id: 'travel',
    title: 'Travel & Adventure',
    icon: '✈️',
    description: 'Explore the world',
    gradient: [colors.vibrantTeal, colors.tealDark] as const,
  },
  {
    id: 'finance',
    title: 'Financial Freedom',
    icon: '💰',
    description: 'Build your wealth',
    gradient: [colors.champagneGold, colors.goldDark] as const,
  },
  {
    id: 'creative',
    title: 'Creative Pursuits',
    icon: '🎨',
    description: 'Express yourself',
    gradient: ['#9B59B6', '#6C3483'] as const,
  },
  {
    id: 'wellness',
    title: 'Wellness & Habits',
    icon: '🧘',
    description: 'Transform your lifestyle',
    gradient: ['#27AE60', '#1E8449'] as const,
  },
];

function CategoryCard({
  category,
  isSelected,
  onSelect,
  index,
}: {
  category: Category;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.cardTouchable}
      >
        {/* Selection border wrapper - always renders but with transparent border when not selected */}
        <View style={[
          styles.cardBorderWrapper,
          isSelected && styles.cardBorderWrapperSelected
        ]}>
          <LinearGradient
            colors={category.gradient}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Selection indicator - champagne gold checkmark */}
            {isSelected && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>✓</Text>
              </View>
            )}

            {/* Card content - always visible */}
            <View style={styles.cardContent}>
              <Text style={styles.cardIcon}>{category.icon}</Text>
              <Text style={styles.cardTitle}>{category.title}</Text>
              <Text style={styles.cardDescription}>{category.description}</Text>
            </View>

            {/* Decorative element */}
            <View style={styles.cardDecoration} />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function StuckPointScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategorySelect = async (categoryId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategory(categoryId);
  };

  const handleContinue = async () => {
    if (!selectedCategory) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Find the full category object
    const category = CATEGORIES.find(cat => cat.id === selectedCategory);

    // Store the full category object as JSON
    if (category) {
      await AsyncStorage.setItem('@boldmove_stuck_point', JSON.stringify(category));
    }

    // Navigate to dream input
    router.push('/journey/dream-input');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn} style={styles.header}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={styles.stepDot} />
            <View style={styles.stepLine} />
            <View style={styles.stepDot} />
          </View>

          <Text style={styles.title}>Where are you feeling stuck?</Text>
          <Text style={styles.subtitle}>
            Select the area where you&apos;d like to make bold moves
          </Text>
        </Animated.View>

        {/* Category Cards */}
        <View style={styles.cardsContainer}>
          {CATEGORIES.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onSelect={() => handleCategorySelect(category.id)}
              index={index}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <Animated.View
        entering={FadeInDown.delay(600)}
        style={[styles.buttonContainer, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedCategory && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedCategory}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={
              selectedCategory
                ? [colors.midnightNavy, '#0A2540']
                : [colors.gray300, colors.gray400]
            }
            style={styles.continueGradient}
          >
            <Text
              style={[
                styles.continueText,
                !selectedCategory && styles.continueTextDisabled,
              ]}
            >
              Continue
            </Text>
            <Text style={styles.continueArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gray300,
  },
  stepDotActive: {
    backgroundColor: colors.boldTerracotta,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: spacing.lg,
  },
  cardTouchable: {
    borderRadius: borderRadius['2xl'],
    ...shadows.lg,
  },
  cardBorderWrapper: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent', // Always have a border, but transparent when not selected
  },
  cardBorderWrapperSelected: {
    borderColor: colors.champagneGold,
  },
  cardGradient: {
    padding: spacing.xl,
    minHeight: 120,
    position: 'relative',
  },
  cardContent: {
    // Ensure content is always visible
    zIndex: 1,
  },
  selectedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.champagneGold,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...shadows.md,
  },
  selectedBadgeText: {
    color: colors.midnightNavy,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  cardDecoration: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.parchmentWhite,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  continueText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.white,
  },
  continueTextDisabled: {
    color: colors.gray500,
  },
  continueArrow: {
    fontSize: 20,
    color: colors.white,
  },
});
