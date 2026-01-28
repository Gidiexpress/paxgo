import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { DeepDiveProgress } from '@/types';

interface ActiveDeepDiveBannerProps {
  deepDive: DeepDiveProgress;
  onPress: () => void;
}

export function ActiveDeepDiveBanner({ deepDive, onPress }: ActiveDeepDiveBannerProps) {
  const pulseOpacity = useSharedValue(1);

  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const completedSteps = deepDive.tinySteps.filter(s => s.isCompleted).length;
  const totalSteps = deepDive.tinySteps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View entering={FadeInDown.springify()} exiting={FadeOut}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.95}>
        <View style={styles.container}>
          <LinearGradient
            colors={[colors.boldTerracotta, colors.terracottaDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            {/* Pulse indicator */}
            <Animated.View style={[styles.pulseIndicator, pulseStyle]} />

            <View style={styles.content}>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Continue Your Deep Dive</Text>
                <Text style={styles.actionTitle} numberOfLines={1}>
                  {deepDive.actionTitle}
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {completedSteps}/{totalSteps}
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>

              <View style={styles.arrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  gradient: {
    padding: spacing.lg,
    position: 'relative',
  },
  pulseIndicator: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.champagneGold,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  label: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
    marginTop: 2,
  },
  progressContainer: {
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  progressText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.champagneGold,
    borderRadius: 2,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: 'bold',
  },
});
