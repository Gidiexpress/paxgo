import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { ProofEntry } from '@/types';

const { width } = Dimensions.get('window');
const COLUMN_GAP = spacing.md;
const HORIZONTAL_PADDING = spacing.xl;
const COLUMN_WIDTH = (width - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

interface ProofWallMasonryProps {
  proofs: ProofEntry[];
  onProofPress?: (proof: ProofEntry) => void;
  onAddProof?: () => void;
}

// Generate varying heights for masonry effect
function getCardHeight(index: number, hasImage: boolean): number {
  const heights = hasImage
    ? [180, 220, 160, 200, 240, 170]
    : [120, 140, 100, 130];
  return heights[index % heights.length];
}

// Journal-entry style filter overlay
function JournalOverlay({ intensity = 0.15 }: { intensity?: number }) {
  return (
    <View style={[styles.journalOverlay, { opacity: intensity }]}>
      <LinearGradient
        colors={['rgba(245, 237, 214, 0.4)', 'transparent', 'rgba(139, 90, 43, 0.2)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle vignette */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.1)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.xl }]}
      />
    </View>
  );
}

interface MasonryCardProps {
  proof: ProofEntry;
  height: number;
  index: number;
  onPress?: () => void;
}

function MasonryCard({ proof, height, index, onPress }: MasonryCardProps) {
  const hasImage = !!proof.imageUri;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify().damping(15)}
      style={[styles.card, { height }]}
    >
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={onPress}
        activeOpacity={0.92}
      >
        {/* Image or Note Background */}
        {hasImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: proof.imageUri }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
            <JournalOverlay intensity={0.2} />
            {/* Corner fold decoration */}
            <View style={styles.cornerFold}>
              <View style={styles.cornerFoldInner} />
            </View>
          </View>
        ) : (
          <View style={styles.noteContainer}>
            <LinearGradient
              colors={['#FDF8ED', '#F5EDD6', '#EDE4CC']}
              style={StyleSheet.absoluteFill}
            />
            {/* Paper texture lines */}
            <View style={styles.paperLines}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={styles.paperLine} />
              ))}
            </View>
            <View style={styles.noteContent}>
              <Text style={styles.noteQuote}>"</Text>
              <Text style={styles.noteText} numberOfLines={4}>
                {proof.note}
              </Text>
            </View>
            {/* Tape decoration */}
            <View style={styles.tapeDecoration}>
              <View style={styles.tape} />
            </View>
          </View>
        )}

        {/* Content Overlay */}
        <View style={[styles.contentOverlay, !hasImage && styles.contentOverlayNoImage]}>
          {hasImage && (
            <View style={styles.noteOverlay}>
              <Text style={styles.noteOverlayText} numberOfLines={2}>
                {proof.note}
              </Text>
            </View>
          )}

          {/* Hashtags */}
          {proof.hashtags.length > 0 && (
            <View style={styles.hashtags}>
              {proof.hashtags.slice(0, 2).map((tag, i) => (
                <View key={i} style={styles.hashtagBadge}>
                  <Text style={styles.hashtagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.reactions}>
              {(proof.reactions.length > 0 ? proof.reactions : ['💚', '🧡']).slice(0, 3).map((reaction, i) => (
                <View key={i} style={styles.reactionBubble}>
                  <Text style={styles.reactionEmoji}>{reaction}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.dateText}>
              {formatRelativeTime(proof.createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ProofWallMasonry({ proofs, onProofPress, onAddProof }: ProofWallMasonryProps) {
  // Distribute proofs into two columns for masonry layout
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: Array<{ proof: ProofEntry; height: number; originalIndex: number }> = [];
    const right: Array<{ proof: ProofEntry; height: number; originalIndex: number }> = [];
    let leftHeight = 0;
    let rightHeight = 0;

    proofs.forEach((proof, index) => {
      const height = getCardHeight(index, !!proof.imageUri);

      if (leftHeight <= rightHeight) {
        left.push({ proof, height, originalIndex: index });
        leftHeight += height + COLUMN_GAP;
      } else {
        right.push({ proof, height, originalIndex: index });
        rightHeight += height + COLUMN_GAP;
      }
    });

    return { leftColumn: left, rightColumn: right };
  }, [proofs]);

  const renderColumn = useCallback((items: typeof leftColumn, isLeft: boolean) => (
    <View style={[styles.column, isLeft ? styles.leftColumn : styles.rightColumn]}>
      {items.map(({ proof, height, originalIndex }) => (
        <MasonryCard
          key={proof.id}
          proof={proof}
          height={height}
          index={originalIndex}
          onPress={() => onProofPress?.(proof)}
        />
      ))}
    </View>
  ), [onProofPress]);

  if (proofs.length === 0) {
    return (
      <Animated.View entering={FadeIn} style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📸</Text>
          <Text style={styles.emptyTitle}>Your Proof Wall awaits</Text>
          <Text style={styles.emptyText}>
            Complete actions and capture your bold moves here.
            Each photo tells a story of your journey.
          </Text>
          {onAddProof && (
            <TouchableOpacity style={styles.emptyButton} onPress={onAddProof}>
              <LinearGradient
                colors={[colors.boldTerracotta, colors.terracottaDark]}
                style={styles.emptyButtonGradient}
              >
                <Text style={styles.emptyButtonText}>Add Your First Proof</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.columnsContainer}>
        {renderColumn(leftColumn, true)}
        {renderColumn(rightColumn, false)}
      </View>
    </View>
  );
}

// Helper function for relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  columnsContainer: {
    flexDirection: 'row',
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  column: {
    width: COLUMN_WIDTH,
  },
  leftColumn: {
    marginRight: COLUMN_GAP / 2,
  },
  rightColumn: {
    marginLeft: COLUMN_GAP / 2,
  },
  card: {
    width: '100%',
    marginBottom: COLUMN_GAP,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.white,
    ...shadows.md,
  },
  cardTouchable: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    flex: 1,
    borderRadius: borderRadius.xl,
  },
  journalOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.xl,
  },
  cornerFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    overflow: 'hidden',
  },
  cornerFoldInner: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 24,
    height: 24,
    backgroundColor: colors.parchmentWhite,
    transform: [{ rotate: '45deg' }],
    ...shadows.sm,
  },
  noteContainer: {
    flex: 1,
    position: 'relative',
    padding: spacing.md,
    justifyContent: 'center',
  },
  paperLines: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 40,
  },
  paperLine: {
    height: 1,
    backgroundColor: 'rgba(139, 90, 43, 0.08)',
    marginBottom: 20,
  },
  noteContent: {
    zIndex: 1,
  },
  noteQuote: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 48,
    color: colors.boldTerracotta + '30',
    lineHeight: 48,
    marginBottom: -12,
  },
  noteText: {
    fontFamily: typography.fontFamily.headingItalic || typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  tapeDecoration: {
    position: 'absolute',
    top: -4,
    left: '30%',
    right: '30%',
    alignItems: 'center',
  },
  tape: {
    width: 50,
    height: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    transform: [{ rotate: '-2deg' }],
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    paddingTop: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  contentOverlayNoImage: {
    position: 'relative',
    paddingTop: 0,
    marginTop: 'auto',
  },
  noteOverlay: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  noteOverlayText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.midnightNavy,
    lineHeight: 16,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  hashtagBadge: {
    backgroundColor: colors.boldTerracotta + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  hashtagText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.boldTerracotta,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reactions: {
    flexDirection: 'row',
  },
  reactionBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
    borderWidth: 1.5,
    borderColor: colors.parchmentWhite,
  },
  reactionEmoji: {
    fontSize: 11,
  },
  dateText: {
    fontFamily: typography.fontFamily.body,
    fontSize: 9,
    color: colors.gray500,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    padding: HORIZONTAL_PADDING,
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    alignItems: 'center',
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  emptyButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
});
