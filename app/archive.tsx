import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { useVaultData, VaultProof } from '@/hooks/useVaultData';
import { useRoadmap } from '@/hooks/useRoadmap';
import { SmokeBackground } from '@/components/vault/SmokeBackground';
import { ProofCardVault } from '@/components/vault/ProofCardVault';
import { SealingRitualAnimation } from '@/components/vault/SealingRitualAnimation';
import { MilestoneTimeline } from '@/components/vault/MilestoneTimeline';
import { CoreInsightCard } from '@/components/vault/CoreInsightCard';
import { RoadmapAction } from '@/types/database';

const { width } = Dimensions.get('window');

type VaultFilter = 'all' | 'actions' | 'insights' | 'milestones';

export default function ArchiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Data Hooks
  const { proofs, slips, loading: vaultLoading, refreshVault } = useVaultData();
  const { roadmaps, globalCompletedCount } = useRoadmap();

  const [filter, setFilter] = useState<VaultFilter>('all');
  const [selectedProof, setSelectedProof] = useState<VaultProof | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [sealingProof, setSealingProof] = useState<VaultProof | null>(null);

  // Refresh on mount
  useEffect(() => {
    refreshVault();
  }, [refreshVault]);

  // Filter sealed proofs (assuming all in vault are sealed/completed)
  const sealedProofs = useMemo(() => {
    // For now, treat all fetched proofs as sealed since they are in the DB
    return proofs;
  }, [proofs]);

  const filteredProofs = useMemo(() => {
    if (filter === 'all') return sealedProofs;
    // Map filter keys to proof_type logic if needed, or simple category
    // Assuming proof types match roughly for now, or just show all for simplicity until refined
    return sealedProofs;
  }, [sealedProofs, filter]);

  // Core insights from Permission Slips
  const coreInsights = useMemo(() => {
    // Transform slips to look like insights if needed for the component
    return slips.slice(0, 3);
  }, [slips]);

  // Completed roadmap milestones (Actions)
  const completedMilestones = useMemo(() => {
    let allActions: RoadmapAction[] = [];
    roadmaps.forEach(r => {
      if (r.actions) {
        allActions = [...allActions, ...r.actions];
        r.actions.forEach(a => {
          if (a.subActions) allActions = [...allActions, ...a.subActions];
        });
      }
    });
    return allActions.filter(a => a.is_completed);
  }, [roadmaps]);

  const handleAddProof = () => {
    router.push('/capture-proof');
  };

  const handleProofPress = async (proof: VaultProof) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProof(proof);
  };

  const handleFilterChange = async (newFilter: VaultFilter) => {
    await Haptics.selectionAsync();
    setFilter(newFilter);
  };

  if (vaultLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.champagneGold} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Animated Smoke Background */}
      <SmokeBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>The Archive</Text>
          <Text style={styles.headerSubtitle}>Vault of Achievement</Text>
        </View>
        <TouchableOpacity onPress={handleAddProof} style={styles.addButton}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['4xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <Animated.View entering={FadeIn} style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{sealedProofs.length}</Text>
            <Text style={styles.statLabel}>Sealed Wins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{coreInsights.length}</Text>
            <Text style={styles.statLabel}>Core Insights</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedMilestones.length}</Text>
            <Text style={styles.statLabel}>Milestones</Text>
          </View>
        </Animated.View>

        {/* Quick Access Sections */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.quickAccessSection}>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => setShowInsights(true)}
          >
            <LinearGradient
              colors={['#D4AF37', '#B8952D']}
              style={styles.quickAccessGradient}
            >
              <Text style={styles.quickAccessIcon}>💎</Text>
              <Text style={styles.quickAccessTitle}>Core Insights</Text>
              <Text style={styles.quickAccessSubtitle}>
                {coreInsights.length} discoveries
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => setShowTimeline(true)}
          >
            <LinearGradient
              colors={['#2EC4B6', '#22A399']}
              style={styles.quickAccessGradient}
            >
              <Text style={styles.quickAccessIcon}>🗺️</Text>
              <Text style={styles.quickAccessTitle}>Timeline</Text>
              <Text style={styles.quickAccessSubtitle}>
                {completedMilestones.length} completed
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.filterContainer}>
          {(['all', 'actions', 'insights', 'milestones'] as VaultFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => handleFilterChange(f)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === f && styles.filterTabTextActive,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Proof Wall - Masonry Grid */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.proofWall}>
          {filteredProofs.length > 0 ? (
            <View style={styles.masonryGrid}>
              {filteredProofs.map((proof, index) => (
                <ProofCardVault
                  key={proof.id}
                  proof={proof}
                  onPress={() => handleProofPress(proof)}
                  index={index}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔒</Text>
              <Text style={styles.emptyTitle}>Vault is Empty</Text>
              <Text style={styles.emptyText}>
                Your sealed achievements will appear here as you complete actions and secure
                your wins.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddProof}>
                <LinearGradient
                  colors={['#2EC4B6', '#22A399']}
                  style={styles.emptyButtonGradient}
                >
                  <Text style={styles.emptyButtonText}>Seal Your First Win</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Proof Detail Modal */}
      {selectedProof && (
        <Modal
          visible={!!selectedProof}
          animationType="fade"
          transparent
          onRequestClose={() => setSelectedProof(null)}
        >
          <BlurView intensity={95} tint="dark" style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => setSelectedProof(null)}
              activeOpacity={1}
            />
            <Animated.View
              entering={FadeIn}
              style={[styles.proofDetailCard, { marginBottom: insets.bottom + spacing.xl }]}
            >
              {/* Image with category glow */}
              {selectedProof.image_url && (
                <View style={styles.proofImageContainer}>
                  <Image
                    source={{ uri: selectedProof.image_url }}
                    style={styles.proofImage}
                    contentFit="cover"
                  />
                  {/* Category glow overlay */}
                  <View
                    style={[
                      styles.glowOverlay,
                      {
                        // Default teal glow, could map category if available in DB
                        backgroundColor: colors.vibrantTeal + '30',
                      },
                    ]}
                  />
                </View>
              )}

              <View style={styles.proofDetailContent}>

                {/* Main note */}
                <Text style={styles.proofNote}>{selectedProof.note}</Text>

                {/* Hashtags */}
                {selectedProof.hashtags && selectedProof.hashtags.length > 0 && (
                  <View style={styles.hashtagsContainer}>
                    {selectedProof.hashtags.map((tag, i) => (
                      <View key={i} style={styles.hashtagBadge}>
                        <Text style={styles.hashtagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Reactions (if any) */}
                {selectedProof.reactions && selectedProof.reactions.length > 0 && (
                  <View style={styles.hashtagsContainer}>
                    {selectedProof.reactions.map((r, i) => (
                      <Text key={i} style={{ fontSize: 20, marginRight: 8 }}>{r}</Text>
                    ))}
                  </View>
                )}

                {/* Sealed date */}
                {selectedProof.created_at && (
                  <View style={styles.sealedInfo}>
                    <Text style={styles.sealedIcon}>🔒</Text>
                    <Text style={styles.sealedText}>
                      Sealed {new Date(selectedProof.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedProof(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        </Modal>
      )}

      {/* Timeline Modal */}
      <Modal
        visible={showTimeline}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTimeline(false)}
      >
        <MilestoneTimeline
          milestones={completedMilestones}
          onClose={() => setShowTimeline(false)}
        />
      </Modal>

      {/* Core Insights Modal */}
      <Modal
        visible={showInsights}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInsights(false)}
      >
        <View style={styles.insightsModal}>
          <LinearGradient
            colors={['#1A1A2E', '#16213E']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.insightsHeader, { paddingTop: insets.top + spacing.md }]}>
            <Text style={styles.insightsTitle}>Core Insight Repository</Text>
            <TouchableOpacity
              onPress={() => setShowInsights(false)}
              style={styles.insightsCloseButton}
            >
              <Text style={styles.insightsCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={[
              styles.insightsContent,
              { paddingBottom: insets.bottom + spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {coreInsights.map((insight, index) => (
              <CoreInsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Sealing Ritual Animation */}
      {sealingProof && (
        <SealingRitualAnimation
          proof={sealingProof}
          onComplete={() => setSealingProof(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: colors.champagneGold,
    fontWeight: '300',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.champagneGold,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(212, 175, 55, 0.6)',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.vibrantTeal,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  addIcon: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '300',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.champagneGold,
  },
  statLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    marginVertical: spacing.xs,
  },
  quickAccessSection: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickAccessCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  quickAccessGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  quickAccessIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  quickAccessTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
    marginBottom: 2,
  },
  quickAccessSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.champagneGold,
    borderColor: colors.champagneGold,
  },
  filterTabText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  filterTabTextActive: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.midnightNavy,
  },
  proofWall: {
    marginBottom: spacing.xl,
  },
  masonryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.champagneGold,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  emptyButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  emptyButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  proofDetailCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  proofImageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  proofImage: {
    width: '100%',
    height: '100%',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  proofDetailContent: {
    padding: spacing.xl,
  },
  aiCommentBubble: {
    flexDirection: 'row',
    backgroundColor: 'rgba(46, 196, 182, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(46, 196, 182, 0.3)',
  },
  gabbyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.vibrantTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  gabbyAvatarText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  aiCommentContent: {
    flex: 1,
  },
  aiCommentLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.vibrantTeal,
    marginBottom: 4,
  },
  aiCommentText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  proofNote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.white,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  voiceSummaryCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  voiceSummaryLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.champagneGold,
    marginBottom: 4,
  },
  voiceSummaryText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  hashtagBadge: {
    backgroundColor: 'rgba(46, 196, 182, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  hashtagText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.vibrantTeal,
  },
  sealedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  sealedIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  sealedText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.white,
  },
  // Insights Modal
  insightsModal: {
    flex: 1,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  insightsTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.champagneGold,
  },
  insightsCloseButton: {
    padding: spacing.xs,
  },
  insightsCloseText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.vibrantTeal,
  },
  insightsContent: {
    padding: spacing.xl,
  },
});
