import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { useDreams } from '@/hooks/useDreams';
import { DreamCategory, DREAM_CATEGORIES } from '@/types/dreams';

type Step = 'category' | 'dream' | 'confirmation';

interface CategoryCardProps {
  categoryId: DreamCategory;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

function CategoryCard({ categoryId, isSelected, onSelect, index }: CategoryCardProps) {
  const category = DREAM_CATEGORIES[categoryId];
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
      entering={FadeInDown.delay(index * 80).springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
      >
        <LinearGradient
          colors={isSelected ? category.gradient : [colors.white, colors.warmCream]}
          style={styles.categoryGradient}
        >
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <View style={styles.categoryTextContainer}>
            <Text
              style={[
                styles.categoryTitle,
                isSelected && styles.categoryTitleSelected,
              ]}
            >
              {category.title}
            </Text>
            <Text
              style={[
                styles.categoryDescription,
                isSelected && styles.categoryDescriptionSelected,
              ]}
            >
              {category.description}
            </Text>
          </View>

          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.selectedCheck}>✓</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NewDreamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createDream, dreams } = useDreams();

  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<DreamCategory | null>(null);
  const [dreamText, setDreamText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const categories: DreamCategory[] = ['career', 'travel', 'finance', 'creative', 'wellness'];

  const handleCategorySelect = useCallback((category: DreamCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategory(category);
  }, []);

  const handleContinueToDescription = useCallback(() => {
    if (!selectedCategory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('dream');
  }, [selectedCategory]);

  const handleCreateDream = useCallback(async () => {
    if (!selectedCategory || !dreamText.trim()) return;

    setIsCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const category = DREAM_CATEGORIES[selectedCategory];
      const dream = await createDream(
        dreamText.trim(),
        selectedCategory,
        `My ${category.title.toLowerCase()} dream`,
      );

      // Save context for the chat screen (FiveWhysChatScreen)
      await Promise.all([
        AsyncStorage.setItem('@boldmove_dream', dreamText.trim()),
        AsyncStorage.setItem('@boldmove_stuck_point', JSON.stringify({
          id: selectedCategory,
          title: category.title.toLowerCase()
        })),
        AsyncStorage.removeItem('@boldmove_current_session') // Force specific new session
      ]);

      // Navigate to the main chat tab which uses the modern Five Whys UI
      router.replace('/(tabs)/chat');
    } catch (error) {
      console.error('Error creating dream:', error);
      setIsCreating(false);
    }
  }, [selectedCategory, dreamText, createDream, router]);

  const canContinue = step === 'category' ? !!selectedCategory : !!dreamText.trim();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>Design Your Journey</Text>
            <Text style={styles.headerSubtitle}>
              Choose your next bold move
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, styles.progressStepActive]} />
          <View style={styles.progressLine} />
          <View
            style={[
              styles.progressStep,
              step !== 'category' && styles.progressStepActive,
            ]}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'category' && (
            <>
              {/* Category Selection */}
              <Animated.View entering={FadeIn} style={styles.stepContent}>


                <View style={styles.categoriesGrid}>
                  {categories.map((category, index) => (
                    <CategoryCard
                      key={category}
                      categoryId={category}
                      isSelected={selectedCategory === category}
                      onSelect={() => handleCategorySelect(category)}
                      index={index}
                    />
                  ))}
                </View>
              </Animated.View>
            </>
          )}

          {step === 'dream' && (
            <>
              {/* Dream Description */}
              <Animated.View entering={FadeInUp} style={styles.stepContent}>
                <View style={styles.categoryPreview}>
                  <Text style={styles.categoryPreviewIcon}>
                    {selectedCategory && DREAM_CATEGORIES[selectedCategory].icon}
                  </Text>
                  <Text style={styles.categoryPreviewText}>
                    {selectedCategory && DREAM_CATEGORIES[selectedCategory].title}
                  </Text>
                </View>

                <Text style={styles.stepTitle}>Describe your dream</Text>
                <Text style={styles.stepSubtitle}>
                  What bold move do you want to make in this area?
                </Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.dreamInput}
                    placeholder="e.g., Start my own creative business..."
                    placeholderTextColor={colors.gray400}
                    value={dreamText}
                    onChangeText={setDreamText}
                    multiline
                    maxLength={200}
                    autoFocus={false}
                  />
                  <Text style={styles.charCount}>{dreamText.length}/200</Text>
                </View>

                {/* Inspiration */}
                <View style={styles.inspirationCard}>
                  <Text style={styles.inspirationTitle}>⚡ Quick Ideas</Text>
                  {getDreamPrompts(selectedCategory).map((prompt, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setDreamText(prompt)}
                      style={styles.promptButton}
                    >
                      <Text style={styles.promptText}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            </>
          )}
        </ScrollView>

        {/* Bottom action */}
        <Animated.View
          entering={FadeInDown.delay(400)}
          style={[styles.bottomAction, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          {step === 'dream' && (
            <TouchableOpacity
              onPress={() => setStep('category')}
              style={styles.backStepButton}
            >
              <Text style={styles.backStepText}>← Change category</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={step === 'category' ? handleContinueToDescription : handleCreateDream}
            disabled={!canContinue || isCreating}
          >
            <LinearGradient
              colors={
                canContinue
                  ? [colors.champagneGold, colors.goldDark]
                  : [colors.gray300, colors.gray400]
              }
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>
                {step === 'category'
                  ? 'Continue'
                  : isCreating
                    ? 'Creating...'
                    : '✨ Start This Dream'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

function getDreamPrompts(category: DreamCategory | null): string[] {
  switch (category) {
    case 'career':
      return [
        'Get promoted to a leadership role',
        'Start my own business',
        'Transition to a new industry',
      ];
    case 'travel':
      return [
        'Take a solo trip abroad',
        'Visit 5 new countries this year',
        'Work remotely from different cities',
      ];
    case 'finance':
      return [
        'Save $10,000 emergency fund',
        'Start investing in the stock market',
        'Achieve financial independence',
      ];
    case 'creative':
      return [
        'Write and publish a book',
        'Learn a musical instrument',
        'Start a creative side project',
      ];
    case 'wellness':
      return [
        'Establish a daily meditation practice',
        'Run my first marathon',
        'Improve my sleep quality',
      ];
    default:
      return ['Describe your dream here...'];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  progressStep: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray300,
  },
  progressStepActive: {
    backgroundColor: colors.champagneGold,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray200,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  stepContent: {
    paddingTop: spacing.lg,
  },
  stepTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
    marginBottom: spacing.xl,
  },
  categoriesGrid: {
    gap: spacing.md,
  },
  categoryCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  categoryCardSelected: {
    ...shadows.glow,
  },
  categoryGradient: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: spacing.lg,
  },
  categoryTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: 4,
  },
  categoryTitleSelected: {
    color: colors.white,
  },
  categoryDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  categoryDescriptionSelected: {
    color: colors.white + '90',
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: {
    fontSize: 16,
    color: colors.vibrantTeal,
    fontWeight: 'bold',
  },
  categoryPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.champagneGold + '20',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.champagneGold + '40',
  },
  categoryPreviewIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  categoryPreviewText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.goldDark,
  },
  inputContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  dreamInput: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  inspirationCard: {
    backgroundColor: colors.warmCream,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inspirationTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    marginBottom: spacing.md,
  },
  promptButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  promptText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  bottomAction: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
    backgroundColor: colors.parchmentWhite,
  },
  backStepButton: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backStepText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.glow,
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
  },
  continueGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  continueText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.white,
  },
});
