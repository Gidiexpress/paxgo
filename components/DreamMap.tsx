import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop, Ellipse, Text as SvgText } from 'react-native-svg';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors, typography, borderRadius, shadows, spacing } from '@/constants/theme';
import { ProofEntry } from '@/types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

interface DreamMapProps {
  progress: number; // 0 to 1
  destination?: string;
  proofs?: ProofEntry[]; // Photos to display as pins
  onPinPress?: (proof: ProofEntry) => void;
}

// Photo pin component that appears along the journey
interface PhotoPinProps {
  x: number;
  y: number;
  imageUri?: string;
  delay: number;
  onPress?: () => void;
}

function PhotoPin({ x, y, imageUri, delay, onPress }: PhotoPinProps) {
  const scale = useSharedValue(0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    // Gentle floating animation
    bounce.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(-3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: bounce.value },
    ],
  }));

  return (
    <Animated.View style={[styles.photoPinContainer, { left: x - 20, top: y - 45 }, animatedStyle]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.photoPinWrapper}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoPinImage} contentFit="cover" />
          ) : (
            <View style={styles.photoPinPlaceholder}>
              <Text style={styles.photoPinEmoji}>📸</Text>
            </View>
          )}
          <View style={styles.photoPinPointer} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Animated bloom flower that appears at milestones
interface BloomFlowerProps {
  x: number;
  y: number;
  delay: number;
  color: string;
  size?: number;
}

function BloomFlower({ x, y, delay, color, size = 20 }: BloomFlowerProps) {
  const petalScale = useSharedValue(0);
  const centerScale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    petalScale.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 150 })
    );

    centerScale.value = withDelay(
      delay + 200,
      withSpring(1, { damping: 10, stiffness: 180 })
    );

    rotation.value = withDelay(
      delay,
      withTiming(360, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const petalProps = useAnimatedProps(() => ({
    transform: [{ scale: petalScale.value }],
    opacity: petalScale.value,
  }));

  const centerProps = useAnimatedProps(() => ({
    transform: [{ scale: centerScale.value }],
  }));

  return (
    <G x={x} y={y}>
      {/* Petals */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <AnimatedCircle
          key={angle}
          cx={Math.cos((angle * Math.PI) / 180) * (size / 3)}
          cy={Math.sin((angle * Math.PI) / 180) * (size / 3)}
          r={size / 3}
          fill={color}
          opacity={0.8}
          animatedProps={petalProps}
        />
      ))}
      {/* Center */}
      <AnimatedCircle
        cx={0}
        cy={0}
        r={size / 4}
        fill={colors.champagneGold}
        animatedProps={centerProps}
      />
    </G>
  );
}

