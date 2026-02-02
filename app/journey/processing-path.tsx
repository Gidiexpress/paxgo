import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@fastshot/auth';
import { colors, typography, spacing, shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useSnackbar } from '@/contexts/SnackbarContext';

const { width, height } = Dimensions.get('window');

const PROCESSING_MESSAGES = [
  'Analyzing your aspirations...',
  'Understanding your journey...',
  'Mapping your potential...',
  'Preparing your Golden Path...',
  'Connecting the dots...',
];

export default function ProcessingPathScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showError } = useSnackbar();

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTransferring, setIsTransferring] = useState(true);

  // Animation values
  const orbScale = useSharedValue(1);
  const orbGlow = useSharedValue(0);
  const innerOrbScale = useSharedValue(1);
  const ringRotation = useSharedValue(0);
  const ring2Rotation = useSharedValue(0);
  const particleOpacity = useSharedValue(0);
  const progressValue = useSharedValue(0);
  const messageOpacity = useSharedValue(1);

  // Transfer onboarding data to database
  const transferOnboardingData = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ No user ID available');
      return;
    }

    console.log('🔄 Starting data transfer for user:', user.id);

    try {
      // Get stored onboarding data
      const [stuckPointStr, dreamStr, userNameStr] = await Promise.all([
        AsyncStorage.getItem('@boldmove_stuck_point'),
        AsyncStorage.getItem('@boldmove_dream'),
        AsyncStorage.getItem('@boldmove_user'),
      ]);

      const stuckPoint = stuckPointStr ? JSON.parse(stuckPointStr) : null;
      const dream = dreamStr || '';
      const userData = userNameStr ? JSON.parse(userNameStr) : null;

      console.log('📦 Onboarding data:', { stuckPoint: stuckPoint?.id, dream, userName: userData?.name });

      // Wait for user profile to exist (with retry logic)
      // The trigger should create it, but let's ensure it exists before proceeding
      let userProfileExists = false;
      let retryCount = 0;
      const maxRetries = 5;

      while (!userProfileExists && retryCount < maxRetries) {
        console.log(`🔍 Checking if user profile exists (attempt ${retryCount + 1}/${maxRetries})...`);

        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (existingUser) {
          console.log('✅ User profile found');
          userProfileExists = true;
        } else if (checkError?.code === 'PGRST116') {
          // Profile doesn't exist yet, create it manually as fallback
          console.log('⚠️ User profile not found, creating manually...');

          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              name: userData?.name || user.email?.split('@')[0] || 'Bold Explorer',
              onboarding_completed: false,
            });

          if (!insertError) {
            console.log('✅ User profile created manually');
            userProfileExists = true;
          } else {
            console.error('❌ Error creating user profile:', insertError);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
          }
        } else {
          console.error('❌ Error checking user profile:', checkError);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }

      if (!userProfileExists) {
        throw new Error('Failed to create user profile after multiple attempts');
      }

      // Now update the user profile with onboarding data
      console.log('📝 Updating user profile with onboarding data...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: userData?.name || user.email?.split('@')[0] || 'Bold Explorer',
          stuck_point: stuckPoint?.id || stuckPoint?.title || null,
          dream: dream,
          onboarding_completed: false, // Will be set to true after 5 Whys
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Error updating user profile:', updateError);
        throw updateError;
      }

      console.log('✅ User profile updated successfully');

      // Create or get active dream
      console.log('🔍 Checking for existing dream...');
      const { data: existingDream } = await supabase
        .from('dreams')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!existingDream && dream) {
        console.log('📝 Creating new dream...');
        const { error: dreamError } = await supabase
          .from('dreams')
          .insert({
            user_id: user.id,
            title: dream,
            category: stuckPoint?.id || stuckPoint?.title || 'personal-growth',
            is_active: true,
          });

        if (dreamError) {
          console.error('❌ Error creating dream:', dreamError);
          // Don't throw - dream is optional
        } else {
          console.log('✅ Dream created successfully');
        }
      } else if (existingDream) {
        console.log('✅ Active dream already exists');
      }

      // Create a new Five Whys session
      console.log('📝 Creating Five Whys session...');
      const { data: session, error: sessionError } = await supabase
        .from('five_whys_sessions')
        .insert({
          user_id: user.id,
          status: 'in_progress',
          current_why_number: 0,
        })
        .select()
        .single();

      if (sessionError) {
        console.error('❌ Error creating session:', sessionError);
        // Don't throw - we can create session later
      } else {
        console.log('✅ Five Whys session created:', session.id);
        // Store session ID for the chat
        await AsyncStorage.setItem('@boldmove_current_session', session.id);
      }

      console.log('🎉 Data transfer completed successfully');
      setIsTransferring(false);
    } catch (error: any) {
      console.error('💥 Failed to transfer onboarding data:', error);
      showError(error.message || 'Something went wrong. Please try again.');
      setIsTransferring(false);
    }
  }, [user, showError]);

  // Start animations
  useEffect(() => {
    // Main orb pulsing
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Inner orb faster pulse
    innerOrbScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Glow animation
    orbGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Ring rotations
    ringRotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    ring2Rotation.value = withRepeat(
      withTiming(-360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );

    // Particles fade in
    particleOpacity.value = withDelay(500, withTiming(1, { duration: 1000 }));

    // Progress animation
    progressValue.value = withTiming(1, { duration: 4500, easing: Easing.out(Easing.cubic) });
  }, []);

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      messageOpacity.value = withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );

      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
      }, 300);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  // Transfer data on mount
  useEffect(() => {
    transferOnboardingData();
  }, [transferOnboardingData]);

  // Navigate after processing
  useEffect(() => {
    if (!isTransferring) {
      const timer = setTimeout(() => {
        router.replace('/journey/five-whys-chat');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isTransferring, router]);

  // Animated styles
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const innerOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerOrbScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(orbGlow.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(orbGlow.value, [0, 1], [0.9, 1.3]) }],
  }));

  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(orbGlow.value, [0, 1], [0.15, 0.35]),
    transform: [{ scale: interpolate(orbGlow.value, [0, 1], [1.1, 1.6]) }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring2Rotation.value}deg` }],
  }));

  const particlesStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const messageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

  // Generate floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * 2 * Math.PI;
      const radius = 100 + Math.random() * 50;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const size = 2 + Math.random() * 4;
      const delay = Math.random() * 2000;

      particles.push(
        <Animated.View
          key={i}
          entering={FadeIn.delay(delay).duration(1000)}
          style={[
            styles.particle,
            {
              left: width / 2 + x - size / 2,
              top: height / 2 - 60 + y - size / 2,
              width: size,
              height: size,
              opacity: 0.4 + Math.random() * 0.4,
            },
          ]}
        />
      );
    }
    return particles;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Obsidian glass background */}
      <LinearGradient
        colors={['#0A0E14', '#111820', '#0F1318', '#0A0E14']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Subtle texture overlay */}
      <View style={styles.textureOverlay} />

      {/* Floating particles */}
      <Animated.View style={[styles.particlesContainer, particlesStyle]}>
        {renderParticles()}
      </Animated.View>

      {/* Outer glow */}
      <Animated.View style={[styles.outerGlow, outerGlowStyle]} />

      {/* Main glow */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* Rotating rings */}
      <Animated.View style={[styles.ring, styles.ring1, ring1Style]} />
      <Animated.View style={[styles.ring, styles.ring2, ring2Style]} />

      {/* Golden Path Orb */}
      <Animated.View style={[styles.orbContainer, orbStyle]}>
        <LinearGradient
          colors={[colors.champagneGold, '#B8952D', '#8B7229']}
          style={styles.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={[styles.innerOrb, innerOrbStyle]}>
            <LinearGradient
              colors={['#FFF8E1', colors.champagneGold, '#B8952D']}
              style={styles.innerOrbGradient}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
            />
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        <Animated.Text entering={FadeInUp.delay(300)} style={styles.title}>
          Processing Your Path
        </Animated.Text>

        <Animated.View style={[styles.messageContainer, messageStyle]}>
          <Text style={styles.processingMessage}>
            {PROCESSING_MESSAGES[currentMessageIndex]}
          </Text>
        </Animated.View>

        {/* Progress bar */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]}>
              <LinearGradient
                colors={[colors.champagneGold, colors.boldTerracotta]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(900)} style={styles.subtitle}>
          Gabby is preparing a personalized experience{'\n'}just for you
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E14',
  },
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    backgroundColor: colors.champagneGold,
    borderRadius: 10,
  },
  outerGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.champagneGold,
    top: height / 2 - 210,
    left: width / 2 - 150,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.champagneGold,
    top: height / 2 - 160,
    left: width / 2 - 100,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: `${colors.champagneGold}30`,
    borderRadius: 150,
  },
  ring1: {
    width: 200,
    height: 200,
    top: height / 2 - 160,
    left: width / 2 - 100,
    borderStyle: 'dashed',
  },
  ring2: {
    width: 260,
    height: 260,
    top: height / 2 - 190,
    left: width / 2 - 130,
    borderColor: `${colors.champagneGold}20`,
  },
  orbContainer: {
    position: 'absolute',
    top: height / 2 - 120,
    left: width / 2 - 60,
    width: 120,
    height: 120,
    ...shadows.xl,
    shadowColor: colors.champagneGold,
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerOrb: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
  },
  innerOrbGradient: {
    width: '100%',
    height: '100%',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['6xl'],
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xl,
    letterSpacing: 0.5,
  },
  messageContainer: {
    height: 28,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  processingMessage: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.champagneGold,
    textAlign: 'center',
  },
  progressContainer: {
    width: '70%',
    marginBottom: spacing.xl,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
