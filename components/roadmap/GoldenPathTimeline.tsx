import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GoldenPathTimelineProps {
  totalSteps: number;
  completedSteps: number;
  style?: object;
}

export function GoldenPathTimeline({
  totalSteps,
  completedSteps,
  style,
}: GoldenPathTimelineProps) {
  const progress = totalSteps > 0 ? completedSteps / totalSteps : 0;

  return (
    <View style={[styles.container, style]}>
      {/* Background dotted line */}
      <View style={styles.dottedLineContainer}>
        {Array.from({ length: 20 }).map((_, index) => (
          <View key={index} style={styles.dot} />
        ))}
      </View>

      {/* Gold progress line */}
      <Animated.View style={[styles.progressLineContainer, { height: `${progress * 100}%` }]}>
        <LinearGradient
          colors={[colors.goldLight, colors.champagneGold, colors.goldDark]}
          style={styles.progressLine}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        {/* Shimmer effect */}
        <View style={styles.shimmerContainer}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
            style={styles.shimmer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>
      </Animated.View>
    </View>
  );
}

// Vertical timeline with nodes for each action
interface TimelineNodeProps {
  index: number;
  isCompleted: boolean;
  isActive: boolean;
  totalNodes: number;
}

export function TimelineNode({ index, isCompleted, isActive, totalNodes }: TimelineNodeProps) {
  return (
    <View style={styles.nodeContainer}>
      {/* Connecting line above (if not first) */}
      {index > 0 && (
        <View style={[styles.connectingLine, isCompleted && styles.connectingLineCompleted]} />
      )}

      {/* Node circle */}
      <View
        style={[
          styles.nodeCircle,
          isCompleted && styles.nodeCircleCompleted,
          isActive && styles.nodeCircleActive,
        ]}
      >
        {isCompleted && (
          <LinearGradient
            colors={[colors.goldLight, colors.champagneGold]}
            style={styles.nodeGradient}
          />
        )}
      </View>

      {/* Connecting line below (if not last) */}
      {index < totalNodes - 1 && (
        <View
          style={[styles.connectingLineBelow, isCompleted && styles.connectingLineCompleted]}
        />
      )}
    </View>
  );
}

// Full timeline with all nodes
interface FullTimelineProps {
  completedIndices: number[];
  activeIndex: number;
  totalNodes: number;
  nodeSpacing?: number;
}

export function FullTimeline({
  completedIndices,
  activeIndex,
  totalNodes,
  nodeSpacing = 140,
}: FullTimelineProps) {
  const totalHeight = (totalNodes - 1) * nodeSpacing;
  const completedCount = completedIndices.length;
  const progress = totalNodes > 0 ? completedCount / totalNodes : 0;

  return (
    <View style={[styles.fullTimelineContainer, { height: totalHeight + 40 }]}>
      {/* Background dotted line */}
      <View style={styles.fullDottedLine}>
        {Array.from({ length: Math.ceil(totalHeight / 12) }).map((_, i) => (
          <View key={i} style={styles.fullDot} />
        ))}
      </View>

      {/* Gold progress line */}
      <View
        style={[
          styles.fullProgressLine,
          { height: progress * totalHeight },
        ]}
      >
        <LinearGradient
          colors={[colors.goldLight, colors.champagneGold]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Node circles */}
      {Array.from({ length: totalNodes }).map((_, index) => {
        const isCompleted = completedIndices.includes(index);
        const isActive = index === activeIndex;
        const top = index * nodeSpacing;

        return (
          <View
            key={index}
            style={[styles.fullNodePosition, { top }]}
          >
            <View
              style={[
                styles.fullNodeCircle,
                isCompleted && styles.fullNodeCompleted,
                isActive && !isCompleted && styles.fullNodeActive,
              ]}
            >
              {isCompleted && (
                <View style={styles.fullNodeInner}>
                  <LinearGradient
                    colors={[colors.goldLight, colors.champagneGold]}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              )}
              {isActive && !isCompleted && (
                <View style={styles.fullNodePulse} />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  dottedLineContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
  },
  progressLineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  progressLine: {
    flex: 1,
    width: 4,
    borderRadius: 2,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmer: {
    flex: 1,
  },

  // Timeline Node styles
  nodeContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  connectingLine: {
    width: 3,
    height: 60,
    backgroundColor: colors.gray300,
  },
  connectingLineBelow: {
    width: 3,
    height: 60,
    backgroundColor: colors.gray300,
  },
  connectingLineCompleted: {
    backgroundColor: colors.champagneGold,
  },
  nodeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray200,
    borderWidth: 3,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nodeCircleCompleted: {
    borderColor: colors.champagneGold,
    backgroundColor: 'transparent',
  },
  nodeCircleActive: {
    borderColor: colors.boldTerracotta,
    backgroundColor: colors.parchmentWhite,
  },
  nodeGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  // Full Timeline styles
  fullTimelineContainer: {
    width: 40,
    position: 'relative',
    alignItems: 'center',
  },
  fullDottedLine: {
    position: 'absolute',
    top: 12,
    bottom: 12,
    width: 3,
    alignItems: 'center',
    gap: 8,
  },
  fullDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.gray300,
  },
  fullProgressLine: {
    position: 'absolute',
    top: 12,
    width: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  fullNodePosition: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fullNodeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.parchmentWhite,
    borderWidth: 3,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullNodeCompleted: {
    borderColor: colors.champagneGold,
    backgroundColor: 'transparent',
  },
  fullNodeActive: {
    borderColor: colors.boldTerracotta,
  },
  fullNodeInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  fullNodePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.boldTerracotta,
    opacity: 0.6,
  },
});
