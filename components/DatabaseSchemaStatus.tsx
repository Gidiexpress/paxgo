import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '@/constants/theme';
import {
  validateRoadmapSchema,
  getSchemaFixInstructions,
} from '@/lib/schemaValidator';
import { Clipboard } from 'react-native';

interface DatabaseSchemaStatusProps {
  onClose?: () => void;
}

export function DatabaseSchemaStatus({ onClose }: DatabaseSchemaStatusProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [schemaStatus, setSchemaStatus] = useState<{
    isValid: boolean;
    message?: string;
    instructions?: string;
  } | null>(null);

  useEffect(() => {
    checkSchema();
  }, []);

  const checkSchema = async () => {
    setIsChecking(true);
    try {
      const validation = await validateRoadmapSchema();

      if (validation.isValid) {
        setSchemaStatus({
          isValid: true,
          message: 'Your database schema is up to date! ✨',
        });
      } else {
        const instructions = getSchemaFixInstructions(validation);
        setSchemaStatus({
          isValid: false,
          message: validation.errorMessage,
          instructions,
        });
      }
    } catch (error: any) {
      setSchemaStatus({
        isValid: false,
        message: `Error checking schema: ${error.message}`,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copyInstructions = async () => {
    if (schemaStatus?.instructions) {
      Clipboard.setString(schemaStatus.instructions);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Database Status</Text>
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {isChecking ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.champagneGold} />
            <Text style={styles.loadingText}>Checking database schema...</Text>
          </View>
        ) : (
          <>
            {/* Status Card */}
            <View
              style={[
                styles.statusCard,
                schemaStatus?.isValid ? styles.statusCardSuccess : styles.statusCardError,
              ]}
            >
              <View
                style={[
                  styles.statusIcon,
                  schemaStatus?.isValid
                    ? styles.statusIconSuccess
                    : styles.statusIconError,
                ]}
              >
                <Text style={styles.statusIconText}>
                  {schemaStatus?.isValid ? '✓' : '!'}
                </Text>
              </View>

              <Text
                style={[
                  styles.statusTitle,
                  schemaStatus?.isValid
                    ? styles.statusTitleSuccess
                    : styles.statusTitleError,
                ]}
              >
                {schemaStatus?.isValid ? 'Schema Up to Date' : 'Schema Update Needed'}
              </Text>

              <Text style={styles.statusMessage}>{schemaStatus?.message}</Text>
            </View>

            {/* Instructions (if schema is invalid) */}
            {!schemaStatus?.isValid && schemaStatus?.instructions && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>How to Fix</Text>

                <View style={styles.instructionsCard}>
                  <Text style={styles.instructionsText}>
                    {schemaStatus.instructions}
                  </Text>
                </View>

                {/* Copy Button */}
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyInstructions}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.champagneGold, colors.goldDark]}
                    style={styles.copyButtonGradient}
                  >
                    <Text style={styles.copyButtonText}>📋 Copy Instructions</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Additional Help */}
                <View style={styles.helpCard}>
                  <Text style={styles.helpTitle}>Need Help?</Text>
                  <Text style={styles.helpText}>
                    If you're not sure how to update your database, please contact support
                    or check the documentation in your Supabase dashboard.
                  </Text>
                </View>
              </View>
            )}

            {/* Check Again Button */}
            <TouchableOpacity
              style={styles.checkAgainButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                checkSchema();
              }}
            >
              <Text style={styles.checkAgainText}>🔄 Check Again</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  content: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontFamily: typography.fontFamily.body,
    fontSize: 18,
    color: colors.gray600,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  loadingText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    marginTop: spacing.lg,
  },
  statusCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  statusCardSuccess: {
    backgroundColor: colors.tealLight + '30',
    borderWidth: 1,
    borderColor: colors.vibrantTeal + '40',
  },
  statusCardError: {
    backgroundColor: colors.terracottaLight + '30',
    borderWidth: 1,
    borderColor: colors.boldTerracotta + '40',
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  statusIconSuccess: {
    backgroundColor: colors.vibrantTeal,
  },
  statusIconError: {
    backgroundColor: colors.boldTerracotta,
  },
  statusIconText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 32,
    color: colors.white,
  },
  statusTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  statusTitleSuccess: {
    color: colors.tealDark,
  },
  statusTitleError: {
    color: colors.terracottaDark,
  },
  statusMessage: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    textAlign: 'center',
    lineHeight: 22,
  },
  instructionsContainer: {
    marginBottom: spacing.xl,
  },
  instructionsTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.md,
  },
  instructionsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.md,
  },
  instructionsText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    lineHeight: 20,
  },
  copyButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  copyButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  copyButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  helpCard: {
    backgroundColor: colors.warmCream,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  helpTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
  },
  helpText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    lineHeight: 20,
  },
  checkAgainButton: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  checkAgainText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
  },
});
