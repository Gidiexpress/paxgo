import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, borderRadius, spacing } from '@/constants/theme';

interface SignatureCanvasProps {
  onSignatureComplete: (svg: string) => void;
  onClear: () => void;
}

interface Point {
  x: number;
  y: number;
}

export function SignatureCanvas({ onSignatureComplete, onClear }: SignatureCanvasProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        if (currentPath.length > 0) {
          const svgPath = pointsToSvgPath(currentPath);
          setPaths((prev) => [...prev, svgPath]);
          setCurrentPath([]);

          // Notify parent with complete signature
          const completeSvg = [...paths, svgPath].join(' ');
          onSignatureComplete(completeSvg);
        }
      },
    })
  ).current;

  const pointsToSvgPath = (points: Point[]): string => {
    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  const handleClear = () => {
    setPaths([]);
    setCurrentPath([]);
    onClear();
  };

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)']}
          style={styles.canvasBackground}
        />

        <Svg style={styles.canvas}>
          {paths.map((pathData, index) => (
            <Path
              key={index}
              d={pathData}
              stroke={colors.champagneGold}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {currentPath.length > 0 && (
            <Path
              d={pointsToSvgPath(currentPath)}
              stroke={colors.champagneGold}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>

        {/* Signature line */}
        <View style={styles.signatureLine} />

        {/* Instruction text */}
        {paths.length === 0 && currentPath.length === 0 && (
          <Text style={styles.instruction}>Sign here</Text>
        )}
      </View>

      {/* Clear button */}
      {(paths.length > 0 || currentPath.length > 0) && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      )}

      {/* Info */}
      <Text style={styles.infoText}>
        Your signature seals your commitment to this achievement
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  canvasContainer: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: spacing.md,
    position: 'relative',
  },
  canvasBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  canvas: {
    flex: 1,
  },
  signatureLine: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  instruction: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(212, 175, 55, 0.5)',
    fontStyle: 'italic',
  },
  clearButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(226, 114, 91, 0.2)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(226, 114, 91, 0.4)',
    marginBottom: spacing.md,
  },
  clearButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: 'rgba(226, 114, 91, 0.9)',
  },
  infoText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    maxWidth: '80%',
  },
});
