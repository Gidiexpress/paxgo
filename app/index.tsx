import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '@/constants/theme';
import { useOnboarding } from '@/hooks/useStorage';

export default function Index() {
  const { isComplete, loading } = useOnboarding();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.boldTerracotta} />
      </View>
    );
  }

  // Navigate based on onboarding status
  if (isComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parchmentWhite,
  },
});
