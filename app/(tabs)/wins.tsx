import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { DreamMap } from '@/components/DreamMap';
import { ProofCard } from '@/components/ProofCard';
import { useUser, useProofs, useDreamProgress, useActions } from '@/hooks/useStorage';
import { ProofEntry } from '@/types';

const { width } = Dimensions.get('window');

// Milestone badges
const milestones = [
  { id: '1', title: 'First Step', icon: '🌱', required: 1, description: 'Complete your first action' },
  { id: '5', title: 'Building Momentum', icon: '🔥', required: 5, description: '5 actions completed' },
  { id: '10', title: 'Bold Explorer', icon: '🧭', required: 10, description: '10 actions completed' },
  { id: '25', title: 'Trailblazer', icon: '⭐', required: 25, description: '25 actions completed' },
  { id: '50', title: 'Unstoppable', icon: '🏆', required: 50, description: '50 actions completed' },
  { id: '100', title: 'Legend', icon: '👑', required: 100, description: '100 actions completed' },
];

export default function WinsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user } = useUser();
  const { proofs } = useProofs();
  const { progress } = useDreamProgress();
  const { getCompletedActions } = useActions();

  const completedCount = progress?.completedActions || 0;
  const dreamProgress = Math.min((completedCount / 50) * 100, 100) / 100; // Progress to 50 actions

  const unlockedMilestones = milestones.filter((m) => completedCount >= m.required);
  const nextMilestone = milestones.find((m) => completedCount < m.required);

  const renderProofItem = ({ item, index }: { item: ProofEntry; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <ProofCard
        proof={item}
        onPress={() => {}}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn}>
          <Text style={styles.headerTitle}>Your Journey & Proof</Text>
        </Animated.View>

        {/* Dream Map */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.mapContainer}>
          <DreamMap progress={dreamProgress} destination="Your Dream" />
        </Animated.View>

        {/* Milestones */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.milestonesSection}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.milestonesScroll}
          >
            {milestones.map((milestone, index) => {
              const isUnlocked = completedCount >= milestone.required;
              return (
                <View
                  key={milestone.id}
                  style={[
                    styles.milestoneCard,
                    isUnlocked && styles.milestoneUnlocked,
                  ]}
                >
                  <View
                    style={[
                      styles.milestoneIconContainer,
                      isUnlocked && styles.milestoneIconUnlocked,
                    ]}
                  >
                    <Text style={styles.milestoneIcon}>
                      {isUnlocked ? milestone.icon : '🔒'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.milestoneTitle,
                      isUnlocked && styles.milestoneTitleUnlocked,
                    ]}
                  >
                    {milestone.title}
                  </Text>
                  <Text style={styles.milestoneRequired}>
                    {milestone.required} actions
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Progress Stats */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsSection}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>{completedCount}</Text>
              <Text style={styles.statLabel}>Actions Done</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>{progress?.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>{proofs.length}</Text>
              <Text style={styles.statLabel}>Proofs</Text>
            </Card>
          </View>
        </Animated.View>

        {/* Next Milestone */}
        {nextMilestone && (
          <Animated.View entering={FadeInDown.delay(350)}>
            <Card variant="premium" style={styles.nextMilestoneCard}>
              <View style={styles.nextMilestoneContent}>
                <Text style={styles.nextMilestoneIcon}>{nextMilestone.icon}</Text>
                <View style={styles.nextMilestoneText}>
                  <Text style={styles.nextMilestoneTitle}>
                    Next: {nextMilestone.title}
                  </Text>
                  <Text style={styles.nextMilestoneProgress}>
                    {nextMilestone.required - completedCount} actions to go
                  </Text>
                </View>
              </View>
              <View style={styles.nextMilestoneBar}>
                <View
                  style={[
                    styles.nextMilestoneBarFill,
                    {
                      width: `${Math.min(
                        (completedCount / nextMilestone.required) * 100,
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Proof Gallery */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.proofSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Proof Gallery</Text>
            <TouchableOpacity onPress={() => router.push('/add-proof')}>
              <Text style={styles.addProofLink}>+ Add Proof</Text>
            </TouchableOpacity>
          </View>

          {proofs.length > 0 ? (
            <FlatList
              data={proofs}
              renderItem={renderProofItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.proofList}
              ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
            />
          ) : (
            <Card style={styles.emptyProofCard}>
              <Text style={styles.emptyProofIcon}>📸</Text>
              <Text style={styles.emptyProofTitle}>No proofs yet</Text>
              <Text style={styles.emptyProofText}>
                Complete actions and capture your wins to build your proof gallery!
              </Text>
              <TouchableOpacity
                style={styles.emptyProofButton}
                onPress={() => router.push('/add-proof')}
              >
                <Text style={styles.emptyProofButtonText}>Add Your First Proof</Text>
              </TouchableOpacity>
            </Card>
          )}
        </Animated.View>

        {/* Recent Wins */}
        {proofs.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500)} style={styles.recentWinsSection}>
            <Text style={styles.sectionTitle}>Recent Wins</Text>
            {proofs.slice(0, 3).map((proof, index) => (
              <Card key={proof.id} style={styles.recentWinCard}>
                <View style={styles.recentWinContent}>
                  {proof.imageUri ? (
                    <Image
                      source={{ uri: proof.imageUri }}
                      style={styles.recentWinImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.recentWinImagePlaceholder}>
                      <Text>📝</Text>
                    </View>
                  )}
                  <View style={styles.recentWinText}>
                    <Text style={styles.recentWinNote} numberOfLines={2}>
                      {proof.note}
                    </Text>
                    <Text style={styles.recentWinDate}>
                      {new Date(proof.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.midnightNavy,
    marginBottom: spacing.xl,
  },
  mapContainer: {
    marginBottom: spacing.xl,
  },
  milestonesSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addProofLink: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
  },
  milestonesScroll: {
    paddingRight: spacing.lg,
  },
  milestoneCard: {
    width: 100,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginRight: spacing.md,
    ...shadows.sm,
    opacity: 0.6,
  },
  milestoneUnlocked: {
    opacity: 1,
    borderWidth: 2,
    borderColor: colors.champagneGold,
  },
  milestoneIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  milestoneIconUnlocked: {
    backgroundColor: colors.goldLight,
  },
  milestoneIcon: {
    fontSize: 24,
  },
  milestoneTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: 2,
  },
  milestoneTitleUnlocked: {
    color: colors.midnightNavy,
  },
  milestoneRequired: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.boldTerracotta,
  },
  statLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  nextMilestoneCard: {
    marginBottom: spacing.xl,
  },
  nextMilestoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nextMilestoneIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  nextMilestoneText: {
    flex: 1,
  },
  nextMilestoneTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  nextMilestoneProgress: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  nextMilestoneBar: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  nextMilestoneBarFill: {
    height: '100%',
    backgroundColor: colors.champagneGold,
    borderRadius: 4,
  },
  proofSection: {
    marginBottom: spacing.xl,
  },
  proofList: {
    paddingRight: spacing.lg,
  },
  emptyProofCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyProofIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyProofTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
  },
  emptyProofText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptyProofButton: {
    backgroundColor: colors.boldTerracotta,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  emptyProofButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  recentWinsSection: {
    marginBottom: spacing.xl,
  },
  recentWinCard: {
    marginBottom: spacing.md,
  },
  recentWinContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentWinImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  recentWinImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  recentWinText: {
    flex: 1,
  },
  recentWinNote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
  },
  recentWinDate: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
});
