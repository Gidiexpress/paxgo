import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, borderRadius } from '@/constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'premium' | 'success' | 'gold' | 'navy';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  style,
}: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.md,
  },
  sm: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  md: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  default: {
    backgroundColor: colors.gray200,
  },
  premium: {
    backgroundColor: colors.champagneGold,
  },
  success: {
    backgroundColor: colors.vibrantTeal,
  },
  gold: {
    backgroundColor: colors.goldLight,
  },
  navy: {
    backgroundColor: colors.midnightNavy,
  },
  text: {
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  defaultText: {
    color: colors.gray700,
  },
  premiumText: {
    color: colors.midnightNavy,
  },
  successText: {
    color: colors.white,
  },
  goldText: {
    color: colors.midnightNavy,
  },
  navyText: {
    color: colors.white,
  },
  smText: {
    fontSize: typography.fontSize.xs,
  },
  mdText: {
    fontSize: typography.fontSize.sm,
  },
});
