import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, shadows } from '@/constants/theme';

interface TexturedImageProps {
  uri: string;
  style?: ViewStyle;
  width?: number;
  height?: number;
  contentFit?: ImageContentFit;
  borderRadiusValue?: number;
  textureIntensity?: 'light' | 'medium' | 'strong';
  showVignette?: boolean;
}

/**
 * TexturedImage component that applies a subtle parchment texture overlay
 * to images to blend them with the app's "Warm & Worldly" aesthetic.
 */
export function TexturedImage({
  uri,
  style,
  width = 120,
  height = 120,
  contentFit = 'cover',
  borderRadiusValue = borderRadius.md,
  textureIntensity = 'light',
  showVignette = true,
}: TexturedImageProps) {
  // Texture overlay opacity based on intensity
  const textureOpacity = {
    light: 0.08,
    medium: 0.15,
    strong: 0.25,
  }[textureIntensity];

  // Vignette gradient colors
  const vignetteColors = showVignette
    ? ['transparent', 'transparent', 'rgba(249, 247, 242, 0.3)']
    : ['transparent', 'transparent', 'transparent'];

  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius: borderRadiusValue },
        style,
      ]}
    >
      {/* Main image */}
      <Image
        source={{ uri }}
        style={[styles.image, { borderRadius: borderRadiusValue }]}
        contentFit={contentFit}
      />

      {/* Parchment texture overlay */}
      <View
        style={[
          styles.textureOverlay,
          { borderRadius: borderRadiusValue, opacity: textureOpacity },
        ]}
      >
        {/* Simulated paper grain using multiple gradients */}
        <LinearGradient
          colors={['rgba(253, 248, 237, 0.5)', 'rgba(245, 237, 214, 0.3)', 'rgba(253, 248, 237, 0.5)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(212, 196, 168, 0.15)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Vignette effect for depth */}
      {showVignette && (
        <LinearGradient
          colors={vignetteColors as [string, string, ...string[]]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0, y: 0 }}
          style={[styles.vignetteOverlay, { borderRadius: borderRadiusValue }]}
        />
      )}

      {/* Subtle border for definition */}
      <View
        style={[
          styles.border,
          { borderRadius: borderRadiusValue },
        ]}
      />
    </View>
  );
}

/**
 * TexturedImageCard - A card version with additional styling
 * for use in galleries and lists
 */
interface TexturedImageCardProps extends TexturedImageProps {
  elevated?: boolean;
}

export function TexturedImageCard({
  elevated = true,
  ...props
}: TexturedImageCardProps) {
  return (
    <View style={[styles.cardContainer, elevated && shadows.md]}>
      <TexturedImage {...props} />
    </View>
  );
}

/**
 * PolaroidImage - A polaroid-style frame for special moments
 */
interface PolaroidImageProps {
  uri: string;
  caption?: string;
  size?: 'small' | 'medium' | 'large';
  rotation?: number;
}

export function PolaroidImage({
  uri,
  caption,
  size = 'medium',
  rotation = 0,
}: PolaroidImageProps) {
  const dimensions = {
    small: { width: 100, imageHeight: 80, padding: 8 },
    medium: { width: 140, imageHeight: 112, padding: 10 },
    large: { width: 180, imageHeight: 144, padding: 12 },
  }[size];

  return (
    <View
      style={[
        styles.polaroidContainer,
        {
          width: dimensions.width,
          padding: dimensions.padding,
          transform: [{ rotate: `${rotation}deg` }],
        },
      ]}
    >
      <TexturedImage
        uri={uri}
        width={dimensions.width - dimensions.padding * 2}
        height={dimensions.imageHeight}
        borderRadiusValue={2}
        textureIntensity="medium"
        showVignette={false}
      />
      {caption && (
        <View style={styles.polaroidCaption}>
          <View style={styles.captionText}>
            {/* Handwriting-style placeholder */}
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * CircularTexturedImage - For avatar-style displays
 */
interface CircularTexturedImageProps {
  uri: string;
  size?: number;
  borderWidth?: number;
  borderColor?: string;
}

export function CircularTexturedImage({
  uri,
  size = 60,
  borderWidth = 3,
  borderColor = colors.white,
}: CircularTexturedImageProps) {
  return (
    <View
      style={[
        styles.circularContainer,
        {
          width: size + borderWidth * 2,
          height: size + borderWidth * 2,
          borderRadius: (size + borderWidth * 2) / 2,
          borderWidth,
          borderColor,
        },
      ]}
    >
      <TexturedImage
        uri={uri}
        width={size}
        height={size}
        borderRadiusValue={size / 2}
        textureIntensity="light"
        showVignette={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(212, 196, 168, 0.3)',
  },
  cardContainer: {
    backgroundColor: colors.parchmentWhite,
    borderRadius: borderRadius.md,
  },
  // Polaroid styles
  polaroidContainer: {
    backgroundColor: colors.white,
    borderRadius: 4,
    ...shadows.md,
    paddingBottom: 24,
  },
  polaroidCaption: {
    marginTop: 8,
    alignItems: 'center',
  },
  captionText: {
    height: 12,
  },
  // Circular styles
  circularContainer: {
    ...shadows.md,
  },
});
