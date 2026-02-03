import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { SnackbarConfig, SnackbarType, useSnackbar } from '@/contexts/SnackbarContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SNACKBAR_MARGIN = spacing.lg;
const SWIPE_THRESHOLD_X = 80; // Horizontal swipe threshold
const SWIPE_THRESHOLD_Y = 50; // Vertical swipe threshold (swipe up to dismiss)

// Color palette for different snackbar types - Luxury "Obsidian Glass" aesthetic
const SNACKBAR_COLORS: Record<SnackbarType, {
  background: string;
  text: string;
  icon: string;
  progressBar: string;
  glow: string;
}> = {
  success: {
    background: 'rgba(46, 196, 182, 0.96)', // Vibrant Teal with higher opacity
    text: '#FFFFFF',
    icon: '#D4AF37', // Champagne Gold
    progressBar: '#D4AF37',
    glow: 'rgba(46, 196, 182, 0.5)',
  },
  error: {
    background: 'rgba(1, 22, 39, 0.92)', // Obsidian Glass (Midnight Navy) for errors too
    text: '#F9F7F2', // Parchment White
    icon: '#E2725B', // Bold Terracotta for error icon accent
    progressBar: '#E2725B',
    glow: 'rgba(226, 114, 91, 0.4)', // Terracotta glow for distinction
  },
  info: {
    background: 'rgba(1, 22, 39, 0.88)', // Obsidian glass (Midnight Navy) slightly more transparent
    text: '#F9F7F2', // Parchment White
    icon: '#D4AF37', // Champagne Gold
    progressBar: 'rgba(212, 175, 55, 0.7)',
    glow: 'rgba(212, 175, 55, 0.35)', // Gold glow
  },
  warning: {
    background: 'rgba(212, 175, 55, 0.96)', // Champagne Gold
    text: '#011627', // Midnight Navy text for contrast
    icon: '#011627',
    progressBar: '#011627',
    glow: 'rgba(212, 175, 55, 0.45)',
  },
};

interface SnackbarItemProps {
  config: SnackbarConfig;
  index: number;
  totalCount: number;
  onDismiss: (id: string) => void;
}

