import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
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
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';

// Dream examples based on category
const DREAM_EXAMPLES: Record<string, string[]> = {
  career: ['Start my own business', 'Get promoted to manager', 'Switch to tech industry'],
  travel: ['Solo trip to Japan', 'Backpack through Europe', 'Learn to surf in Bali'],
  finance: ['Save $10,000 emergency fund', 'Start investing monthly', 'Become debt-free'],
  creative: ['Write my first novel', 'Launch a podcast', 'Learn to play guitar'],
  wellness: ['Run a marathon', 'Meditate daily for 30 days', 'Lose 20 pounds'],
};

export default function DreamInputScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [dream, setDream] = useState('');
  const [stuckPoint, setStuckPoint] = useState('travel');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const inputFocusScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Load stuck point
    AsyncStorage.getItem('@boldmove_stuck_point').then((value) => {
      if (value) setStuckPoint(value);
    });

    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 500);

    // Keyboard listeners
    const showSub = Keyboard.addListener('keyboardWillShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardWillHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleFocus = () => {
    inputFocusScale.value = withSpring(1.02, { damping: 15 });
    glowOpacity.value = withTiming(1, { duration: 300 });
  };

  const handleBlur = () => {
    inputFocusScale.value = withSpring(1, { damping: 15 });
    glowOpacity.value = withTiming(0, { duration: 300 });
  };

  const handleExamplePress = (example: string) => {
    Haptics.selectionAsync();
    setDream(example);
  };

  const handleContinue = async () => {
    if (!dream.trim()) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Store the dream
    await AsyncStorage.setItem('@boldmove_dream', dream.trim());

    // Navigate to account creation
    router.push('/journey/create-account');
  };

  const inputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputFocusScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const examples = DREAM_EXAMPLES[stuckPoint] || DREAM_EXAMPLES.travel;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {/* Header */}
        <Animated.View entering={FadeIn} style={styles.header}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, styles.stepDotComplete]}>
              <Text style={styles.stepDotCheck}>✓</Text>
            </View>
            <View style={[styles.stepLine, styles.stepLineComplete]} />
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={styles.stepDot} />
          </View>

          <Text style={styles.title}>What&apos;s your bold dream?</Text>
          <Text style={styles.subtitle}>
            The thing you&apos;ve been putting off.{'\n'}Let&apos;s make it happen.
          </Text>
        </Animated.View>

        {/* Dream Input */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.inputContainer}
        >
          {/* Glow effect */}
          <Animated.View style={[styles.inputGlow, glowStyle]} />

          <Animated.View style={[styles.inputWrapper, inputStyle]}>
            <View style={styles.inputIcon}>
              <Text style={styles.inputIconText}>✦</Text>
            </View>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="e.g., Solo trip to Japan"
              placeholderTextColor={colors.gray400}
              value={dream}
              onChangeText={setDream}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoCapitalize="sentences"
              autoCorrect
              returnKeyType="done"
              onSubmitEditing={() => dream.trim() && handleContinue()}
            />
            {dream.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setDream('')}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>

        {/* Example suggestions */}
        {!isKeyboardVisible && (
          <Animated.View entering={FadeInUp.delay(400)} style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>Try these ideas:</Text>
            <View style={styles.suggestions}>
              {examples.map((example, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleExamplePress(example)}
                >
                  <Text style={styles.suggestionText}>{example}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Inspirational quote */}
        {!isKeyboardVisible && (
          <Animated.View entering={FadeIn.delay(600)} style={styles.quoteContainer}>
            <LinearGradient
              colors={[colors.champagneGold + '15', colors.goldLight + '10']}
              style={styles.quoteGradient}
            >
              <Text style={styles.quoteText}>
                &quot;The journey of a thousand miles{'\n'}begins with a single step.&quot;
              </Text>
              <Text style={styles.quoteAuthor}>— Lao Tzu</Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Continue Button */}
        <Animated.View
          entering={FadeInDown.delay(300)}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={[
              styles.continueButton,
              !dream.trim() && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!dream.trim()}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={
                dream.trim()
                  ? [colors.boldTerracotta, colors.terracottaDark]
                  : [colors.gray300, colors.gray400]
              }
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>
                {dream.trim() ? "Let's Do This" : 'Enter Your Dream'}
              </Text>
              {dream.trim() && <Text style={styles.continueEmoji}>✨</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  content: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.boldTerracotta,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepDotComplete: {
    backgroundColor: colors.vibrantTeal,
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  stepDotCheck: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.sm,
  },
  stepLineComplete: {
    backgroundColor: colors.vibrantTeal,
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
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: spacing.xl,
    position: 'relative',
  },
  inputGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: borderRadius['2xl'] + 8,
    backgroundColor: colors.champagneGold,
    opacity: 0.15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.md,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.champagneGold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  inputIconText: {
    fontSize: 16,
    color: colors.champagneGold,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  clearButtonText: {
    fontSize: 12,
    color: colors.gray500,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    marginBottom: spacing.xl,
  },
  suggestionsLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginBottom: spacing.md,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.sm,
  },
  suggestionText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
  },
  quoteContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  quoteGradient: {
    padding: spacing.xl,
    borderRadius: borderRadius['2xl'],
  },
  quoteText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  quoteAuthor: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 'auto',
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
  continueEmoji: {
    fontSize: 18,
  },
});
