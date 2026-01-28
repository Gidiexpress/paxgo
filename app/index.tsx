import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '@/constants/theme';
import { useOnboarding } from '@/hooks/useStorage';
import { useAuth } from '@fastshot/auth';

export default function Index() {
  const { isComplete, loading: onboardingLoading } = useOnboarding();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (onboardingLoading || authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.boldTerracotta} />
      </View>
    );
  }

  // If user has completed onboarding and is authenticated, go to main app
  if (isComplete && isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // If user has completed journey onboarding (checked via flag in storage)
  // but not the old onboarding, still go to main app if authenticated
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // New users go to the A-Z journey flow
  return <Redirect href="/journey" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parchmentWhite,
  },
});