export function DreamMap({ progress, destination = 'Your Dream', proofs = [], onPinPress }: DreamMapProps) {
  const { width } = Dimensions.get('window');
  const mapWidth = width - 64;
  const mapHeight = 200;

  // Animated values
  const pathProgress = useSharedValue(0);
  const markerPulse = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate path drawing
    pathProgress.value = withTiming(progress, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });

    // Pulse animation for current position
    markerPulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );

    // Glow effect
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200 }),
        withTiming(0.2, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [progress]);

  // Calculate positions
  const startX = mapWidth * 0.12;
  const startY = mapHeight * 0.65;
  const endX = mapWidth * 0.88;
  const endY = mapHeight * 0.35;

  // Create curved path
  const pathD = `M ${startX} ${startY} Q ${mapWidth * 0.3} ${mapHeight * 0.4} ${mapWidth * 0.5} ${mapHeight * 0.5} T ${endX} ${endY}`;

  // Calculate current position along the path
  const currentX = startX + (endX - startX) * progress;
  const currentY = startY + (endY - startY) * Math.pow(progress, 0.7) - Math.sin(progress * Math.PI) * 30;

  // Calculate photo pin positions (distribute along the path based on progress)
  const getPinPosition = (index: number, total: number) => {
    const pinProgress = ((index + 1) / (total + 1)) * progress;
    return {
      x: startX + (endX - startX) * pinProgress,
      y: startY + (endY - startY) * Math.pow(pinProgress, 0.7) - Math.sin(pinProgress * Math.PI) * 30,
    };
  };

  // Milestone positions (at 25%, 50%, 75%)
  const milestonePositions = [0.25, 0.5, 0.75].map((p) => ({
    x: startX + (endX - startX) * p,
    y: startY + (endY - startY) * Math.pow(p, 0.7) - Math.sin(p * Math.PI) * 30,
    achieved: progress >= p,
  }));

  const pathAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(pathProgress.value, [0, 1], [300, 0]),
  }));

  const markerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: markerPulse.value }],
  }));

  const glowAnimatedProps = useAnimatedProps(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dream Map</Text>

      <View style={styles.mapContainer}>
        <Svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
          <Defs>
            {/* Glow gradient */}
            <RadialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.champagneGold} stopOpacity={0.5} />
              <Stop offset="100%" stopColor={colors.champagneGold} stopOpacity={0} />
            </RadialGradient>

            {/* Path glow */}
            <RadialGradient id="markerGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.vibrantTeal} stopOpacity={0.8} />
              <Stop offset="100%" stopColor={colors.vibrantTeal} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* Decorative background elements */}
          <G opacity={0.1}>
            {/* Abstract landscape shapes */}
            <Ellipse cx={mapWidth * 0.15} cy={mapHeight * 0.75} rx={40} ry={15} fill={colors.midnightNavy} />
            <Ellipse cx={mapWidth * 0.5} cy={mapHeight * 0.8} rx={60} ry={20} fill={colors.midnightNavy} />
            <Ellipse cx={mapWidth * 0.85} cy={mapHeight * 0.7} rx={35} ry={12} fill={colors.midnightNavy} />
          </G>

          {/* Journey path - dashed (incomplete) */}
          <Path
            d={pathD}
            stroke={colors.gray300}
            strokeWidth={3}
            strokeDasharray="8,6"
            fill="none"
          />

          {/* Journey path - solid (completed) */}
          <AnimatedPath
            d={pathD}
            stroke={colors.boldTerracotta}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="300"
            animatedProps={pathAnimatedProps}
          />

          {/* Milestone blooms */}
          {milestonePositions.map((pos, i) => (
            pos.achieved && (
              <BloomFlower
                key={i}
                x={pos.x}
                y={pos.y + 5}
                delay={500 + i * 300}
                color={i === 0 ? colors.tealLight : i === 1 ? colors.terracottaLight : colors.goldLight}
                size={i === 1 ? 24 : 18}
              />
            )
          ))}

          {/* Start point */}
          <G>
            <Circle
              cx={startX}
              cy={startY}
              r={12}
              fill={colors.parchmentWhite}
              stroke={colors.midnightNavy}
              strokeWidth={2}
            />
            <Circle cx={startX} cy={startY} r={6} fill={colors.midnightNavy} />
            <Circle cx={startX} cy={startY} r={3} fill={colors.white} />
          </G>

          {/* Current position glow */}
          {progress > 0 && progress < 1 && (
            <AnimatedCircle
              cx={currentX}
              cy={currentY}
              r={25}
              fill="url(#markerGlow)"
              animatedProps={glowAnimatedProps}
            />
          )}

          {/* Current position marker */}
          {progress > 0 && progress < 1 && (
            <G>
              <Circle
                cx={currentX}
                cy={currentY}
                r={14}
                fill={colors.vibrantTeal}
                stroke={colors.white}
                strokeWidth={3}
              />
              <Circle cx={currentX} cy={currentY} r={6} fill={colors.white} />
              {/* Direction indicator */}
              <Path
                d={`M ${currentX - 4} ${currentY - 2} l 4 -5 l 4 5 z`}
                fill={colors.white}
              />
            </G>
          )}

          {/* Destination marker with glow */}
          <G>
            <AnimatedCircle
              cx={endX}
              cy={endY}
              r={30}
              fill="url(#glowGradient)"
              animatedProps={glowAnimatedProps}
            />
            <Circle
              cx={endX}
              cy={endY}
              r={14}
              fill={colors.champagneGold}
              stroke={colors.goldDark}
              strokeWidth={3}
            />
            <Circle cx={endX} cy={endY} r={6} fill={colors.goldDark} />
            {/* Star in center */}
            <SvgText
              x={endX}
              y={endY + 4}
              fontSize={10}
              fill={colors.white}
              textAnchor="middle"
            >
              ★
            </SvgText>
          </G>
        </Svg>

        {/* Photo pins overlay */}
        {proofs.slice(0, 5).map((proof, index) => {
          const pos = getPinPosition(index, Math.min(proofs.length, 5));
          return (
            <PhotoPin
              key={proof.id}
              x={pos.x}
              y={pos.y}
              imageUri={proof.imageUri}
              delay={800 + index * 200}
              onPress={() => onPinPress?.(proof)}
            />
          );
        })}

        {/* Destination label */}
        <View style={[styles.destinationLabel, { left: endX - 40, top: endY - 45 }]}>
          <Text style={styles.destinationEmoji}>🌟</Text>
          <Text style={styles.destinationText}>{destination}</Text>
        </View>

        {/* Progress badge */}
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          <Text style={styles.progressLabel}>of your journey</Text>
        </View>

        {/* Milestone indicators */}
        <View style={styles.milestoneIndicators}>
          {milestonePositions.map((pos, i) => (
            <View key={i} style={[styles.milestoneIndicator, pos.achieved && styles.milestoneAchieved]}>
              <Text style={styles.milestoneText}>{(i + 1) * 25}%</Text>
            </View>
          ))}
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
    paddingBottom: spacing.md,
  },
  destinationLabel: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  destinationEmoji: {
    fontSize: 16,
  },
  destinationText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.midnightNavy,
    marginTop: 2,
  },
  progressBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: colors.boldTerracotta,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  progressText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.white,
    textAlign: 'center',
  },
  progressLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  milestoneIndicators: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  milestoneIndicator: {
    backgroundColor: colors.gray200,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  milestoneAchieved: {
    backgroundColor: colors.vibrantTeal,
  },
  milestoneText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.white,
  },
  // Photo pin styles
  photoPinContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  photoPinWrapper: {
    alignItems: 'center',
  },
  photoPinImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.white,
    ...shadows.md,
  },
  photoPinPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.warmCream,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  photoPinEmoji: {
    fontSize: 16,
  },
  photoPinPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.white,
    marginTop: -2,
  },
});
