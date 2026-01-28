import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PermissionSlipCompact } from '@/components/PermissionSlip';
import { usePermissionSlips, useActions, useProofs } from '@/hooks/useStorage';
import { useSubscription } from '@/hooks/useSubscription';
import { PermissionSlip, MicroAction, ProofEntry } from '@/types';
import { getPermissionSlipStyle } from '@/services/aiService';

type ArchiveFilter = 'all' | 'slips' | 'actions' | 'proofs';

interface ArchiveItem {
  id: string;
  type: 'permission_slip' | 'action' | 'proof';
  title: string;
  subtitle?: string;
  date: string;
  icon: string;
  data: PermissionSlip | MicroAction | ProofEntry;
}

// Filter Chip Component
function FilterChip({
  label,
  active,
  onPress,
  count,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  count: number;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
      <View style={[styles.filterChipCount, active && styles.filterChipCountActive]}>
        <Text style={[styles.filterChipCountText, active && styles.filterChipCountTextActive]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Archive Item Card
function ArchiveItemCard({
  item,
  onPress,
  index,
}: {
  item: ArchiveItem;
  onPress: () => void;
  index: number;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Card style={styles.archiveItemCard}>
          <View style={styles.archiveItemHeader}>
            <View style={styles.archiveItemIcon}>
              <Text style={styles.archiveItemIconText}>{item.icon}</Text>
            </View>
            <View style={styles.archiveItemInfo}>
              <Text style={styles.archiveItemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={styles.archiveItemSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            <View style={styles.archiveItemDate}>
              <Text style={styles.archiveItemDateText}>{formatDate(item.date)}</Text>
              <Badge
                variant={
                  item.type === 'permission_slip'
                    ? 'gold'
                    : item.type === 'action'
                    ? 'default'
                    : 'premium'
                }
                label={
                  item.type === 'permission_slip'
                    ? 'Slip'
                    : item.type === 'action'
                    ? 'Action'
                    : 'Proof'
                }
              />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Permission Slip Detail Card
function PermissionSlipDetail({ slip }: { slip: PermissionSlip }) {
  const style = getPermissionSlipStyle(slip.fear);

  return (
    <Card variant="premium" style={styles.detailCard}>
      <PermissionSlipCompact slip={slip} style={style} />
      <View style={styles.detailMeta}>
        <Text style={styles.detailMetaLabel}>Created for fear:</Text>
        <Text style={styles.detailMetaText}>&ldquo;{slip.fear}&rdquo;</Text>
      </View>
    </Card>
  );
}

export default function ArchiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium, canAccessFullArchive } = useSubscription();

  const { slips } = usePermissionSlips();
  const { actions } = useActions();
  const { proofs } = useProofs();

  const [filter, setFilter] = useState<ArchiveFilter>('all');
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);

  // Transform data into archive items
  const archiveItems = useMemo(() => {
    const items: ArchiveItem[] = [];

    // Add permission slips
    slips.forEach((slip) => {
      items.push({
        id: `slip-${slip.id}`,
        type: 'permission_slip',
        title: slip.title,
        subtitle: slip.signedBy,
        date: slip.createdAt,
        icon: '📜',
        data: slip,
      });
    });

    // Add completed actions
    actions
      .filter((a) => a.isCompleted)
      .forEach((action) => {
        items.push({
          id: `action-${action.id}`,
          type: 'action',
          title: action.title,
          subtitle: action.description,
          date: action.completedAt || action.id,
          icon: '✅',
          data: action,
        });
      });

    // Add proofs
    proofs.forEach((proof) => {
      items.push({
        id: `proof-${proof.id}`,
        type: 'proof',
        title: proof.note,
        subtitle: proof.hashtags.map((t) => `#${t}`).join(' '),
        date: proof.createdAt,
        icon: '📸',
        data: proof,
      });
    });

    // Sort by date (newest first)
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return items;
  }, [slips, actions, proofs]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (filter === 'all') return archiveItems;
    if (filter === 'slips') return archiveItems.filter((i) => i.type === 'permission_slip');
    if (filter === 'actions') return archiveItems.filter((i) => i.type === 'action');
    if (filter === 'proofs') return archiveItems.filter((i) => i.type === 'proof');
    return archiveItems;
  }, [archiveItems, filter]);

  // Group by month for sections
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: ArchiveItem[] } = {};

    filteredItems.forEach((item) => {
      const date = new Date(item.date);
      const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filteredItems]);

  const counts = useMemo(
    () => ({
      all: archiveItems.length,
      slips: archiveItems.filter((i) => i.type === 'permission_slip').length,
      actions: archiveItems.filter((i) => i.type === 'action').length,
      proofs: archiveItems.filter((i) => i.type === 'proof').length,
    }),
    [archiveItems]
  );

  // Define callbacks before any early returns to follow Rules of Hooks
  const renderItem = useCallback(
    ({ item, index }: { item: ArchiveItem; index: number }) => (
      <ArchiveItemCard item={item} onPress={() => setSelectedItem(item)} index={index} />
    ),
    []
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    []
  );

  // If not premium, show upgrade prompt
  if (!canAccessFullArchive) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.midnightNavy, '#0A2540']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.premiumPrompt, { paddingTop: insets.top + spacing['3xl'] }]}>
          <TouchableOpacity
            style={[styles.closeButton, { top: insets.top + spacing.md }]}
            onPress={() => router.back()}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.premiumEmoji}>📚</Text>
          <Text style={styles.premiumTitle}>The Archive</Text>
          <Text style={styles.premiumSubtitle}>
            Your complete history of Permission Slips, Micro-Actions, and Proof
            moments—beautifully organized by date and category.
          </Text>

          <View style={styles.premiumFeatures}>
            <View style={styles.premiumFeature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Browse all Permission Slips</Text>
            </View>
            <View style={styles.premiumFeature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>View completed Micro-Actions</Text>
            </View>
            <View style={styles.premiumFeature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Filter by type and date</Text>
            </View>
            <View style={styles.premiumFeature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Revisit your journey anytime</Text>
            </View>
          </View>

          <Button
            title="Unlock with Bold Adventurer"
            onPress={() => router.push('/paywall')}
            variant="gold"
            size="lg"
            style={styles.upgradeButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>The Archive</Text>
          <Badge variant="premium" label="Premium" />
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Stats */}
      <Animated.View entering={FadeIn} style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{counts.all}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{counts.slips}</Text>
          <Text style={styles.statLabel}>Slips</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{counts.actions}</Text>
          <Text style={styles.statLabel}>Actions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{counts.proofs}</Text>
          <Text style={styles.statLabel}>Proofs</Text>
        </View>
      </Animated.View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'slips', label: 'Slips', count: counts.slips },
            { key: 'actions', label: 'Actions', count: counts.actions },
            { key: 'proofs', label: 'Proofs', count: counts.proofs },
          ]}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              count={item.count}
              active={filter === item.key}
              onPress={() => setFilter(item.key as ArchiveFilter)}
            />
          )}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Archive List */}
      {groupedItems.length > 0 ? (
        <SectionList
          sections={groupedItems}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing['2xl'] },
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptyText}>
            Your Permission Slips, completed actions, and proofs will appear here.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: colors.midnightNavy,
    fontWeight: '300',
  },
  headerCenter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
  },
  headerRight: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.boldTerracotta,
  },
  statLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.xs,
  },
  filtersContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  filtersList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  filterChipActive: {
    backgroundColor: colors.midnightNavy,
  },
  filterChipText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    marginRight: spacing.xs,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  filterChipCount: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  filterChipCountActive: {
    backgroundColor: colors.champagneGold,
  },
  filterChipCountText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.gray600,
  },
  filterChipCountTextActive: {
    color: colors.midnightNavy,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
  },
  archiveItemCard: {
    marginBottom: spacing.sm,
  },
  archiveItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  archiveItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  archiveItemIconText: {
    fontSize: 18,
  },
  archiveItemInfo: {
    flex: 1,
  },
  archiveItemTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
  },
  archiveItemSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: 2,
  },
  archiveItemDate: {
    alignItems: 'flex-end',
  },
  archiveItemDateText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    marginBottom: 4,
  },
  detailCard: {
    marginVertical: spacing.md,
  },
  detailMeta: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  detailMetaLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginBottom: 4,
  },
  detailMetaText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
  },
  // Premium prompt styles
  premiumPrompt: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.white,
    fontSize: 16,
  },
  premiumEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
    marginTop: spacing['4xl'],
  },
  premiumTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  premiumSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  premiumFeatures: {
    width: '100%',
    marginBottom: spacing['2xl'],
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.vibrantTeal,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: spacing.md,
    fontWeight: 'bold',
    fontSize: 14,
  },
  featureText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  upgradeButton: {
    width: '100%',
  },
});
