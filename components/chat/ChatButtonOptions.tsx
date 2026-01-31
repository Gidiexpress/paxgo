import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';

interface ChatButtonOptionsProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export function ChatButtonOptions({ options, onSelect, disabled }: ChatButtonOptionsProps) {
  const handleSelect = async (option: string) => {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(option);
  };

  return (
    <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.container}>
      <Text style={styles.hint}>Choose what resonates with you:</Text>
      <View style={styles.buttonsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.optionButton, disabled && styles.optionButtonDisabled]}
            onPress={() => handleSelect(option)}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text style={[styles.optionText, disabled && styles.optionTextDisabled]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  hint: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  optionButton: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.boldTerracotta,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 100,
    ...shadows.sm,
  },
  optionButtonDisabled: {
    borderColor: colors.gray300,
    backgroundColor: colors.gray100,
  },
  optionText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
    textAlign: 'center',
  },
  optionTextDisabled: {
    color: colors.gray400,
  },
});
