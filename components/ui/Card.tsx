import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'premium' | 'completed' | 'elevated';
  style?: ViewStyle;
  noPadding?: boolean;
}

export function Card({
  children,
  variant = 'default',
  style,
  noPadding = false,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        noPadding && styles.noPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    ...shadows.md,
  },
  default: {
    backgroundColor: colors.white,
  },
  premium: {
    backgroundColor: colors.warmCream,
    borderWidth: 1.5,
    borderColor: colors.champagneGold + '60',
  },
  completed: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.vibrantTeal,
  },
  elevated: {
    ...shadows.lg,
  },
  noPadding: {
    padding: 0,
  },
});
