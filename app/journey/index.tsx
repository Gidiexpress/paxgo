import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@fastshot/auth';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors, typography, spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function JourneySplashScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showContent, setShowContent] = useState(false);

  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const particleOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Sequence the animations
    setTimeout(() => setShowContent(true), 100);

    // Logo entrance
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    logoScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.1, { damping: 8 }),
        withSpring(1, { damping: 12 })
      )
    );

    // Glow effect
    glowOpacity.value = withDelay(
      600,
      withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) })
    );

    // Tagline entrance
    taglineOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));
    taglineTranslateY.value = withDelay(
      1000,
      withSpring(0, { damping: 15, stiffness: 100 })
    );

    // Subtitle entrance
    subtitleOpacity.value = withDelay(1400, withTiming(1, { duration: 600 }));

    // Particles
    particleOpacity.value = withDelay(800, withTiming(0.8, { duration: 1500 }));

    // Progress bar
    progressWidth.value = withDelay(
      1600,
      withTiming(100, { duration: 2000, easing: Easing.inOut(Easing.cubic) })
    );

    // Navigate after animation
    const timer = setTimeout(() => {
      // If user is already authenticated, skip onboarding collection and go to chat
      if (isAuthenticated) {
        router.replace('/journey/five-whys-chat');
      } else {
        // Not authenticated, start onboarding collection
        router.replace('/journey/stuck-point');
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0, 1], [0.8, 1.2]) }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.midnightNavy, '#0A1929', '#051118']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Animated particles/stars background */}
      <Animated.View style={[styles.particlesContainer, particleStyle]}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: 2 + Math.random() * 4,
                height: 2 + Math.random() * 4,
                opacity: 0.3 + Math.random() * 0.5,
              },
            ]}
          />
        ))}
      </Animated.View>

      {showContent && (
        <View style={styles.content}>
          {/* Glow behind logo */}
          <Animated.View style={[styles.glow, glowStyle]} />

          {/* Logo */}
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <LinearGradient
              colors={[colors.champagneGold, colors.goldDark]}
              style={styles.logoGradient}
            >
              <Text style={styles.logoIcon}>✦</Text>
            </LinearGradient>
            <Text style={styles.logoText}>The Bold Move</Text>
          </Animated.View>

          {/* Main Tagline */}
          <Animated.View style={[styles.taglineContainer, taglineStyle]}>
            <Text style={styles.tagline}>
              Bridge the gap between{'\n'}
              <Text style={styles.taglineHighlight}>who you are</Text>
              {'\n'}and{'\n'}
              <Text style={styles.taglineHighlight}>who you want to become</Text>
            </Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.Text style={[styles.subtitle, subtitleStyle]}>
            Your transformation begins now
          </Animated.Text>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
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
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnightNavy,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    backgroundColor: colors.champagneGold,
    borderRadius: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.champagneGold,
    opacity: 0.15,
    top: height * 0.25,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoIcon: {
    fontSize: 36,
    color: colors.midnightNavy,
  },
  logoText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.white,
    letterSpacing: 1,
  },
  taglineContainer: {
    marginBottom: spacing['2xl'],
  },
  tagline: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xl,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 32,
    opacity: 0.9,
  },
  taglineHighlight: {
    fontFamily: typography.fontFamily.heading,
    color: colors.champagneGold,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray400,
    marginBottom: spacing['4xl'],
  },
  progressContainer: {
    position: 'absolute',
    bottom: 80,
    width: width * 0.6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
