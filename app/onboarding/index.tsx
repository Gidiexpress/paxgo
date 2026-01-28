import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { stuckPoints, dreamCategories, StuckPoint } from '@/constants/stuckPoints';
import { Button } from '@/components/ui/Button';
import { useUser, useOnboarding, useDreamProgress } from '@/hooks/useStorage';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Paxgo',
    subtitle: 'Your personal journey from dreaming to doing starts here.',
  },
  {
    id: 'stuck-point',
    title: "Where are you feeling stuck?",
    subtitle: "Select the area where you'd like to make bold moves.",
  },
  {
    id: 'dream',
    title: "What's your bold dream?",
    subtitle: "What's the thing you've been putting off? Let's make it happen.",
  },
  {
    id: 'name',
    title: "Let's make this personal",
    subtitle: "What should we call you?",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedStuckPoint, setSelectedStuckPoint] = useState<string | null>(null);
  const [selectedDream, setSelectedDream] = useState<string | null>(null);
  const [customDream, setCustomDream] = useState('');
  const [userName, setUserName] = useState('');

  const { createUser } = useUser();
  const { completeOnboarding } = useOnboarding();
  const { initializeProgress } = useDreamProgress();

  const progress = useSharedValue(0);

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      progress.value = withSpring(nextStep / (steps.length - 1));
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
    } else {
      // Complete onboarding
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      const dream = selectedDream === 'custom' ? customDream :
        dreamCategories.find(d => d.id === selectedDream)?.label || customDream;

      await createUser({
        name: userName || 'Bold Explorer',
        stuckPoint: selectedStuckPoint || 'personal-freedom',
        dream: dream,
        onboardingCompleted: true,
      });

      await initializeProgress(selectedDream || 'custom');
      await completeOnboarding();

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true;
      case 'stuck-point':
        return selectedStuckPoint !== null;
      case 'dream':
        return selectedDream !== null && (selectedDream !== 'custom' || customDream.trim().length > 0);
      case 'name':
        return true; // Name is optional
      default:
        return false;
    }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const renderStuckPointItem = ({ item }: { item: StuckPoint }) => {
    const isSelected = selectedStuckPoint === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.stuckPointCard,
          isSelected && { borderColor: item.color, borderWidth: 2 },
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          setSelectedStuckPoint(item.id);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.stuckPointEmoji}>{item.emoji}</Text>
        <Text style={styles.stuckPointTitle}>{item.title}</Text>
        <Text style={styles.stuckPointDescription}>{item.description}</Text>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: item.color }]}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDreamItem = ({ item }: { item: typeof dreamCategories[0] }) => {
    const isSelected = selectedDream === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.dreamCard,
          isSelected && styles.dreamCardSelected,
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          setSelectedDream(item.id);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.dreamIcon}>{item.icon}</Text>
        <Text style={[styles.dreamLabel, isSelected && styles.dreamLabelSelected]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStep = ({ item, index }: { item: OnboardingStep; index: number }) => {
    return (
      <View style={[styles.stepContainer, { width }]}>
        {item.id === 'welcome' && (
          <View style={styles.welcomeContent}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[colors.boldTerracotta, colors.terracottaDark]}
                style={styles.logoGradient}
              >
                <Text style={styles.logoText}>P</Text>
              </LinearGradient>
            </View>
            <Text style={styles.welcomeTitle}>{item.title}</Text>
            <Text style={styles.welcomeSubtitle}>{item.subtitle}</Text>
            <View style={styles.welcomeFeatures}>
              {[
                { icon: '🧠', text: 'Mindset reframes' },
                { icon: '⚡', text: '5-minute actions' },
                { icon: '🏆', text: 'Track your wins' },
              ].map((feature, i) => (
                <View key={i} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {item.id === 'stuck-point' && (
          <View style={styles.selectionContent}>
            <Text style={styles.stepTitle}>{item.title}</Text>
            <Text style={styles.stepSubtitle}>{item.subtitle}</Text>
            <FlatList
              data={stuckPoints}
              renderItem={renderStuckPointItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.stuckPointGrid}
              columnWrapperStyle={styles.stuckPointRow}
              scrollEnabled={false}
            />
          </View>
        )}

        {item.id === 'dream' && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.selectionContent}
          >
            <Text style={styles.stepTitle}>{item.title}</Text>
            <Text style={styles.stepSubtitle}>{item.subtitle}</Text>
            <FlatList
              data={dreamCategories}
              renderItem={renderDreamItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.dreamList}
              scrollEnabled={true}
              style={styles.dreamScroll}
            />
            {selectedDream === 'custom' && (
              <TextInput
                style={styles.customInput}
                placeholder="Describe your bold dream..."
                placeholderTextColor={colors.gray400}
                value={customDream}
                onChangeText={setCustomDream}
                multiline
              />
            )}
          </KeyboardAvoidingView>
        )}

        {item.id === 'name' && (
          <View style={styles.selectionContent}>
            <Text style={styles.stepTitle}>{item.title}</Text>
            <Text style={styles.stepSubtitle}>{item.subtitle}</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Your name (optional)"
              placeholderTextColor={colors.gray400}
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="words"
            />
            <Text style={styles.privacyNote}>
              Your data stays on your device. We believe in your journey, not your data.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background */}
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </View>

      {/* Steps */}
      <FlatList
        ref={flatListRef}
        data={steps}
        renderItem={renderStep}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepsContent}
      />

      {/* Navigation */}
      <View style={[styles.navigation, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title={currentStep === steps.length - 1 ? "Let's Go!" : 'Continue'}
          onPress={handleNext}
          variant="primary"
          size="lg"
          disabled={!canProceed()}
          style={styles.continueButton}
        />
        {currentStep > 0 && (
          <TouchableOpacity
            onPress={() => {
              const prevStep = currentStep - 1;
              setCurrentStep(prevStep);
              progress.value = withSpring(prevStep / (steps.length - 1));
              flatListRef.current?.scrollToIndex({ index: prevStep, animated: true });
            }}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
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
  progressContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.boldTerracotta,
    borderRadius: 2,
  },
  stepsContent: {
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  welcomeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  logoContainer: {
    marginBottom: spacing['3xl'],
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  logoText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 48,
    color: colors.white,
  },
  welcomeTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['4xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  welcomeSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.lg,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  welcomeFeatures: {
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  selectionContent: {
    flex: 1,
    paddingTop: spacing['3xl'],
  },
  stepTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  stuckPointGrid: {
    paddingBottom: spacing.xl,
  },
  stuckPointRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  stuckPointCard: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stuckPointEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  stuckPointTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  stuckPointDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  dreamScroll: {
    maxHeight: height * 0.45,
  },
  dreamList: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  dreamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dreamCardSelected: {
    borderColor: colors.boldTerracotta,
    backgroundColor: colors.warmCream,
  },
  dreamIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  dreamLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  dreamLabelSelected: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.boldTerracotta,
  },
  customInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    minHeight: 80,
    marginTop: spacing.md,
    ...shadows.sm,
    textAlignVertical: 'top',
  },
  nameInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    textAlign: 'center',
    ...shadows.sm,
  },
  privacyNote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  navigation: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
  },
  backButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  backButtonText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
  },
});
