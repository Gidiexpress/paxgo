import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, typography, borderRadius, shadows, spacing } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DreamMapProps {
  progress: number; // 0 to 1
  destination?: string;
}

export function DreamMap({ progress, destination = 'Japan' }: DreamMapProps) {
  const { width } = Dimensions.get('window');
  const mapWidth = width - 64;
  const mapHeight = 180;

  // Simplified world map path
  const worldMapPath = `
    M ${mapWidth * 0.1} ${mapHeight * 0.3}
    Q ${mapWidth * 0.15} ${mapHeight * 0.2} ${mapWidth * 0.25} ${mapHeight * 0.35}
    L ${mapWidth * 0.3} ${mapHeight * 0.45}
    Q ${mapWidth * 0.35} ${mapHeight * 0.55} ${mapWidth * 0.4} ${mapHeight * 0.5}
    L ${mapWidth * 0.5} ${mapHeight * 0.4}
    Q ${mapWidth * 0.6} ${mapHeight * 0.35} ${mapWidth * 0.65} ${mapHeight * 0.45}
    L ${mapWidth * 0.75} ${mapHeight * 0.35}
    Q ${mapWidth * 0.85} ${mapHeight * 0.3} ${mapWidth * 0.9} ${mapHeight * 0.4}
  `;

  // Calculate position along path based on progress
  const startX = mapWidth * 0.15;
  const startY = mapHeight * 0.55;
  const endX = mapWidth * 0.85;
  const endY = mapHeight * 0.35;

  const currentX = startX + (endX - startX) * progress;
  const currentY = startY + (endY - startY) * progress * Math.sin(progress * Math.PI);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dream Map</Text>

      <View style={styles.mapContainer}>
        <Svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
          {/* Background landmasses */}
          <G opacity={0.15}>
            {/* North America */}
            <Circle cx={mapWidth * 0.2} cy={mapHeight * 0.35} r={30} fill={colors.midnightNavy} />
            {/* South America */}
            <Circle cx={mapWidth * 0.25} cy={mapHeight * 0.65} r={20} fill={colors.midnightNavy} />
            {/* Europe */}
            <Circle cx={mapWidth * 0.45} cy={mapHeight * 0.3} r={15} fill={colors.midnightNavy} />
            {/* Africa */}
            <Circle cx={mapWidth * 0.48} cy={mapHeight * 0.55} r={25} fill={colors.midnightNavy} />
            {/* Asia */}
            <Circle cx={mapWidth * 0.7} cy={mapHeight * 0.35} r={35} fill={colors.midnightNavy} />
            {/* Australia */}
            <Circle cx={mapWidth * 0.8} cy={mapHeight * 0.7} r={18} fill={colors.midnightNavy} />
          </G>

          {/* Journey path */}
          <Path
            d={`M ${startX} ${startY} Q ${mapWidth * 0.5} ${mapHeight * 0.2} ${endX} ${endY}`}
            stroke={colors.boldTerracotta}
            strokeWidth={3}
            strokeDasharray="8,4"
            fill="none"
            opacity={0.5}
          />

          {/* Completed path */}
          <Path
            d={`M ${startX} ${startY} Q ${mapWidth * 0.5} ${mapHeight * 0.2} ${endX} ${endY}`}
            stroke={colors.boldTerracotta}
            strokeWidth={3}
            fill="none"
            strokeDasharray={`${progress * 250}, 250`}
          />

          {/* Start point */}
          <Circle
            cx={startX}
            cy={startY}
            r={8}
            fill={colors.parchmentWhite}
            stroke={colors.midnightNavy}
            strokeWidth={2}
          />
          <Circle cx={startX} cy={startY} r={4} fill={colors.midnightNavy} />

          {/* Current position marker */}
          <G>
            <Circle
              cx={currentX}
              cy={currentY - progress * 20}
              r={12}
              fill={colors.boldTerracotta}
            />
            <Circle
              cx={currentX}
              cy={currentY - progress * 20}
              r={6}
              fill={colors.white}
            />
            {/* Airplane icon placeholder */}
            <Path
              d={`M ${currentX - 4} ${currentY - progress * 20} l 8 0 l -4 -6 z`}
              fill={colors.white}
            />
          </G>

          {/* Destination marker */}
          <Circle
            cx={endX}
            cy={endY}
            r={10}
            fill={colors.champagneGold}
            stroke={colors.goldDark}
            strokeWidth={2}
          />
          <Circle cx={endX} cy={endY} r={4} fill={colors.goldDark} />
        </Svg>

        {/* Destination label */}
        <View style={[styles.destinationLabel, { left: endX - 30, top: endY - 35 }]}>
          <Text style={styles.destinationFlag}>🇯🇵</Text>
          <Text style={styles.destinationText}>{destination}</Text>
        </View>

        {/* Progress percentage */}
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  title: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.md,
  },
  mapContainer: {
    position: 'relative',
    backgroundColor: colors.parchmentWhite,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  destinationLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  destinationFlag: {
    fontSize: 20,
  },
  destinationText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.midnightNavy,
  },
  progressBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: colors.boldTerracotta,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.md,
  },
  progressText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
});
