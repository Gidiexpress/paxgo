import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '@/constants/theme';

interface WeavingAnimationProps {
  message?: string;
  submessage?: string;
}

export function WeavingAnimation({
  message = 'Crafting your Golden Path...',
  submessage = 'Gabby is weaving your personalized strategy'
}: WeavingAnimationProps) {
  // Animation values for threads
  const thread1Progress = useSharedValue(0);
  const thread2Progress = useSharedValue(0);
  const thread3Progress = useSharedValue(0);
  const thread4Progress = useSharedValue(0);

  // Rotation for the center orb
  const orbRotation = useSharedValue(0);
  const orbScale = useSharedValue(1);

  // Shimmer effect
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    // Weaving threads animation - staggered
    thread1Progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withDelay(500, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );

    thread2Progress.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withDelay(500, withTiming(0, { duration: 0 }))
        ),
        -1,
        false
      )
    );

    thread3Progress.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withDelay(500, withTiming(0, { duration: 0 }))
        ),
        -1,
        false
      )
    );

    thread4Progress.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withDelay(500, withTiming(0, { duration: 0 }))
        ),
        -1,
        false
      )
    );

    // Orb rotation
    orbRotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    // Orb breathing
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Shimmer effect
    shimmerProgress.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Thread animated styles
  const thread1Style = useAnimatedStyle(() => ({
    opacity: thread1Progress.value,
    transform: [
      { translateX: interpolate(thread1Progress.value, [0, 1], [-100, 100]) },
      { translateY: interpolate(thread1Progress.value, [0, 0.5, 1], [0, -30, 0]) },
    ],
  }));

  const thread2Style = useAnimatedStyle(() => ({
    opacity: thread2Progress.value,
    transform: [
      { translateX: interpolate(thread2Progress.value, [0, 1], [100, -100]) },
      { translateY: interpolate(thread2Progress.value, [0, 0.5, 1], [0, 30, 0]) },
    ],
  }));

  const thread3Style = useAnimatedStyle(() => ({
    opacity: thread3Progress.value,
    transform: [
      { translateX: interpolate(thread3Progress.value, [0, 1], [-80, 80]) },
      { translateY: interpolate(thread3Progress.value, [0, 0.5, 1], [0, 40, 0]) },
    ],
  }));

  const thread4Style = useAnimatedStyle(() => ({
    opacity: thread4Progress.value,
    transform: [
      { translateX: interpolate(thread4Progress.value, [0, 1], [80, -80]) },
      { translateY: interpolate(thread4Progress.value, [0, 0.5, 1], [0, -40, 0]) },
    ],
  }));

  // Orb animated style
  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${orbRotation.value}deg` },
      { scale: orbScale.value },
    ],
  }));

  // Shimmer animated style
  const shimmerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      shimmerProgress.value,
      [0, 0.5, 1],
      [colors.vibrantTeal, colors.champagneGold, colors.vibrantTeal]
    );

    return {
      backgroundColor,
      opacity: interpolate(shimmerProgress.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
    };
  });

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.midnightNavy, colors.navyLight, colors.midnightNavy]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient shimmer layer */}
      <Animated.View style={[styles.shimmerLayer, shimmerStyle]} />

      {/* Weaving threads container */}
      <View style={styles.weavingContainer}>
        {/* Animated threads */}
        <Animated.View style={[styles.thread, styles.thread1, thread1Style]}>
          <LinearGradient
            colors={[colors.vibrantTeal, colors.tealLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.threadGradient}
          />
        </Animated.View>

        <Animated.View style={[styles.thread, styles.thread2, thread2Style]}>
          <LinearGradient
            colors={[colors.champagneGold, colors.goldLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.threadGradient}
          />
        </Animated.View>

        <Animated.View style={[styles.thread, styles.thread3, thread3Style]}>
          <LinearGradient
            colors={[colors.vibrantTeal + '80', colors.tealLight + '80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.threadGradient}
          />
        </Animated.View>

        <Animated.View style={[styles.thread, styles.thread4, thread4Style]}>
          <LinearGradient
            colors={[colors.champagneGold + '80', colors.goldLight + '80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.threadGradient}
          />
        </Animated.View>

        {/* Center orb */}
        <Animated.View style={[styles.orb, orbStyle]}>
          <LinearGradient
            colors={[colors.vibrantTeal, colors.champagneGold, colors.vibrantTeal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orbGradient}
          >
            <Text style={styles.orbIcon}>✨</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.submessage}>{submessage}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  weavingContainer: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  thread: {
    position: 'absolute',
    height: 3,
    width: 200,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  thread1: {
    top: '30%',
  },
  thread2: {
    top: '45%',
  },
  thread3: {
    top: '55%',
  },
  thread4: {
    top: '70%',
  },
  threadGradient: {
    flex: 1,
  },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: colors.champagneGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  orbGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbIcon: {
    fontSize: 40,
  },
  messageContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  message: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  submessage: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
});
