import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@fastshot/auth';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  FadeInDown,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors, typography, spacing, shadows } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Turn Dreams\ninto Action',
    subtitle: 'Break down big goals into small, daily steps. No overwhelm, just progress.',
    emoji: '🚀',
    colors: [colors.midnightNavy, '#0A1929'],
  },
  {
    id: '2',
    title: 'Get Hyped by\nthe Community',
    subtitle: 'Share your wins anonymously. Support others. Feel the momentum together.',
    emoji: '✨',
    colors: [colors.midnightNavy, colors.vibrantTeal],
  },
];

export default function JourneySplashScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.replace('/journey/five-whys-chat');
    } else {
      router.replace('/journey/stuck-point');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background Gradient - transitions based on slide */}
      <Animated.View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={currentIndex === 0 ? SLIDES[0].colors : SLIDES[1].colors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        bounces={false}
      >
        {SLIDES.map((slide, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const slideAnimatedStyle = useAnimatedStyle(() => {
            const scale = interpolate(
              scrollX.value,
              inputRange,
              [0.8, 1, 0.8],
              Extrapolation.CLAMP
            );
            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.5, 1, 0.5],
              Extrapolation.CLAMP
            );
            return {
              transform: [{ scale }],
              opacity,
            };
          });

          return (
            <View key={slide.id} style={styles.slide}>
              <Animated.View style={[styles.slideContent, slideAnimatedStyle]}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>{slide.emoji}</Text>
                </View>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
              </Animated.View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {SLIDES.map((_, index) => {
          const dotStyle = useAnimatedStyle(() => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];
            const widthAnim = interpolate(
              scrollX.value,
              inputRange,
              [8, 24, 8],
              Extrapolation.CLAMP
            );
            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.4, 1, 0.4],
              Extrapolation.CLAMP
            );
            return {
              width: widthAnim,
              opacity,
            };
          });

          return (
            <Animated.View
              key={index}
              style={[styles.dot, dotStyle]}
            />
          );
        })}
      </View>

      {/* Get Started Button - Only visible on last slide */}
      <View style={styles.footer}>
        {currentIndex === SLIDES.length - 1 && (
          <Animated.View entering={FadeInDown.springify()}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.champagneGold, colors.goldDark]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Get Started</Text>
                <Text style={styles.buttonIcon}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnightNavy,
  },
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  slideContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['4xl'],
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 48,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.lg,
    color: colors.gray200,
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.9,
  },
  pagination: {
    position: 'absolute',
    bottom: 140,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: spacing.xl,
    height: 60, // Reserve height for button to prevent layout shift
  },
  button: {
    borderRadius: 30,
    ...shadows.lg,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: 30,
    gap: spacing.sm,
  },
  buttonText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    letterSpacing: 0.5,
  },
  buttonIcon: {
    fontSize: 20,
    color: colors.midnightNavy,
    fontWeight: 'bold',
  },
});
