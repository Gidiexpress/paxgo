import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, borderRadius, shadows, spacing } from '@/constants/theme';
import { ProofEntry } from '@/types';
import { TexturedImage } from './TexturedImage';

interface ProofCardProps {
  proof: ProofEntry;
  onPress?: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

export function ProofCard({ proof, onPress, variant = 'default' }: ProofCardProps) {
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCompact && styles.containerCompact,
        isFeatured && styles.containerFeatured,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {proof.imageUri ? (
        <View style={styles.imageWrapper}>
          <TexturedImage
            uri={proof.imageUri}
            width={isCompact ? 140 : isFeatured ? 200 : 160}
            height={isCompact ? 80 : isFeatured ? 140 : 100}
            borderRadiusValue={0}
            textureIntensity="light"
            showVignette={true}
          />
          {/* Corner decoration */}
          <View style={styles.cornerDecor} />
        </View>
      ) : (
        <View style={[styles.notePlaceholder, isCompact && styles.notePlaceholderCompact]}>
          <LinearGradient
            colors={['#FDF8ED', '#F5EDD6']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.noteIcon}>📝</Text>
        </View>
      )}

      <View style={[styles.content, isCompact && styles.contentCompact]}>
        <Text
          style={[styles.note, isFeatured && styles.noteFeatured]}
          numberOfLines={isCompact ? 1 : 2}
        >
          {proof.note}
        </Text>

        {proof.hashtags.length > 0 && !isCompact && (
          <View style={styles.hashtags}>
            {proof.hashtags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.hashtagBadge}>
                <Text style={styles.hashtag}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.reactions}>
            {proof.reactions.slice(0, 3).map((reaction, index) => (
              <View key={index} style={styles.reactionBubble}>
                <Text style={styles.reaction}>{reaction}</Text>
              </View>
            ))}
            {proof.reactions.length === 0 && (
              // Default reactions for empty state
              <>
                <View style={styles.reactionBubble}>
                  <Text style={styles.reaction}>💚</Text>
                </View>
                <View style={styles.reactionBubble}>
                  <Text style={styles.reaction}>🧡</Text>
                </View>
              </>
            )}
          </View>

          {/* Timestamp indicator */}
          <View style={styles.timestamp}>
            <Text style={styles.timestampText}>
              {formatRelativeTime(proof.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Compact horizontal card for lists
export function ProofCardHorizontal({
  proof,
  onPress,
}: {
  proof: ProofEntry;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.horizontalContainer} onPress={onPress} activeOpacity={0.9}>
      {proof.imageUri ? (
        <TexturedImage
          uri={proof.imageUri}
          width={60}
          height={60}
          borderRadiusValue={borderRadius.md}
          textureIntensity="light"
          showVignette={false}
        />
      ) : (
        <View style={styles.horizontalPlaceholder}>
          <Text style={styles.horizontalPlaceholderIcon}>📝</Text>
        </View>
      )}

      <View style={styles.horizontalContent}>
        <Text style={styles.horizontalNote} numberOfLines={2}>
          {proof.note}
        </Text>
        <Text style={styles.horizontalDate}>
          {new Date(proof.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.horizontalReactions}>
        {proof.reactions.slice(0, 2).map((reaction, index) => (
          <Text key={index} style={styles.horizontalReaction}>
            {reaction}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
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
    width: 160,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  containerCompact: {
    width: 140,
  },
  containerFeatured: {
    width: 200,
  },
  imageWrapper: {
    position: 'relative',
  },
  cornerDecor: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 4,
  },
  notePlaceholder: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  notePlaceholderCompact: {
    height: 80,
  },
  noteIcon: {
    fontSize: 32,
  },
  content: {
    padding: spacing.sm,
  },
  contentCompact: {
    padding: spacing.xs,
  },
  note: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.midnightNavy,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  noteFeatured: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  hashtagBadge: {
    backgroundColor: colors.terracottaLight + '30',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  hashtag: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.boldTerracotta,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reactions: {
    flexDirection: 'row',
    gap: 2,
  },
  reactionBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -4,
    borderWidth: 1,
    borderColor: colors.white,
  },
  reaction: {
    fontSize: 10,
  },
  timestamp: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  timestampText: {
    fontFamily: typography.fontFamily.body,
    fontSize: 8,
    color: colors.gray500,
  },
  // Horizontal card styles
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    ...shadows.sm,
  },
  horizontalPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalPlaceholderIcon: {
    fontSize: 24,
  },
  horizontalContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  horizontalNote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
  },
  horizontalDate: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  horizontalReactions: {
    flexDirection: 'row',
    gap: 4,
  },
  horizontalReaction: {
    fontSize: 14,
  },
});
