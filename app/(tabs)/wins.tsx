import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { DreamMap } from '@/components/DreamMap';
import { ProofWallMasonry } from '@/components/ProofWallMasonry';
import { useProofs } from '@/hooks/useStorage';
import { ProofEntry } from '@/types';
import { useRoadmap } from '@/hooks/useRoadmap'; // Hook for roadmaps
import { Badge } from '@/components/ui/Badge';
import { PermissionSlipCard } from '@/components/PermissionSlipCard';
import { DigitalPermissionSlip } from '@/components/DigitalPermissionSlip';
import { PermissionSlip, PermissionSlipVisualStyle } from '@/types/database';
import { DREAM_CATEGORIES, DreamCategory } from '@/types/dreams';
import { useSubscription } from '@/hooks/useSubscription';
import { usePermissionSlips } from '@/hooks/usePermissionSlips';

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

  const { proofs } = useProofs();
  const {
    activeRoadmap,
    roadmaps,
    completedCount: activeCompletedCount,
    totalCount: activeTotalCount,
    globalCompletedCount,
    currentStreak,
    loading
  } = useRoadmap();
  const { isPremium } = useSubscription();
  const { permissionSlips } = usePermissionSlips();

  const [selectedProof, setSelectedProof] = useState<ProofEntry | null>(null);
  const [showProofWall, setShowProofWall] = useState(false);
  const [selectedPermissionSlip, setSelectedPermissionSlip] = useState<PermissionSlip | null>(null);

  // Completed roadmaps
  const completedRoadmaps = useMemo(() => {
    return roadmaps.filter(r => r.status === 'completed');
  }, [roadmaps]);

  // Derive display stats
  // "Actions Done" and Milestones should reflect GLOBAL progress
  const displayCompletedCount = globalCompletedCount || 0;

  // Progress for the MAIN MAP should reflect the ACTIVE roadmap
  const dreamProgress = activeTotalCount > 0 ? activeCompletedCount / activeTotalCount : 0;

  const nextMilestone = milestones.find((m) => displayCompletedCount < m.required);

  const handleProofPress = (proof: ProofEntry) => {
    setSelectedProof(proof);
  };

  const handleAddProof = () => {
    router.push('/add-proof');
  };

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
          <DreamMap
            progress={dreamProgress}
            destination={activeRoadmap?.dream || "Your Dream"}
            proofs={proofs} // Pass proofs to map if supported
          />
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
              const isUnlocked = displayCompletedCount >= milestone.required;
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
          {loading ? (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.boldTerracotta} />
              <Text style={{
                marginTop: spacing.sm,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.xs,
                color: colors.gray500
              }}>Updating stats...</Text>
            </View>
          ) : (
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>{displayCompletedCount}</Text>
                <Text style={styles.statLabel}>Actions Done</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>{currentStreak || currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>{proofs.length}</Text>
                <Text style={styles.statLabel}>Proofs</Text>
              </Card>
            </View>
          )}
        </Animated.View>

        {/* Completed Dreams (Roadmaps) Section */}
        {completedRoadmaps.length > 0 && (
          <Animated.View entering={FadeInDown.delay(320)} style={styles.completedDreamsSection}>
            <Text style={styles.sectionTitle}>Completed Dreams</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.completedDreamsScroll}
            >
              {completedRoadmaps.map((map) => {
                // Infer category from first action or default
                const firstAction = map.actions && map.actions[0];
                const category = firstAction?.category || 'career';
                const categoryInfo = DREAM_CATEGORIES[category as DreamCategory] || DREAM_CATEGORIES.career;

                const completedActions = map.actions?.filter(a => a.is_completed).length || 0;

                return (
                  <TouchableOpacity key={map.id} activeOpacity={0.9}>
                    <LinearGradient
                      colors={[colors.white, '#FAF9F6']}
                      style={styles.completedDreamCard}
                    >
                      <View style={styles.completedDreamHeader}>
                        <View style={[styles.completedDreamIconContainer, { backgroundColor: categoryInfo.gradient[0] + '20' }]}>
                          <Text style={styles.completedDreamIcon}>{categoryInfo.icon}</Text>
                        </View>
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedBadgeText}>COMPLETED</Text>
                        </View>
                      </View>

                      <Text style={styles.completedDreamTitle} numberOfLines={2}>{map.dream}</Text>
                      <Text style={styles.completedDreamDate}>
                        Achieved {new Date(map.updated_at || map.created_at || Date.now()).toLocaleDateString()}
                      </Text>

                      <View style={styles.completedDreamStats}>
                        <Text style={styles.completedDreamStatText}>
                          <Text style={{ fontWeight: 'bold' }}>{completedActions}</Text> actions
                        </Text>
                        <Text style={styles.completedDreamStatText}>🏆 Win</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

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
                    {nextMilestone.required - displayCompletedCount} actions to go
                  </Text>
                </View>
              </View>
              <View style={styles.nextMilestoneBar}>
                <View
                  style={[
                    styles.nextMilestoneBarFill,
                    {
                      width: `${Math.min(
                        (displayCompletedCount / nextMilestone.required) * 100,
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Proof Wall - Masonry Gallery */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.proofSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Proof Wall</Text>
            <View style={styles.proofHeaderButtons}>
              {proofs.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowProofWall(true)}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleAddProof}>
                <Text style={styles.addProofLink}>+ Add Proof</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Masonry Preview - Show first 4 proofs */}
          <ProofWallMasonry
            proofs={proofs.slice(0, 4)}
            onProofPress={handleProofPress}
            onAddProof={handleAddProof}
          />

          {/* Show "See more" if there are more than 4 proofs */}
          {proofs.length > 4 && (
            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={() => setShowProofWall(true)}
            >
              <LinearGradient
                colors={[colors.warmCream, colors.parchmentWhite]}
                style={styles.seeMoreGradient}
              >
                <Text style={styles.seeMoreText}>
                  See all {proofs.length} proofs →
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Permission Slips Section */}
        {permissionSlips.length > 0 && (
          <Animated.View entering={FadeInDown.delay(420)} style={styles.permissionSlipsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Permission Slips</Text>
              <View style={styles.permissionSlipBadge}>
                <Text style={styles.permissionSlipBadgeText}>{permissionSlips.length}</Text>
              </View>
            </View>
            <Text style={styles.permissionSlipSubtitle}>
              Your commitments to yourself
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.permissionSlipsScroll}
            >
              {permissionSlips.slice(0, 5).map((slip, index) => (
                <View key={slip.id} style={styles.permissionSlipItem}>
                  <PermissionSlipCard
                    slip={slip}
                    compact
                    onPress={() => setSelectedPermissionSlip(slip)}
                  />
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Community Section */}
        <Animated.View entering={FadeInDown.delay(450)} style={styles.communitySection}>
          <Text style={styles.sectionTitle}>Community</Text>
          <View style={styles.communityCards}>
            {/* Hype Feed - Available to all */}
            <TouchableOpacity
              style={styles.communityCard}
              onPress={() => router.push('/hype-feed')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colors.vibrantTeal, colors.tealDark]}
                style={styles.communityCardGradient}
              >
                <Text style={styles.communityCardIcon}>🌍</Text>
                <Text style={styles.communityCardTitle}>Hype Feed</Text>
                <Text style={styles.communityCardSubtitle}>Cheer community wins</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Hype Squads - Premium */}
            <TouchableOpacity
              style={styles.communityCard}
              onPress={() => router.push('/hype-squads')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={isPremium ? [colors.boldTerracotta, colors.terracottaDark] : [colors.gray400, colors.gray500]}
                style={styles.communityCardGradient}
              >
                {!isPremium && (
                  <View style={styles.premiumLock}>
                    <Text style={styles.premiumLockText}>🔒</Text>
                  </View>
                )}
                <Text style={styles.communityCardIcon}>👯‍♀️</Text>
                <Text style={styles.communityCardTitle}>Hype Squads</Text>
                <Text style={styles.communityCardSubtitle}>
                  {isPremium ? 'Your private squad' : 'Premium feature'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Archive / Vault Link */}
          <TouchableOpacity
            style={[styles.archiveLink, !isPremium && styles.archiveLinkLocked]}
            onPress={() => router.push('/archive')}
            activeOpacity={0.9}
          >
            <View style={styles.archiveLinkContent}>
              <Text style={styles.archiveLinkIcon}>📚</Text>
              <View style={styles.archiveLinkText}>
                <Text style={styles.archiveLinkTitle}>The Archive</Text>
                <Text style={styles.archiveLinkSubtitle}>
                  {isPremium
                    ? 'Your sealed achievements & history'
                    : 'Unlock to access your full history'}
                </Text>
              </View>
            </View>
            {isPremium ? (
              <Text style={styles.archiveLinkArrow}>›</Text>
            ) : (
              <Badge variant="gold" label="Premium" />
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Full Proof Wall Modal */}
      <Modal
        visible={showProofWall}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProofWall(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[colors.parchmentWhite, colors.warmCream]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.modalHeader, { paddingTop: insets.top + spacing.md }]}>
            <TouchableOpacity
              onPress={() => setShowProofWall(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Proof Wall</Text>
            <TouchableOpacity onPress={handleAddProof}>
              <Text style={styles.modalAddButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <ProofWallMasonry
              proofs={proofs}
              onProofPress={handleProofPress}
              onAddProof={handleAddProof}
            />
            <View style={{ height: insets.bottom + spacing.xl }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Proof Detail Modal */}
      <Modal
        visible={!!selectedProof}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedProof(null)}
      >
        <BlurView intensity={90} tint="dark" style={styles.proofDetailOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedProof(null)}
            activeOpacity={1}
          />
          {selectedProof && (
            <Animated.View
              entering={FadeInUp.springify().damping(15)}
              style={[styles.proofDetailCard, { marginBottom: insets.bottom + spacing.xl }]}
            >
              {selectedProof.imageUri ? (
                <Image
                  source={{ uri: selectedProof.imageUri }}
                  style={styles.proofDetailImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.proofDetailNoteBg}>
                  <LinearGradient
                    colors={['#FDF8ED', '#F5EDD6', '#EDE4CC']}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              )}
              <View style={styles.proofDetailContent}>
                <Text style={styles.proofDetailNote}>{selectedProof.note}</Text>
                {selectedProof.hashtags.length > 0 && (
                  <View style={styles.proofDetailHashtags}>
                    {selectedProof.hashtags.map((tag, i) => (
                      <View key={i} style={styles.proofDetailHashtagBadge}>
                        <Text style={styles.proofDetailHashtagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.proofDetailFooter}>
                  <View style={styles.proofDetailReactions}>
                    {(selectedProof.reactions.length > 0
                      ? selectedProof.reactions
                      : ['💚', '🧡', '⭐']
                    ).map((reaction, i) => (
                      <View key={i} style={styles.proofDetailReactionBubble}>
                        <Text style={styles.proofDetailReactionEmoji}>{reaction}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.proofDetailDate}>
                    {new Date(selectedProof.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.proofDetailClose}
                onPress={() => setSelectedProof(null)}
              >
                <Text style={styles.proofDetailCloseText}>✕</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </BlurView>
      </Modal>

      {/* Permission Slip Detail Modal */}
      <Modal
        visible={!!selectedPermissionSlip}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedPermissionSlip(null)}
      >
        <BlurView intensity={90} tint="dark" style={styles.proofDetailOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedPermissionSlip(null)}
            activeOpacity={1}
          />
          {selectedPermissionSlip && (
            <Animated.View
              entering={FadeInUp.springify().damping(15)}
              style={[styles.permissionSlipModal, { marginBottom: insets.bottom + spacing.xl }]}
            >
              <DigitalPermissionSlip
                permissionStatement={selectedPermissionSlip.permission_statement}
                visualStyle={(selectedPermissionSlip.visual_style || 'minimalist') as PermissionSlipVisualStyle}
                signatureData={selectedPermissionSlip.signature_data}
                signedAt={selectedPermissionSlip.signed_at}
                animated={false}
              />
              <TouchableOpacity
                style={styles.permissionSlipModalClose}
                onPress={() => setSelectedPermissionSlip(null)}
              >
                <Text style={styles.permissionSlipModalCloseText}>✕</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </BlurView>
      </Modal>
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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['4xl'],
    color: colors.midnightNavy,
    marginBottom: spacing['2xl'],
    letterSpacing: -0.5,
  },
  mapContainer: {
    marginBottom: spacing['2xl'],
  },
  milestonesSection: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.lg,
    letterSpacing: -0.2,
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
  proofHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  viewAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewAllText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textDecorationLine: 'underline',
  },
  seeMoreButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  seeMoreGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  seeMoreText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
  },
  milestonesScroll: {
    paddingRight: spacing.lg,
  },
  milestoneCard: {
    width: 110,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginRight: spacing.md,
    ...shadows.md,
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
    marginBottom: spacing['2xl'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  statNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['4xl'],
    color: colors.boldTerracotta,
  },
  statLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginTop: spacing.sm,
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
  // Completed Dreams Styles
  completedDreamsSection: {
    marginBottom: spacing['2xl'],
  },
  completedDreamsScroll: {
    paddingRight: spacing.lg,
  },
  completedDreamCard: {
    width: 200,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginRight: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  completedDreamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  completedDreamIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedDreamIcon: {
    fontSize: 20,
  },
  completedBadge: {
    backgroundColor: colors.vibrantTeal + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.vibrantTeal,
  },
  completedDreamTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
    height: 40, // fix height for 2 lines
  },
  completedDreamDate: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginBottom: spacing.md,
  },
  completedDreamStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.sm,
  },
  completedDreamStatText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
  },
  emptyDreamsState: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  emptyDreamsIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  emptyDreamsText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalCloseText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.boldTerracotta,
  },
  modalAddButton: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.boldTerracotta,
  },
  modalContent: {
    paddingTop: spacing.xl,
  },
  // Proof Detail Modal
  proofDetailOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  proofDetailCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.xl,
  },
  proofDetailImage: {
    width: '100%',
    height: 300,
  },
  proofDetailNoteBg: {
    width: '100%',
    height: 200,
  },
  proofDetailContent: {
    padding: spacing.xl,
  },
  proofDetailNote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  proofDetailHashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  proofDetailHashtagBadge: {
    backgroundColor: colors.boldTerracotta + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  proofDetailHashtagText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
  },
  proofDetailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proofDetailReactions: {
    flexDirection: 'row',
  },
  proofDetailReactionBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    borderWidth: 2,
    borderColor: colors.white,
  },
  proofDetailReactionEmoji: {
    fontSize: 14,
  },
  proofDetailDate: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  proofDetailClose: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofDetailCloseText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  // Community Section Styles
  communitySection: {
    marginBottom: spacing['2xl'],
  },
  communityCards: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  communityCard: {
    flex: 1,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.lg,
  },
  communityCardGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
    position: 'relative',
  },
  communityCardIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  communityCardTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
    textAlign: 'center',
  },
  communityCardSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  premiumLock: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumLockText: {
    fontSize: 12,
  },
  archiveLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  archiveLinkLocked: {
    borderWidth: 1,
    borderColor: colors.champagneGold + '40',
    backgroundColor: colors.warmCream,
  },
  archiveLinkContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  archiveLinkIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  archiveLinkText: {
    flex: 1,
  },
  archiveLinkTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  archiveLinkSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  archiveLinkArrow: {
    fontFamily: typography.fontFamily.body,
    fontSize: 24,
    color: colors.gray400,
  },
  // Permission Slips Section Styles
  permissionSlipsSection: {
    marginBottom: spacing['2xl'],
  },
  permissionSlipSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginBottom: spacing.lg,
  },
  permissionSlipBadge: {
    backgroundColor: colors.champagneGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  permissionSlipBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.midnightNavy,
  },
  permissionSlipsScroll: {
    paddingRight: spacing.lg,
  },
  permissionSlipItem: {
    width: 280,
    marginRight: spacing.md,
  },
  // Permission Slip Modal Styles
  permissionSlipModal: {
    width: '100%',
    maxWidth: 400,
    padding: spacing.md,
    position: 'relative',
  },
  permissionSlipModalClose: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  permissionSlipModalCloseText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
