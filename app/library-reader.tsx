import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { useBoostStore } from '@/hooks/useBoostStore';
import { BOOST_CATALOG, getBoostTypeLabel, BoostSection, BoostActionItem } from '@/types/boosts';

export default function LibraryReaderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { boostId } = useLocalSearchParams<{ boostId: string }>();
  const { getPurchasedBoost, markBoostAsRead } = useBoostStore();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  const purchasedBoost = getPurchasedBoost(boostId || '');
  const product = BOOST_CATALOG.find((b) => b.id === boostId);

  // Mark as read when opened
  useEffect(() => {
    if (purchasedBoost && !purchasedBoost.isRead) {
      markBoostAsRead(purchasedBoost.id);
    }
  }, [purchasedBoost, markBoostAsRead]);

  // Initialize completed actions from content
  useEffect(() => {
    if (purchasedBoost?.content.actionItems) {
      const completed = new Set(
        purchasedBoost.content.actionItems
          .filter((a) => a.isCompleted)
          .map((a) => a.id)
      );
      setCompletedActions(completed);
    }
  }, [purchasedBoost]);

  const toggleSection = useCallback((sectionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const toggleActionComplete = useCallback((actionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompletedActions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  }, []);

  if (!purchasedBoost || !product) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.champagneGold} />
        <Text style={styles.loadingText}>Loading your guide...</Text>
      </View>
    );
  }

  const { content } = purchasedBoost;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.typeBadge}>
            <LinearGradient
              colors={[colors.champagneGold, colors.goldDark]}
              style={styles.typeBadgeGradient}
            >
              <Text style={styles.typeText}>{getBoostTypeLabel(product.type)}</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown} style={styles.heroSection}>
          <Text style={styles.heroIcon}>{product.icon}</Text>
          <Text style={styles.heroTitle}>{content.title}</Text>
          <Text style={styles.heroSubtitle}>{product.subtitle}</Text>
        </Animated.View>

        {/* Introduction */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.introCard}>
          <Text style={styles.introText}>{content.introduction}</Text>
        </Animated.View>

        {/* Quick Tips */}
        {content.quickTips && content.quickTips.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.quickTipsCard}>
            <Text style={styles.cardTitle}>💡 Quick Tips</Text>
            {content.quickTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          <Text style={styles.sectionHeader}>📖 Your Guide</Text>
          {content.sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </View>

        {/* Action Items */}
        {content.actionItems && content.actionItems.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400)} style={styles.actionsContainer}>
            <Text style={styles.sectionHeader}>✅ Your Action Items</Text>
            <View style={styles.actionsCard}>
              {content.actionItems.map((action) => (
                <ActionItemCard
                  key={action.id}
                  action={action}
                  isCompleted={completedActions.has(action.id)}
                  onToggle={() => toggleActionComplete(action.id)}
                />
              ))}
            </View>
            <View style={styles.progressSummary}>
              <Text style={styles.progressText}>
                {completedActions.size} of {content.actionItems.length} actions completed
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(completedActions.size / content.actionItems.length) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Conclusion */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.conclusionCard}>
          <LinearGradient
            colors={[colors.champagneGold + '20', colors.goldLight + '10']}
            style={styles.conclusionGradient}
          >
            <Text style={styles.conclusionIcon}>🌟</Text>
            <Text style={styles.conclusionText}>{content.conclusion}</Text>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

interface SectionCardProps {
  section: BoostSection;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function SectionCard({ section, index, isExpanded, onToggle }: SectionCardProps) {
  return (
    <Animated.View entering={FadeInUp.delay(300 + index * 50)} style={styles.sectionCard}>
      <TouchableOpacity onPress={onToggle} style={styles.sectionHeader2}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionIcon}>{section.icon || '📄'}</Text>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
      </TouchableOpacity>

      {isExpanded && (
        <Animated.View entering={FadeIn} style={styles.sectionContent}>
          <Text style={styles.sectionText}>{section.content}</Text>

          {section.subsections && section.subsections.length > 0 && (
            <View style={styles.subsectionsContainer}>
              {section.subsections.map((sub, idx) => (
                <View key={idx} style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>{sub.title}</Text>
                  <Text style={styles.subsectionText}>{sub.content}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

interface ActionItemCardProps {
  action: BoostActionItem;
  isCompleted: boolean;
  onToggle: () => void;
}

function ActionItemCard({ action, isCompleted, onToggle }: ActionItemCardProps) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.actionItem}>
      <View
        style={[
          styles.checkbox,
          isCompleted && styles.checkboxCompleted,
        ]}
      >
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.actionContent}>
        <Text
          style={[
            styles.actionTitle,
            isCompleted && styles.actionTitleCompleted,
          ]}
        >
          {action.title}
        </Text>
        <Text style={styles.actionDescription}>{action.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.parchmentWhite,
  },
  loadingText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
    marginTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  backIcon: {
    fontSize: 20,
    color: colors.midnightNavy,
  },
  headerCenter: {
    alignItems: 'center',
  },
  typeBadge: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  typeBadgeGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  typeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
    textAlign: 'center',
  },
  introCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.champagneGold,
    ...shadows.sm,
  },
  introText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    lineHeight: 26,
  },
  quickTipsCard: {
    backgroundColor: colors.vibrantTeal + '10',
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.vibrantTeal + '30',
  },
  cardTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.lg,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  tipBullet: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.vibrantTeal,
    marginRight: spacing.sm,
    width: 16,
  },
  tipText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    flex: 1,
    lineHeight: 24,
  },
  sectionsContainer: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.lg,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  sectionHeader2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    flex: 1,
  },
  expandIcon: {
    fontSize: 20,
    color: colors.gray500,
    width: 24,
    textAlign: 'center',
  },
  sectionContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray100,
    paddingTop: spacing.lg,
  },
  sectionText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    lineHeight: 26,
  },
  subsectionsContainer: {
    marginTop: spacing.lg,
  },
  subsection: {
    backgroundColor: colors.warmCream,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  subsectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
  },
  subsectionText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    lineHeight: 22,
  },
  actionsContainer: {
    marginBottom: spacing.xl,
  },
  actionsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.md,
    ...shadows.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray100,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: colors.vibrantTeal,
    borderColor: colors.vibrantTeal,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: 2,
  },
  actionTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.gray400,
  },
  actionDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  progressSummary: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  progressText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginBottom: spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.vibrantTeal,
    borderRadius: 3,
  },
  conclusionCard: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.champagneGold + '40',
  },
  conclusionGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  conclusionIcon: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  conclusionText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
  },
});
