import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '@/constants/theme';
import { useAuth } from '@fastshot/auth';
import { supabase } from '@/lib/supabase';

export default function Index() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (isAuthenticated && user?.id) {
        try {
          // Check if user has completed onboarding in the database
          const { data, error } = await supabase
            .from('users')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

          if (data) {
            setOnboardingComplete(data.onboarding_completed || false);
          } else {
            // User profile doesn't exist yet, onboarding not complete
            setOnboardingComplete(false);
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setOnboardingComplete(false);
        }
      }
      setChecking(false);
    }

    if (!authLoading) {
      if (isAuthenticated) {
        checkOnboardingStatus();
      } else {
        setChecking(false);
      }
    }
  }, [isAuthenticated, authLoading, user]);

  if (authLoading || checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.boldTerracotta} />
      </View>
    );
  }

  // Authenticated users who completed onboarding → main app
  if (isAuthenticated && onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  // Authenticated users who haven't completed onboarding → five whys chat
  if (isAuthenticated && onboardingComplete === false) {
    return <Redirect href="/journey/five-whys-chat" />;
  }

  // Not authenticated users → journey flow (which leads to auth)
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
