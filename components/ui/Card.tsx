import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows } from '@/constants/theme';

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
    borderRadius: borderRadius.xl,
    padding: 16,
    ...shadows.md,
  },
  default: {
    backgroundColor: colors.white,
  },
  premium: {
    backgroundColor: colors.warmCream,
    borderWidth: 1,
    borderColor: colors.champagneGold,
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
