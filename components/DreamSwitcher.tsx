import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Dream, DREAM_CATEGORIES } from '@/types/dreams';

interface DreamSwitcherProps {
  dreams: Dream[];
  activeDreamId: string | null;
  onSwitchDream: (dreamId: string) => void;
  onNewDream: () => void;
}

export function DreamSwitcher({
  dreams,
  activeDreamId,
  onSwitchDream,
  onNewDream,
}: DreamSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeDream = dreams.find((d) => d.id === activeDreamId);
  const categoryInfo = activeDream ? DREAM_CATEGORIES[activeDream.category] : null;

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(true);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(false);
  };

  const handleSelectDream = (dreamId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwitchDream(dreamId);
    setIsOpen(false);
  };

  const handleNewDream = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOpen(false);
    onNewDream();
  };

  if (dreams.length === 0) {
    return (
      <TouchableOpacity onPress={onNewDream} style={styles.emptyContainer}>
        <LinearGradient
          colors={[colors.champagneGold + '20', colors.goldLight + '10']}
          style={styles.emptyGradient}
        >
          <Text style={styles.emptyIcon}>🌟</Text>
          <Text style={styles.emptyTitle}>Start Your First Dream</Text>
          <Text style={styles.emptySubtitle}>Tap to begin your journey</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <>
      {/* Current Dream Card */}
      <TouchableOpacity onPress={handleOpen} style={styles.currentDreamCard}>
        <LinearGradient
          colors={categoryInfo?.gradient || [colors.midnightNavy, colors.navyLight]}
          style={styles.currentDreamGradient}
        >
          <View style={styles.currentDreamContent}>
            <View style={styles.currentDreamInfo}>
              <Text style={styles.currentDreamIcon}>
                {categoryInfo?.icon || '🎯'}
              </Text>
              <View style={styles.currentDreamText}>
                <Text style={styles.currentDreamLabel}>Active Dream</Text>
                <Text style={styles.currentDreamTitle} numberOfLines={1}>
                  {activeDream?.title || 'No dream selected'}
                </Text>
              </View>
            </View>
            <View style={styles.switchButton}>
              <Text style={styles.switchIcon}>⇄</Text>
            </View>
          </View>

          {/* Progress bar */}
          {activeDream && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${activeDream.progress.totalActions > 0 ? (activeDream.progress.completedActions / activeDream.progress.totalActions) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {activeDream.progress.completedActions} / {activeDream.progress.totalActions} actions
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Dream Switcher Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <BlurView intensity={80} style={styles.modalOverlay} tint="dark">
          <Pressable style={styles.modalBackdrop} onPress={handleClose} />

          <Animated.View entering={FadeInDown.springify()} style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Dreams</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Dream List */}
            <ScrollView
              style={styles.dreamList}
              showsVerticalScrollIndicator={false}
            >
              {dreams.map((dream, index) => {
                const category = DREAM_CATEGORIES[dream.category];
                const isActive = dream.id === activeDreamId;

                return (
                  <Animated.View
                    key={dream.id}
                    entering={FadeInDown.delay(index * 50)}
                  >
                    <TouchableOpacity
                      onPress={() => handleSelectDream(dream.id)}
                      style={[
                        styles.dreamItem,
                        isActive && styles.dreamItemActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.dreamIconContainer,
                          { backgroundColor: category.gradient[0] + '20' },
                        ]}
                      >
                        <Text style={styles.dreamIcon}>{category.icon}</Text>
                      </View>

                      <View style={styles.dreamInfo}>
                        <Text style={styles.dreamTitle} numberOfLines={1}>
                          {dream.title}
                        </Text>
                        <Text style={styles.dreamCategory}>{category.title}</Text>
                        <View style={styles.dreamStats}>
                          <Text style={styles.dreamStat}>
                            🔥 {dream.progress.currentStreak} streak
                          </Text>
                          <Text style={styles.dreamStat}>
                            ✅ {dream.progress.completedActions} done
                          </Text>
                        </View>
                      </View>

                      {isActive && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>

            {/* New Dream Button */}
            <TouchableOpacity onPress={handleNewDream} style={styles.newDreamButton}>
              <LinearGradient
                colors={[colors.champagneGold, colors.goldDark]}
                style={styles.newDreamGradient}
              >
                <Text style={styles.newDreamIcon}>+</Text>
                <Text style={styles.newDreamText}>Add New Dream</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  emptyGradient: {
    padding: spacing['2xl'],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.champagneGold + '40',
    borderStyle: 'dashed',
    borderRadius: borderRadius['2xl'],
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  currentDreamCard: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  currentDreamGradient: {
    padding: spacing.lg,
  },
  currentDreamContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentDreamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currentDreamIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  currentDreamText: {
    flex: 1,
  },
  currentDreamLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.white + '80',
    marginBottom: 2,
  },
  currentDreamTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.white,
  },
  switchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchIcon: {
    fontSize: 18,
    color: colors.white,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.white + '30',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  progressText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.white + '80',
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: colors.parchmentWhite,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    maxHeight: '80%',
    paddingBottom: spacing['4xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: colors.gray600,
    lineHeight: 26,
  },
  dreamList: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    maxHeight: 400,
  },
  dreamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  dreamItemActive: {
    borderWidth: 2,
    borderColor: colors.champagneGold,
    backgroundColor: colors.champagneGold + '10',
  },
  dreamIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  dreamIcon: {
    fontSize: 24,
  },
  dreamInfo: {
    flex: 1,
  },
  dreamTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: 2,
  },
  dreamCategory: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  dreamStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dreamStat: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
  },
  activeBadge: {
    backgroundColor: colors.champagneGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  activeBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.white,
  },
  newDreamButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.glow,
  },
  newDreamGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  newDreamIcon: {
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
  },
  newDreamText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
});
