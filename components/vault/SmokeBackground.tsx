import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SmokeLayer = ({ delay }: { delay: number }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.1);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Horizontal drift
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-30, { duration: 8000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Vertical drift
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
          withTiming(20, { duration: 10000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Pulsing opacity
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.2, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.05, { duration: 6000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Subtle scale
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 7000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.smokeLayer, animatedStyle]}>
      <LinearGradient
        colors={[
          'rgba(26, 26, 46, 0.8)',
          'rgba(46, 46, 66, 0.4)',
          'rgba(26, 26, 46, 0.8)',
        ]}
        style={styles.smokeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

// Helper function for withDelay
function withDelay(delay: number, animation: any) {
  'worklet';
  return withTiming(0, { duration: delay }, () => {
    'worklet';
    return animation;
  });
}

export function SmokeBackground() {
  return (
    <>
      {/* Base dark gradient */}
      <LinearGradient
        colors={['#0A0A0A', '#1A1A2E', '#16213E', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.7, 1]}
      />

      {/* Multiple smoke layers for depth */}
      <SmokeLayer delay={0} />
      <SmokeLayer delay={2000} />
      <SmokeLayer delay={4000} />

      {/* Subtle vignette */}
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.5)']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.2, 0.8, 1]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  smokeLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  smokeGradient: {
    flex: 1,
    transform: [{ rotate: '45deg' }, { scale: 1.5 }],
  },
});
