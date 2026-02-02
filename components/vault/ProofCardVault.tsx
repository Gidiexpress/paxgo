import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { ProofEntry } from '@/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 3) / 2;

interface ProofCardVaultProps {
  proof: ProofEntry;
  onPress: () => void;
  index: number;
}

export function ProofCardVault({ proof, onPress, index }: ProofCardVaultProps) {
  // Determine glow color based on category
  const glowColor =
    proof.category === 'insight'
      ? colors.champagneGold
      : proof.category === 'milestone'
      ? colors.vibrantTeal
      : colors.vibrantTeal;

  // Random height variation for masonry effect
  const heights = [180, 220, 200, 240, 190, 210];
  const cardHeight = heights[index % heights.length];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={[styles.cardContainer, { width: CARD_WIDTH }]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[
          styles.card,
          {
            height: cardHeight,
            shadowColor: glowColor,
            shadowOpacity: 0.5,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          },
        ]}
      >
        {/* Glow effect */}
        <View
          style={[
            styles.glowRing,
            {
              borderColor: glowColor + '60',
            },
          ]}
        />

        {/* Image background if available */}
        {proof.imageUri ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: proof.imageUri }}
              style={styles.image}
              contentFit="cover"
            />
            {/* Dark overlay for text readability */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.imageOverlay}
            />
          </View>
        ) : (
          <LinearGradient
            colors={['rgba(26,26,46,0.9)', 'rgba(16,16,36,0.95)']}
            style={styles.noImageGradient}
          />
        )}

        {/* Content overlay with glass-morphism */}
        <BlurView intensity={20} tint="dark" style={styles.contentOverlay}>
          <View style={styles.content}>
            {/* Category badge */}
            {proof.category && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: glowColor + '30', borderColor: glowColor + '60' },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: glowColor === colors.champagneGold ? colors.champagneGold : colors.vibrantTeal },
                  ]}
                >
                  {proof.category === 'insight' ? '💎' : proof.category === 'milestone' ? '🏆' : '⚡'}
                </Text>
              </View>
            )}

            {/* Note preview */}
            <Text style={styles.noteText} numberOfLines={3}>
              {proof.note}
            </Text>

            {/* Footer indicators */}
            <View style={styles.footer}>
              {proof.voiceNoteUri && (
                <View style={styles.indicator}>
                  <Text style={styles.indicatorIcon}>🎙️</Text>
                </View>
              )}
              {proof.aiVisionComment && (
                <View style={styles.indicator}>
                  <Text style={styles.indicatorIcon}>👁️</Text>
                </View>
              )}
              {proof.signatureData && (
                <View style={styles.indicator}>
                  <Text style={styles.indicatorIcon}>✍️</Text>
                </View>
              )}
            </View>
          </View>
        </BlurView>

        {/* Sealed stamp */}
        <View style={styles.sealedStamp}>
          <Text style={styles.sealedStampText}>🔒</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    elevation: 8,
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  noImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  contentOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  content: {
    padding: spacing.md,
  },
  categoryBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
  },
  noteText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.white,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorIcon: {
    fontSize: 12,
  },
  sealedStamp: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.6)',
  },
  sealedStampText: {
    fontSize: 12,
  },
});
