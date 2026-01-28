import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAudioTranscription } from '@fastshot/ai';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscriptionComplete, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { transcribeAudio, isLoading: isTranscribing, error } = useAudioTranscription({
    onSuccess: (text) => {
      if (text && text.trim()) {
        onTranscriptionComplete(text.trim());
      }
    },
    onError: (err) => {
      console.error('Transcription error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  // Animation values
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const waveScale1 = useSharedValue(1);
  const waveScale2 = useSharedValue(1);
  const waveScale3 = useSharedValue(1);

  useEffect(() => {
    checkPermissions();
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowOpacity.value = withTiming(0.6, { duration: 300 });

      // Wave animations with staggered delays
      waveScale1.value = withRepeat(
        withSequence(
          withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1
      );
      waveScale2.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1
      );
      waveScale3.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(waveScale1);
      cancelAnimation(waveScale2);
      cancelAnimation(waveScale3);
      pulseScale.value = withSpring(1);
      glowOpacity.value = withTiming(0, { duration: 200 });
      waveScale1.value = 1;
      waveScale2.value = 1;
      waveScale3.value = 1;
    }
  }, [isRecording]);

  const checkPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
  };

  const startRecording = async () => {
    if (permissionStatus !== 'granted') {
      await checkPermissions();
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      setIsRecording(false);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri && recordingDuration >= 1) {
        // Transcribe the audio
        await transcribeAudio({ audioUri: uri, language: 'en' });
      }

      setRecordingDuration(0);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const waveStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale1.value }],
    opacity: 1 - (waveScale1.value - 1) / 0.8,
  }));

  const waveStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale2.value }],
    opacity: 1 - (waveScale2.value - 1) / 0.8,
  }));

  const waveStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale3.value }],
    opacity: 1 - (waveScale3.value - 1) / 0.8,
  }));

  if (isTranscribing) {
    return (
      <View style={styles.container}>
        <View style={styles.transcribingContainer}>
          <ActivityIndicator size="small" color={colors.boldTerracotta} />
          <Text style={styles.transcribingText}>Transcribing...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPressIn={startRecording}
        onPressOut={stopRecording}
        disabled={disabled || permissionStatus === 'denied'}
        activeOpacity={0.9}
        style={styles.buttonWrapper}
      >
        {/* Animated waves */}
        {isRecording && (
          <>
            <Animated.View style={[styles.wave, waveStyle1]} />
            <Animated.View style={[styles.wave, waveStyle2]} />
            <Animated.View style={[styles.wave, waveStyle3]} />
          </>
        )}

        {/* Glow effect */}
        <Animated.View style={[styles.glow, glowAnimatedStyle]} />

        {/* Main button */}
        <Animated.View
          style={[
            styles.micButton,
            isRecording && styles.micButtonRecording,
            (disabled || permissionStatus === 'denied') && styles.micButtonDisabled,
            buttonAnimatedStyle,
          ]}
        >
          <Text style={styles.micIcon}>🎙️</Text>
        </Animated.View>
      </TouchableOpacity>

      {isRecording && (
        <View style={styles.durationContainer}>
          <View style={styles.recordingIndicator} />
          <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
        </View>
      )}

      {!isRecording && (
        <Text style={styles.hintText}>
          {permissionStatus === 'denied'
            ? 'Microphone access denied'
            : 'Hold to speak'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  wave: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.boldTerracotta,
    opacity: 0.3,
  },
  glow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.boldTerracotta,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
    ...shadows.md,
  },
  micButtonRecording: {
    backgroundColor: colors.boldTerracotta,
    borderColor: colors.boldTerracotta,
  },
  micButtonDisabled: {
    backgroundColor: colors.gray200,
    borderColor: colors.gray300,
    opacity: 0.5,
  },
  micIcon: {
    fontSize: 20,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.boldTerracotta,
  },
  durationText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.boldTerracotta,
  },
  hintText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.warmCream,
    borderRadius: borderRadius.lg,
  },
  transcribingText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
  },
});
