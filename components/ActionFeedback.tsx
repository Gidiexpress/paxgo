import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';

interface ActionFeedbackProps {
  actionTitle: string;
  onSubmit: (feedback: ActionFeedbackData) => void;
  onSkip?: () => void;
}

export interface ActionFeedbackData {
  rating: number;
  feelingBefore: string | null;
  feelingAfter: string | null;
  wouldRepeat: boolean | null;
  additionalNote?: string;
}

const FEELINGS = ['😰', '😐', '🙂', '😊', '🤩'] as const;
const FEELING_LABELS = ['Anxious', 'Neutral', 'Good', 'Great', 'Amazing'] as const;

export function ActionFeedback({ actionTitle, onSubmit, onSkip }: ActionFeedbackProps) {
  const [step, setStep] = useState<'rating' | 'feelings' | 'repeat' | 'note'>('rating');
  const [rating, setRating] = useState<number>(0);
  const [feelingBefore, setFeelingBefore] = useState<number | null>(null);
  const [feelingAfter, setFeelingAfter] = useState<number | null>(null);
  const [wouldRepeat, setWouldRepeat] = useState<boolean | null>(null);
  const [note, setNote] = useState('');

  const handleRatingSelect = (value: number) => {
    Haptics.selectionAsync();
    setRating(value);
    setTimeout(() => setStep('feelings'), 300);
  };

  const handleFeelingsComplete = () => {
    setStep('repeat');
  };

  const handleRepeatSelect = (value: boolean) => {
    Haptics.selectionAsync();
    setWouldRepeat(value);
    setTimeout(() => setStep('note'), 300);
  };

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit({
      rating,
      feelingBefore: feelingBefore !== null ? FEELING_LABELS[feelingBefore] : null,
      feelingAfter: feelingAfter !== null ? FEELING_LABELS[feelingAfter] : null,
      wouldRepeat,
      additionalNote: note.trim() || undefined,
    });
  };

  const renderRatingStep = () => (
    <Animated.View entering={FadeIn} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How was this action?</Text>
      <Text style={styles.stepSubtitle}>{actionTitle}</Text>

      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.ratingButton,
              rating === value && styles.ratingButtonSelected,
            ]}
            onPress={() => handleRatingSelect(value)}
          >
            <Text style={[styles.ratingStar, rating >= value && styles.ratingStarSelected]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.ratingHint}>
        {rating === 0 && 'Tap to rate'}
        {rating === 1 && 'Not helpful'}
        {rating === 2 && 'Slightly helpful'}
        {rating === 3 && 'Somewhat helpful'}
        {rating === 4 && 'Very helpful'}
        {rating === 5 && 'Transformative!'}
      </Text>
    </Animated.View>
  );

  const renderFeelingsStep = () => (
    <Animated.View entering={FadeInDown} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How did you feel?</Text>

      <View style={styles.feelingsSection}>
        <Text style={styles.feelingLabel}>Before:</Text>
        <View style={styles.feelingsRow}>
          {FEELINGS.map((emoji, index) => (
            <TouchableOpacity
              key={`before-${index}`}
              style={[
                styles.feelingButton,
                feelingBefore === index && styles.feelingButtonSelected,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setFeelingBefore(index);
              }}
            >
              <Text style={styles.feelingEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.feelingsSection}>
        <Text style={styles.feelingLabel}>After:</Text>
        <View style={styles.feelingsRow}>
          {FEELINGS.map((emoji, index) => (
            <TouchableOpacity
              key={`after-${index}`}
              style={[
                styles.feelingButton,
                feelingAfter === index && styles.feelingButtonSelected,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setFeelingAfter(index);
              }}
            >
              <Text style={styles.feelingEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.nextButton,
          (feelingBefore === null || feelingAfter === null) && styles.nextButtonDisabled,
        ]}
        onPress={handleFeelingsComplete}
        disabled={feelingBefore === null || feelingAfter === null}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderRepeatStep = () => (
    <Animated.View entering={FadeInDown} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Would you do this action again?</Text>

      <View style={styles.repeatButtons}>
        <TouchableOpacity
          style={[
            styles.repeatButton,
            wouldRepeat === true && styles.repeatButtonSelected,
          ]}
          onPress={() => handleRepeatSelect(true)}
        >
          <Text style={styles.repeatEmoji}>👍</Text>
          <Text style={[styles.repeatText, wouldRepeat === true && styles.repeatTextSelected]}>
            Yes, definitely!
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.repeatButton,
            wouldRepeat === false && styles.repeatButtonNo,
          ]}
          onPress={() => handleRepeatSelect(false)}
        >
          <Text style={styles.repeatEmoji}>🤔</Text>
          <Text style={[styles.repeatText, wouldRepeat === false && styles.repeatTextSelected]}>
            Maybe not
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderNoteStep = () => (
    <Animated.View entering={FadeInDown} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Any thoughts to add?</Text>
      <Text style={styles.stepSubtitle}>
        This helps Gabby give you better suggestions
      </Text>

      <TextInput
        style={styles.noteInput}
        placeholder="What worked? What didn't? (optional)"
        placeholderTextColor={colors.gray400}
        multiline
        numberOfLines={3}
        value={note}
        onChangeText={setNote}
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <LinearGradient
          colors={[colors.vibrantTeal, colors.tealDark]}
          style={styles.submitGradient}
        >
          <Text style={styles.submitText}>Done</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progress}>
        {['rating', 'feelings', 'repeat', 'note'].map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              (step === s || ['rating', 'feelings', 'repeat', 'note'].indexOf(step) > i) &&
                styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {step === 'rating' && renderRatingStep()}
      {step === 'feelings' && renderFeelingsStep()}
      {step === 'repeat' && renderRepeatStep()}
      {step === 'note' && renderNoteStep()}

      {/* Skip option */}
      {onSkip && step === 'rating' && (
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>Skip feedback</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray300,
  },
  progressDotActive: {
    backgroundColor: colors.vibrantTeal,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  ratingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  ratingButtonSelected: {
    backgroundColor: colors.champagneGold + '20',
    borderWidth: 2,
    borderColor: colors.champagneGold,
  },
  ratingStar: {
    fontSize: 24,
    color: colors.gray300,
  },
  ratingStarSelected: {
    color: colors.champagneGold,
  },
  ratingHint: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  feelingsSection: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  feelingLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  feelingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feelingButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  feelingButtonSelected: {
    backgroundColor: colors.vibrantTeal + '20',
    borderWidth: 2,
    borderColor: colors.vibrantTeal,
  },
  feelingEmoji: {
    fontSize: 24,
  },
  nextButton: {
    backgroundColor: colors.midnightNavy,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['3xl'],
    borderRadius: borderRadius.xl,
    marginTop: spacing.lg,
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  nextButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  repeatButtons: {
    width: '100%',
    gap: spacing.md,
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmCream,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  repeatButtonSelected: {
    backgroundColor: colors.vibrantTeal + '20',
    borderWidth: 2,
    borderColor: colors.vibrantTeal,
  },
  repeatButtonNo: {
    backgroundColor: colors.boldTerracotta + '15',
    borderWidth: 2,
    borderColor: colors.boldTerracotta + '40',
  },
  repeatEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  repeatText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
  },
  repeatTextSelected: {
    color: colors.midnightNavy,
  },
  noteInput: {
    width: '100%',
    minHeight: 100,
    backgroundColor: colors.warmCream,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  submitButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  submitGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['4xl'],
    alignItems: 'center',
  },
  submitText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
  skipText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textDecorationLine: 'underline',
  },
});
