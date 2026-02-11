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
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, shadows, borderRadius } from '@/constants/theme';
import { RoadmapAction } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { ConfettiAnimation } from '@/components/ConfettiAnimation';
import { SnackbarItem } from '@/components/Snackbar';
import { SnackbarConfig } from '@/contexts/SnackbarContext';

interface FocusModeModalProps {
  visible: boolean;
  action: RoadmapAction | null;
  onClose: () => void;
  onComplete: (actionId: string) => void;
  onSubActionComplete?: (subActionId: string) => Promise<void>;
  onRefine: (actionId: string, feedback?: string) => void;
  onBreakDown: (actionId: string) => void;
  onCaptureProof: (actionId: string) => void;
  isRefining?: boolean;
  isBreakingDown?: boolean;
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
  onSubActionComplete,
  onRefine,
  onBreakDown,
  onCaptureProof,
  isRefining = false,
  isBreakingDown = false,
  hasProof = false,
}: FocusModeModalProps) {
  const insets = useSafeAreaInsets();
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState('');
  const [expandedSubActionId, setExpandedSubActionId] = useState<string | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [showMiniConfetti, setShowMiniConfetti] = useState(false);
  const [localSnackbar, setLocalSnackbar] = useState<SnackbarConfig | null>(null);

  if (!action) return null;

  const categoryIcon = CATEGORY_ICONS[action.category || 'action'] || '⚡';

  // Check if all sub-actions are completed (for Option B logic)
  const hasIncompleteSubActions = action.subActions && action.subActions.length > 0 &&
    action.subActions.some(sa => !sa.is_completed);

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

  const handleBreakDown = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onBreakDown(action.id);
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
            entering={SlideInDown.duration(300)}
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
                        <Text style={styles.avatarText}>✨</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.tipHeaderText}>
                      <Text style={styles.tipName}>Coach&apos;s Insight</Text>
                      <Text style={styles.tipSubtitle}>How to do this with grace</Text>
                    </View>
                  </View>
                  <Text style={styles.tipText}>{action.gabby_tip}</Text>
                </Animated.View>
              )}

              {/* Sub-Actions Checklist */}
              {action.subActions && action.subActions.length > 0 && (
                <View style={styles.subActionsCard}>
                  <View style={styles.subActionsHeader}>
                    <Text style={styles.subActionsIcon}>✓</Text>
                    <Text style={styles.subActionsTitle}>Small Steps to Complete</Text>
                    <Text style={styles.subActionsProgress}>
                      {action.subActions?.filter(sa => sa.is_completed).length || 0}/{action.subActions?.length || 0}
                    </Text>
                  </View>

                  {action.subActions?.map((subAction, index) => {
                    const isExpanded = expandedSubActionId === subAction.id;
                    const isCompleted = subAction.is_completed;
                    const isJustCompleted = justCompletedId === subAction.id;

                    return (
                      <View key={subAction.id} style={styles.subActionItemContainer}>
                        {/* Sub-action header (always visible) */}
                        <View style={styles.subActionItem}>
                          <View style={[
                            styles.subActionCheckbox,
                            isCompleted && styles.subActionCheckboxCompleted
                          ]}>
                            {isCompleted && (
                              <Text style={styles.subActionCheckmark}>✓</Text>
                            )}
                          </View>

                          <TouchableOpacity
                            style={styles.subActionContent}
                            onPress={() => setExpandedSubActionId(isExpanded ? null : subAction.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.subActionTitle,
                              isCompleted && styles.subActionTitleCompleted
                            ]}>
                              {subAction.title}
                            </Text>
                            {subAction.duration_minutes && (
                              <Text style={styles.subActionDuration}>
                                {subAction.duration_minutes} min
                              </Text>
                            )}
                          </TouchableOpacity>

                          {/* Do This Now or expand/collapse button */}
                          {!isCompleted && (
                            <TouchableOpacity
                              onPress={() => setExpandedSubActionId(isExpanded ? null : subAction.id)}
                              style={styles.doThisNowButton}
                            >
                              <Text style={styles.doThisNowText}>
                                {isExpanded ? 'Hide ▲' : 'Do This Now →'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Expanded detail view */}
                        {isExpanded && (
                          <Animated.View
                            entering={FadeIn.duration(200)}
                            exiting={FadeOut.duration(150)}
                            style={styles.subActionExpanded}
                          >
                            <Text style={styles.subActionExpandedText}>
                              {subAction.description && subAction.description.trim() !== ''
                                ? subAction.description
                                : "No details available for this step."}
                            </Text>
                            <TouchableOpacity
                              onPress={async () => {
                                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                setJustCompletedId(subAction.id);
                                setExpandedSubActionId(null);

                                // Show mini confetti celebration
                                setShowMiniConfetti(true);

                                // Show local snackbar
                                setLocalSnackbar({
                                  id: Date.now().toString(),
                                  type: 'success',
                                  message: 'Tiny step complete! One step closer. 🚀',
                                  duration: 3000,
                                });

                                // Call the sub-action completion handler (doesn't close modal)
                                if (onSubActionComplete) {
                                  await onSubActionComplete(subAction.id);
                                }

                                // Clear celebration after 2 seconds
                                setTimeout(() => {
                                  setJustCompletedId(null);
                                  setShowMiniConfetti(false);
                                }, 2000);
                              }}
                              style={styles.markStepCompleteButton}
                            >
                              <LinearGradient
                                colors={[colors.vibrantTeal, colors.vibrantTeal + 'DD']}
                                style={styles.markStepCompleteGradient}
                              >
                                <Text style={styles.markStepCompleteText}>✓ Mark This Step Complete</Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          </Animated.View>
                        )}
                      </View>
                    );
                  })}
                </View>
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
                  <View style={styles.secondaryActions}>
                    {/* Break It Down - only show if no sub-actions exist */}
                    {(!action.subActions || action.subActions.length === 0) && (
                      <TouchableOpacity
                        onPress={handleBreakDown}
                        style={styles.breakDownButton}
                        disabled={isBreakingDown}
                      >
                        {isBreakingDown ? (
                          <ActivityIndicator size="small" color={colors.vibrantTeal} />
                        ) : (
                          <>
                            <Text style={styles.breakDownIcon}>🔻</Text>
                            <Text style={styles.breakDownText}>Break It Down</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Complete Button */}
                  <TouchableOpacity
                    onPress={handleComplete}
                    style={[styles.completeButton, hasIncompleteSubActions && styles.completeButtonDisabled]}
                    activeOpacity={hasIncompleteSubActions ? 1 : 0.9}
                    disabled={hasIncompleteSubActions}
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

          {/* Mini Confetti for sub-action completion */}
          <ConfettiAnimation
            active={showMiniConfetti}
            onComplete={() => setShowMiniConfetti(false)}
          />

          {/* Local Snackbar for Modal */}
          {localSnackbar && (
            <View style={styles.localSnackbarContainer} pointerEvents="box-none">
              <SnackbarItem
                config={localSnackbar}
                index={0}
                totalCount={1}
                onDismiss={() => setLocalSnackbar(null)}
              />
            </View>
          )}
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
    maxHeight: '95%',
    minHeight: '85%',
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
  localSnackbarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
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
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  breakDownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.vibrantTeal + '15',
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  breakDownIcon: {
    fontSize: 14,
  },
  breakDownText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.vibrantTeal,
  },
  refineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.boldTerracotta + '10',
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  refineIcon: {
    fontSize: 14,
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
  completeButtonDisabled: {
    opacity: 0.5,
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
  // Sub-Actions Styles
  subActionsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.vibrantTeal + '30',
    ...shadows.sm,
  },
  subActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  subActionsIcon: {
    fontSize: 16,
  },
  subActionsTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  subActionsProgress: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.vibrantTeal,
  },
  subActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: spacing.md,
  },
  subActionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subActionCheckboxCompleted: {
    backgroundColor: colors.vibrantTeal,
    borderColor: colors.vibrantTeal,
  },
  subActionCheckmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  subActionContent: {
    flex: 1,
  },
  subActionTitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    lineHeight: 20,
  },
  subActionTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.gray500,
  },
  subActionDuration: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs / 2,
  },
  // Expandable sub-action styles
  subActionItemContainer: {
    marginBottom: spacing.xs,
  },
  doThisNowButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.vibrantTeal + '15',
    borderRadius: borderRadius.lg,
  },
  doThisNowText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.vibrantTeal,
  },
  subActionExpanded: {
    marginTop: spacing.sm,
    marginLeft: 36, // Align with title (checkbox width + gap)
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  subActionExpandedText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  markStepCompleteButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  markStepCompleteGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markStepCompleteText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
});
