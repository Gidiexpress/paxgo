import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography, borderRadius, shadows, spacing } from '@/constants/theme';
import { ProofEntry } from '@/types';

interface ProofCardProps {
  proof: ProofEntry;
  onPress?: () => void;
}

export function ProofCard({ proof, onPress }: ProofCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {proof.imageUri ? (
        <Image
          source={{ uri: proof.imageUri }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.notePlaceholder}>
          <Text style={styles.noteIcon}>📝</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.note} numberOfLines={2}>
          {proof.note}
        </Text>

        {proof.hashtags.length > 0 && (
          <View style={styles.hashtags}>
            {proof.hashtags.slice(0, 2).map((tag, index) => (
              <Text key={index} style={styles.hashtag}>
                #{tag}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.reactions}>
          {proof.reactions.slice(0, 3).map((reaction, index) => (
            <Text key={index} style={styles.reaction}>
              {reaction}
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  image: {
    width: '100%',
    height: 100,
  },
  notePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteIcon: {
    fontSize: 32,
  },
  content: {
    padding: spacing.sm,
  },
  note: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.midnightNavy,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  hashtag: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.boldTerracotta,
  },
  reactions: {
    flexDirection: 'row',
    gap: 2,
  },
  reaction: {
    fontSize: 12,
  },
});
