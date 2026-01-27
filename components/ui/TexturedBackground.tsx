import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';

interface TexturedBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'parchment' | 'cream' | 'ivory';
}

export function TexturedBackground({
  children,
  style,
  variant = 'parchment',
}: TexturedBackgroundProps) {
  const backgroundColors = {
    parchment: colors.parchmentWhite,
    cream: colors.warmCream,
    ivory: colors.softIvory,
  };

  return (
    <View style={[styles.container, { backgroundColor: backgroundColors[variant] }, style]}>
      {/* Subtle grain texture overlay */}
      <View style={styles.grainOverlay} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.03,
    // This creates a subtle texture effect
  },
});
