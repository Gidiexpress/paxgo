import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface ConfettiPieceProps {
  index: number;
  color: string;
  onComplete?: () => void;
  isLast?: boolean;
}

function ConfettiPiece({ index, color, onComplete, isLast }: ConfettiPieceProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  const startX = Math.random() * width;
  const endX = startX + (Math.random() - 0.5) * 100;
  const delay = Math.random() * 300;
  const duration = 2000 + Math.random() * 1000;

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withTiming(1, { duration: 200 })
    );

    translateY.value = withDelay(
      delay,
      withTiming(height + 100, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    translateX.value = withDelay(
      delay,
      withSequence(
        withTiming(30, { duration: duration / 4 }),
        withTiming(-30, { duration: duration / 4 }),
        withTiming(20, { duration: duration / 4 }),
        withTiming(endX - startX, { duration: duration / 4 })
      )
    );

    rotate.value = withDelay(
      delay,
      withTiming(720 + Math.random() * 360, {
        duration,
        easing: Easing.linear,
      })
    );

    opacity.value = withDelay(
      delay + duration - 500,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished && isLast && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const shapes = ['square', 'rectangle', 'circle'];
  const shape = shapes[index % 3];

  const pieceStyle = [
    styles.piece,
    { backgroundColor: color },
    shape === 'square' && styles.square,
    shape === 'rectangle' && styles.rectangle,
    shape === 'circle' && styles.circle,
  ];

  return <Animated.View style={[pieceStyle, animatedStyle]} />;
}

interface ConfettiAnimationProps {
  active: boolean;
  onComplete?: () => void;
  count?: number;
}

export function ConfettiAnimation({
  active,
  onComplete,
  count = 50,
}: ConfettiAnimationProps) {
  const confettiColors = [
    colors.boldTerracotta,
    colors.champagneGold,
    colors.vibrantTeal,
    colors.terracottaLight,
    colors.goldLight,
    colors.tealLight,
    '#FF6B6B',
    '#4ECDC4',
    '#FFE66D',
  ];

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: count }).map((_, index) => (
        <ConfettiPiece
          key={index}
          index={index}
          color={confettiColors[index % confettiColors.length]}
          onComplete={onComplete}
          isLast={index === count - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  piece: {
    position: 'absolute',
  },
  square: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  rectangle: {
    width: 6,
    height: 14,
    borderRadius: 1,
  },
  circle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