function SnackbarItem({ config, index, totalCount, onDismiss }: SnackbarItemProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = SNACKBAR_COLORS[config.type];

  // Animation values - start above screen (negative Y) for top positioning
  const translateY = useSharedValue(-100);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const progressWidth = useSharedValue(100);

  // For gesture handling
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  // Progress bar timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dismiss animation - slide up and out for top positioning
  const dismissSnackbar = () => {
    translateY.value = withTiming(-80, { duration: 180 });
    opacity.value = withTiming(0, { duration: 180 });
    scale.value = withTiming(0.9, { duration: 180 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)(config.id);
      }
    });
  };

  // Entry animation - slide down from top
  useEffect(() => {
    translateY.value = withSpring(0, {
      damping: 18,
      stiffness: 140,
      mass: 0.8,
    });
    opacity.value = withTiming(1, { duration: 250 });
    scale.value = withSpring(1, {
      damping: 14,
      stiffness: 160,
    });
  }, []);

  // Progress bar animation and auto-dismiss
  useEffect(() => {
    if (config.duration && config.duration > 0) {
      // Start progress bar animation
      progressWidth.value = withTiming(0, {
        duration: config.duration,
        easing: Easing.linear,
      });

      // Set timer for dismissal
      timerRef.current = setTimeout(() => {
        dismissSnackbar();
      }, config.duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.duration]);

  const dismissBySwipeHorizontal = (direction: 'left' | 'right') => {
    const targetX = direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH;
    translateX.value = withTiming(targetX, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)(config.id);
      }
    });
  };

  const dismissBySwipeUp = () => {
    // Swipe up dismisses to top
    translateY.value = withTiming(-150, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)(config.id);
      }
    });
  };

  // Pan gesture for swipe to dismiss - supports both horizontal and vertical (up) swipes
  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Allow horizontal movement
      translateX.value = contextX.value + event.translationX;
      // Only allow upward vertical movement (negative Y)
      if (event.translationY < 0) {
        translateY.value = contextY.value + event.translationY;
      }
    })
    .onEnd((event) => {
      const absX = Math.abs(event.translationX);
      const absY = Math.abs(event.translationY);

      // Check if swipe up exceeds threshold
      if (event.translationY < -SWIPE_THRESHOLD_Y && absY > absX) {
        runOnJS(dismissBySwipeUp)();
        return;
      }

      // Check horizontal swipe threshold
      if (absX > SWIPE_THRESHOLD_X && absX > absY) {
        runOnJS(dismissBySwipeHorizontal)(event.translationX < 0 ? 'left' : 'right');
        return;
      }

      // Bounce back to original position
      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 200,
      });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 200,
      });
    });

  // Stack offset calculation for multiple snackbars - stack downward from top
  // Newer notifications (higher index) appear at the top, older ones stack below
  const stackOffset = index * 8;
  const stackScale = 1 - index * 0.03;
  const stackOpacity = 1 - index * 0.15;

  const animatedContainerStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-5, 0, 5],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateY: translateY.value + stackOffset },
        { translateX: translateX.value },
        { scale: scale.value * stackScale },
        { rotateZ: `${rotateZ}deg` },
      ],
      opacity: opacity.value * stackOpacity,
      zIndex: totalCount - index, // Newer snackbars on top
    };
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  const handleActionPress = () => {
    if (config.action?.onPress) {
      config.action.onPress();
    }
    dismissSnackbar();
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.snackbarContainer,
          {
            // Position at top with safe area insets for status bar/notch
            top: insets.top + spacing.sm,
          },
          animatedContainerStyle,
        ]}
      >
        {/* Glow effect */}
        <View
          style={[
            styles.glowEffect,
            { backgroundColor: colorScheme.glow },
          ]}
        />

        {/* Main snackbar body - Luxury glass effect */}
        <BlurView
          intensity={
            config.type === 'info' || config.type === 'error' ? 45 : 25
          }
          tint={
            config.type === 'info' || config.type === 'error' ? 'dark' : 'light'
          }
          style={[
            styles.snackbarBody,
            {
              backgroundColor: colorScheme.background,
            },
          ]}
        >
          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Icon */}
            {config.icon && (
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colorScheme.icon + '20' },
                ]}
              >
                <Text style={[styles.icon, { color: colorScheme.icon }]}>
                  {config.icon}
                </Text>
              </View>
            )}

            {/* Message */}
            <Text
              style={[styles.message, { color: colorScheme.text }]}
              numberOfLines={2}
            >
              {config.message}
            </Text>

            {/* Action button */}
            {config.action && (
              <TouchableOpacity
                onPress={handleActionPress}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.actionText,
                    { color: colorScheme.icon },
                  ]}
                >
                  {config.action.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Progress bar */}
          {config.duration && config.duration > 0 && (
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { backgroundColor: colorScheme.progressBar },
                  animatedProgressStyle,
                ]}
              />
            </View>
          )}
        </BlurView>
      </Animated.View>
    </GestureDetector>
  );
}

export function SnackbarContainer() {
  const { snackbars, hideSnackbar } = useSnackbar();

  // Reverse the order so newest snackbars appear at the top
  const reversedSnackbars = [...snackbars].reverse();

  return (
    <>
      {reversedSnackbars.map((snackbar, index) => (
        <SnackbarItem
          key={snackbar.id}
          config={snackbar}
          index={index}
          totalCount={snackbars.length}
          onDismiss={hideSnackbar}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  snackbarContainer: {
    position: 'absolute',
    left: SNACKBAR_MARGIN,
    right: SNACKBAR_MARGIN,
    zIndex: 9999,
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: 8,
    right: 8,
    bottom: 4,
    borderRadius: borderRadius.full,
    opacity: 0.6,
  },
  snackbarBody: {
    width: '100%',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...shadows.lg,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
