import React, { useEffect, useRef, useState } from 'react';
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
const SNACKBAR_WIDTH = SCREEN_WIDTH - SNACKBAR_MARGIN * 2;
const SWIPE_THRESHOLD = 80;

// Color palette for different snackbar types
const SNACKBAR_COLORS: Record<SnackbarType, {
  background: string;
  text: string;
  icon: string;
  progressBar: string;
  glow: string;
}> = {
  success: {
    background: 'rgba(46, 196, 182, 0.95)', // Vibrant Teal
    text: '#FFFFFF',
    icon: '#D4AF37', // Champagne Gold
    progressBar: '#D4AF37',
    glow: 'rgba(46, 196, 182, 0.4)',
  },
  error: {
    background: 'rgba(176, 85, 75, 0.95)', // Muted Terracotta (softer than bold)
    text: '#FFFFFF',
    icon: '#F9F7F2',
    progressBar: '#F9F7F2',
    glow: 'rgba(176, 85, 75, 0.4)',
  },
  info: {
    background: 'rgba(1, 22, 39, 0.85)', // Obsidian glass (Midnight Navy)
    text: '#F9F7F2',
    icon: '#D4AF37',
    progressBar: 'rgba(212, 175, 55, 0.6)',
    glow: 'rgba(1, 22, 39, 0.3)',
  },
  warning: {
    background: 'rgba(212, 175, 55, 0.95)', // Champagne Gold
    text: '#011627',
    icon: '#011627',
    progressBar: '#011627',
    glow: 'rgba(212, 175, 55, 0.4)',
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

  // Animation values
  const translateY = useSharedValue(100);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const progressWidth = useSharedValue(100);

  // For gesture handling
  const contextX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  // Progress bar timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Entry animation
  useEffect(() => {
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 180,
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
  }, [config.duration]);

  const dismissSnackbar = () => {
    // Exit animation
    translateY.value = withTiming(-20, { duration: 150 });
    opacity.value = withTiming(0, { duration: 150 });
    scale.value = withTiming(0.9, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)(config.id);
      }
    });
  };

  const dismissBySwipe = (direction: 'left' | 'right') => {
    const targetX = direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH;
    translateX.value = withTiming(targetX, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)(config.id);
      }
    });
  };

  // Pan gesture for swipe to dismiss
  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
    })
    .onEnd((event) => {
      isGestureActive.value = false;

      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Swipe threshold exceeded - dismiss
        runOnJS(dismissBySwipe)(event.translationX < 0 ? 'left' : 'right');
      } else {
        // Bounce back
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 200,
        });
      }
    });

  // Stack offset calculation for multiple snackbars
  const stackOffset = (totalCount - 1 - index) * 8;
  const stackScale = 1 - (totalCount - 1 - index) * 0.05;

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
      opacity: opacity.value,
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
            bottom: insets.bottom + 90 + spacing.md, // Above tab bar
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

        {/* Main snackbar body */}
        <BlurView
          intensity={config.type === 'info' ? 40 : 20}
          tint={config.type === 'info' ? 'dark' : 'light'}
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

  return (
    <>
      {snackbars.map((snackbar, index) => (
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
    top: 4,
    left: 8,
    right: 8,
    bottom: -4,
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
