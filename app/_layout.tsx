import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@fastshot/auth';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/theme';
import { SnackbarProvider } from '@/contexts/SnackbarContext';
import { SnackbarContainer } from '@/components/Snackbar';
import Purchases from 'react-native-purchases';
import { REVENUECAT_CONFIG } from '@/constants/sub-config';
import { RoadmapProvider } from '@/contexts/RoadmapContext';
import { HypeFeedProvider } from '@/contexts/HypeFeedContext';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('[RC] initApp started');
        if (Platform.OS === 'android') {
          const apiKey = REVENUECAT_CONFIG.apiKey;
          console.log('[RC] API Key:', apiKey);

          if (apiKey) {
            Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
            await Purchases.configure({ apiKey });
            console.log('[RC] Configuration successful');
            // Alert.alert('RC Configured', 'Success!'); 
          } else {
            console.error('[RC] No API Key found!');
            Alert.alert('Config Error', 'No RevenueCat API Key found in .env');
          }
        } else {
          console.log('[RC] access limited to Android for now');
        }
      } catch (e: any) {
        console.error('[RC] Configuration failed:', e);
        Alert.alert('RC Config Failed', e.message);
      } finally {
        setIsReady(true);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    if (fontsLoaded && isReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isReady]);

  if (!fontsLoaded || !isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.boldTerracotta} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider
        supabaseClient={supabase}
        routes={{
          login: '/journey/create-account',
          afterLogin: '/(tabs)',
          protected: ['tabs', 'home', 'main'],
          guest: [],
        }}
      >
        <RoadmapProvider>
          <HypeFeedProvider>
            <SnackbarProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  contentStyle: { backgroundColor: colors.parchmentWhite },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="journey" />

                <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
                <Stack.Screen
                  name="paywall"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="add-proof"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="add-action"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
              </Stack>
              <SnackbarContainer />
            </SnackbarProvider>
          </HypeFeedProvider>
        </RoadmapProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parchmentWhite,
  },
});
