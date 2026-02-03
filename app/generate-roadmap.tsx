import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WeavingAnimation } from '@/components/roadmap/WeavingAnimation';
import { useRoadmap } from '@/hooks/useRoadmap';
import { colors, typography, spacing, borderRadius, shadows } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function GenerateRoadmapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dream?: string; rootMotivation?: string }>();
  const { createRoadmap } = useRoadmap();
  const [hasStarted, setHasStarted] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    instructions?: string;
    errorType?: string;
  } | null>(null);

  useEffect(() => {
    // Only run once
    if (hasStarted) return;

    const generateAndNavigate = async () => {
      try {
        const dream = params.dream;
        const rootMotivation = params.rootMotivation;

        if (!dream) {
          throw new Error('No dream provided');
        }

        setHasStarted(true);

        // Generate the roadmap
        const result = await createRoadmap(dream, rootMotivation);

        // Check if result is an error object (schema validation failed)
        if (result && typeof result === 'object' && 'error' in result) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setErrorDetails({
            message: result.message || 'Unable to create your roadmap',
            instructions: result.instructions,
            errorType: result.errorType,
          });
          setShowError(true);
          return;
        }

        if (!result) {
          throw new Error('Failed to generate roadmap');
        }

        // Success! Navigate to roadmap screen
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Small delay to let the user appreciate the animation
        setTimeout(() => {
          router.replace('/roadmap');
        }, 1500);
      } catch (error: any) {
        console.error('Roadmap generation failed:', error);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        setErrorDetails({
          message: error.message || 'Unable to create your roadmap. Please try again.',
        });
        setShowError(true);
      }
    };

    generateAndNavigate();
  }, [hasStarted, params.dream, params.rootMotivation, createRoadmap, router]);

  // Show error screen with premium styling
  if (showError && errorDetails) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.midnightNavy, colors.navyLight]}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView
          contentContainerStyle={styles.errorContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Error Icon */}
          <View style={styles.errorIconContainer}>
            <LinearGradient
              colors={[colors.boldTerracotta, colors.terracottaDark]}
              style={styles.errorIcon}
            >
              <Text style={styles.errorIconText}>!</Text>
            </LinearGradient>
          </View>

          {/* Error Title */}
          <Text style={styles.errorTitle}>
            {errorDetails.errorType === 'SCHEMA_OUTDATED'
              ? 'Database Update Required'
              : 'Unable to Create Roadmap'}
          </Text>

          {/* Error Message */}
          <Text style={styles.errorMessage}>{errorDetails.message}</Text>

          {/* Schema Instructions (if available) */}
          {errorDetails.instructions && (
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>How to Fix</Text>
              <Text style={styles.instructionsText}>{errorDetails.instructions}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {errorDetails.errorType === 'SCHEMA_OUTDATED' ? (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.replace('/(tabs)/profile');
                  }}
                >
                  <LinearGradient
                    colors={[colors.champagneGold, colors.goldDark]}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Go to Settings</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.replace('/(tabs)');
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Return to Home</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    // Try again by resetting the screen
                    setHasStarted(false);
                    setShowError(false);
                    setErrorDetails(null);
                  }}
                >
                  <LinearGradient
                    colors={[colors.champagneGold, colors.goldDark]}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Try Again</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.replace('/(tabs)');
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Return to Home</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Show loading animation
  return (
    <View style={styles.container}>
      <WeavingAnimation
        message="Crafting your Golden Path..."
        submessage="Weaving your personalized roadmap"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    paddingTop: spacing['4xl'],
  },
  errorIconContainer: {
    marginBottom: spacing.xl,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  errorIconText: {
    fontSize: 40,
    fontFamily: typography.fontFamily.heading,
    color: colors.white,
  },
  errorTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.champagneGold,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  errorMessage: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.parchmentWhite,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    opacity: 0.9,
  },
  instructionsCard: {
    backgroundColor: colors.white + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.champagneGold + '30',
    width: '100%',
  },
  instructionsTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.champagneGold,
    marginBottom: spacing.md,
  },
  instructionsText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.parchmentWhite,
    lineHeight: 20,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...shadows.lg,
  },
  buttonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.champagneGold + '50',
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.champagneGold,
  },
});
