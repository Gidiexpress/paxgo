import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, shadows, borderRadius } from '@/constants/theme';
import { RoadmapAction } from '@/types/database';
import { Button } from '@/components/ui/Button';

interface FocusModeModalProps {
  visible: boolean;
  action: RoadmapAction | null;
  onClose: () => void;
  onComplete: (actionId: string) => void;
  onRefine: (actionId: string, feedback?: string) => void;
  onCaptureProof: (actionId: string) => void;
  isRefining?: boolean;
  hasProof?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  research: '🔍',
  planning: '📝',
  action: '⚡',
  reflection: '🪷',
  connection: '🤝',
};

export function FocusModeModal({
  visible,
  action,
  onClose,
  onComplete,
  onRefine,
  onCaptureProof,
  isRefining = false,
  hasProof = false,
}: FocusModeModalProps) {
  const insets = useSafeAreaInsets();
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState('');

  if (!action) return null;

  const categoryIcon = CATEGORY_ICONS[action.category || 'action'] || '⚡';

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete(action.id);
  };

  const handleRefine = async () => {
    if (showRefineInput && refineFeedback.trim()) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onRefine(action.id, refineFeedback);
      setRefineFeedback('');
      setShowRefineInput(false);
    } else {
      setShowRefineInput(true);
    }
  };

  const handleCaptureProof = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCaptureProof(action.id);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint="dark" style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />

          <Animated.View
            entering={SlideInDown.springify().damping(18)}
            style={[styles.modalContainer, { paddingBottom: insets.bottom + spacing.lg }]}
          >
            {/* Header with close button */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerIcon}>{categoryIcon}</Text>
                <Text style={styles.headerCategory}>
                  {action.category ? action.category.charAt(0).toUpperCase() + action.category.slice(1) : 'Action'}
                </Text>
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{action.duration_minutes || 15} min</Text>
              </View>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentInner}
              showsVerticalScrollIndicator={false}
            >
              {/* Title */}
              <Animated.Text entering={FadeInUp.delay(100)} style={styles.title}>
                {action.title}
              </Animated.Text>

              {/* Description */}
              {action.description && (
                <Animated.Text entering={FadeInUp.delay(150)} style={styles.description}>
                  {action.description}
                </Animated.Text>
              )}

              {/* Why It Matters Card */}
              {action.why_it_matters && (
                <Animated.View entering={FadeInUp.delay(200)} style={styles.whyCard}>
                  <LinearGradient
                    colors={[colors.warmCream, colors.parchmentWhite]}
                    style={styles.whyGradient}
                  >
                    <View style={styles.whyHeader}>
                      <Text style={styles.whyIcon}>💫</Text>
                      <Text style={styles.whyLabel}>Why This Matters</Text>
                    </View>
                    <Text style={styles.whyText}>{action.why_it_matters}</Text>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* Gabby's Tip Card */}
              {action.gabby_tip && (
                <Animated.View entering={FadeInUp.delay(250)} style={styles.tipCard}>
                  <View style={styles.tipHeader}>
                    <View style={styles.gabbyAvatar}>
                      <LinearGradient
                        colors={[colors.boldTerracotta, colors.terracottaDark]}
                        style={styles.avatarGradient}
                      >
                        <Text style={styles.avatarText}>G</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.tipHeaderText}>
                      <Text style={styles.tipName}>Gabby&apos;s Tip</Text>
                      <Text style={styles.tipSubtitle}>How to do this with grace</Text>
                    </View>
                  </View>
                  <Text style={styles.tipText}>{action.gabby_tip}</Text>
                </Animated.View>
              )}

              {/* Refine Input */}
              {showRefineInput && (
                <Animated.View entering={FadeIn} style={styles.refineInputContainer}>
                  <Text style={styles.refineLabel}>
                    What doesn&apos;t feel right about this action?
                  </Text>
                  <TextInput
                    style={styles.refineInput}
                    placeholder="It feels too big, too vague, not relevant..."
                    placeholderTextColor={colors.gray400}
                    value={refineFeedback}
                    onChangeText={setRefineFeedback}
                    multiline
                    numberOfLines={3}
                    autoFocus
                  />
                </Animated.View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actions}>
              {action.is_completed ? (
                <>
                  <View style={styles.completedBadge}>
                    <LinearGradient
                      colors={[colors.goldLight, colors.champagneGold]}
                      style={styles.completedGradient}
                    >
                      <Text style={styles.completedIcon}>✓</Text>
                      <Text style={styles.completedText}>Completed</Text>
                    </LinearGradient>
                  </View>
                  {hasProof ? (
                    <View style={styles.proofCapturedBadge}>
                      <Text style={styles.proofCapturedIcon}>📸</Text>
                      <Text style={styles.proofCapturedText}>Proof Captured</Text>
                      <TouchableOpacity onPress={handleCaptureProof}>
                        <Text style={styles.addAnotherText}>Add another</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Button
                      title="Capture the Proof"
                      onPress={handleCaptureProof}
                      variant="gold"
                      gradient
                      style={styles.proofButton}
                    />
                  )}
                </>
              ) : (
                <>
                  {/* Refine with Gabby */}
                  <TouchableOpacity
                    onPress={handleRefine}
                    style={styles.refineButton}
                    disabled={isRefining}
                  >
                    {isRefining ? (
                      <ActivityIndicator size="small" color={colors.boldTerracotta} />
                    ) : (
                      <>
                        <Text style={styles.refineIcon}>✨</Text>
                        <Text style={styles.refineText}>
                          {showRefineInput ? 'Send to Gabby' : 'Refine with Gabby'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Complete Button */}
                  <TouchableOpacity
                    onPress={handleComplete}
                    style={styles.completeButton}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={[colors.boldTerracotta, colors.terracottaDark]}
                      style={styles.completeGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.completeText}>Mark Complete</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: colors.parchmentWhite,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    maxHeight: '90%',
    ...shadows.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: colors.gray600,
    fontWeight: '500',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIcon: {
    fontSize: 18,
  },
  headerCategory: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  durationBadge: {
    backgroundColor: colors.midnightNavy + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  durationText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.midnightNavy,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    lineHeight: 32,
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  whyCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  whyGradient: {
    padding: spacing.lg,
  },
  whyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  whyIcon: {
    fontSize: 16,
  },
  whyLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
  },
  whyText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  tipCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.boldTerracotta + '30',
    ...shadows.sm,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  gabbyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  avatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 18,
    color: colors.white,
  },
  tipHeaderText: {
    flex: 1,
  },
  tipName: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  tipSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  tipText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    lineHeight: 24,
  },
  refineInputContainer: {
    marginTop: spacing.lg,
  },
  refineLabel: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    marginBottom: spacing.sm,
  },
  refineInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: spacing.md,
  },
  refineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  refineIcon: {
    fontSize: 16,
  },
  refineText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
  },
  completeButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  completeGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  completedBadge: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  completedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  completedIcon: {
    fontSize: 18,
    color: colors.midnightNavy,
  },
  completedText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  proofButton: {
    marginTop: spacing.sm,
  },
  proofCapturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.vibrantTeal + '15',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  proofCapturedIcon: {
    fontSize: 18,
  },
  proofCapturedText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.vibrantTeal,
  },
  addAnotherText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
    marginLeft: spacing.sm,
    textDecorationLine: 'underline',
  },
});
