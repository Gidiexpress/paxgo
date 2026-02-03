import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isInitializing, setIsInitializing] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false); // Track recording state without re-renders
  const isOperationInProgress = useRef(false); // Mutex to prevent concurrent operations

  const { transcribeAudio, isLoading: isTranscribing, error, reset: resetTranscription } = useAudioTranscription({
    onSuccess: (text) => {
      if (text && text.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onTranscriptionComplete(text.trim());
      }
    },
    onError: (err) => {
      console.error('Transcription error:', err);
      // Only show error haptic for actual transcription failures, not initialization
      if (isRecordingRef.current === false) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    },
  });

  // Animation values
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const waveScale1 = useSharedValue(1);
  const waveScale2 = useSharedValue(1);
  const waveScale3 = useSharedValue(1);

  // Initialize audio system on mount
  useEffect(() => {
    initializeAudio();
    return () => {
      // Reset all refs and cleanup
      isRecordingRef.current = false;
      isOperationInProgress.current = false;
      cleanupRecording();
    };
  }, []);

  // Pre-initialize audio system to avoid first-click delays
  const initializeAudio = useCallback(async () => {
    try {
      // Check permissions first
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');

      if (status === 'granted') {
        // Pre-configure audio mode to avoid delays on first recording
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        setAudioReady(true);
      }
    } catch (err) {
      console.warn('Audio initialization warning:', err);
      // Don't show error to user - just allow manual retry
      setPermissionStatus('undetermined');
    }
  }, []);

  // Robust cleanup function for recording resources
  const cleanupRecording = useCallback(async (recording?: Audio.Recording | null) => {
    // Clear any active interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Use provided recording or the current ref
    const recordingToCleanup = recording || recordingRef.current;

    if (recordingToCleanup) {
      try {
        // Always attempt to stop and unload, regardless of current state
        // This handles all states: prepared, recording, stopped, etc.
        await recordingToCleanup.stopAndUnloadAsync();
      } catch (err) {
        // Recording might be in a state where stopAndUnloadAsync fails
        // Try alternative cleanup approaches
        try {
          // If stop failed, maybe it's not recording - just try to unload
          const status = await recordingToCleanup.getStatusAsync();
          if (status.canRecord && !status.isRecording) {
            // It's prepared but not recording - try to unload by stopping
            await recordingToCleanup.stopAndUnloadAsync();
          }
        } catch {
          // Final fallback - recording is likely already unloaded
        }
      }

      // Only clear the ref if we're cleaning up the current recording
      if (!recording || recording === recordingRef.current) {
        recordingRef.current = null;
      }
    }
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

  const startRecording = async () => {
    // Prevent double-starts or concurrent operations
    if (isRecordingRef.current || isInitializing || isOperationInProgress.current) {
      return;
    }

    // Set mutex to prevent concurrent operations
    isOperationInProgress.current = true;

    // Check permissions if not already granted
    if (permissionStatus !== 'granted') {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermissionStatus('denied');
        isOperationInProgress.current = false;
        return;
      }
      setPermissionStatus('granted');
    }

    setIsInitializing(true);

    try {
      // Provide immediate haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Ensure audio mode is set (may already be set from initialization)
      if (!audioReady) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        setAudioReady(true);
      }

      // CRITICAL: Clean up any existing recording first with robust cleanup
      if (recordingRef.current) {
        await cleanupRecording(recordingRef.current);
        recordingRef.current = null;
        // Small delay to ensure system is fully released
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create and start new recording
      const recording = new Audio.Recording();

      try {
        await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      } catch (prepareError) {
        // If prepare fails, the system might need a reset
        console.warn('Prepare failed, resetting audio:', prepareError);

        // Reset audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        await new Promise(resolve => setTimeout(resolve, 50));
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        // Try once more with a fresh recording object
        const freshRecording = new Audio.Recording();
        await freshRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await freshRecording.startAsync();

        recordingRef.current = freshRecording;
        isRecordingRef.current = true;
        setIsRecording(true);
        setRecordingDuration(0);
        setIsInitializing(false);
        isOperationInProgress.current = false;

        // Start duration counter
        durationIntervalRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);

        return;
      }

      await recording.startAsync();

      recordingRef.current = recording;
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingDuration(0);
      setIsInitializing(false);
      isOperationInProgress.current = false;

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.warn('Recording setup issue:', err);
      setIsInitializing(false);
      isRecordingRef.current = false;
      setIsRecording(false);
      isOperationInProgress.current = false;

      // Clean up any partial recording
      if (recordingRef.current) {
        await cleanupRecording(recordingRef.current);
        recordingRef.current = null;
      }

      // Provide subtle feedback but don't alarm the user
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Reset audio system for next attempt
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        await new Promise(resolve => setTimeout(resolve, 50));
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        setAudioReady(true);
      } catch {
        // Silent fail - will retry on next press
        setAudioReady(false);
      }
    }
  };

  const stopRecording = async () => {
    // Only proceed if we're actually recording or have a recording object
    if (!isRecordingRef.current && !recordingRef.current) {
      setIsInitializing(false);
      isOperationInProgress.current = false;
      return;
    }

    const currentDuration = recordingDuration;
    const currentRecording = recordingRef.current;

    // Immediately mark as no longer recording to prevent state issues
    isRecordingRef.current = false;
    recordingRef.current = null;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Stop duration counter
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Update UI state
      setIsRecording(false);
      setIsInitializing(false);

      // Get URI before stopping (more reliable)
      let uri: string | null = null;
      if (currentRecording) {
        try {
          uri = currentRecording.getURI();
        } catch {
          // URI might not be available yet
        }

        // Stop and unload the recording
        try {
          await currentRecording.stopAndUnloadAsync();
        } catch (stopErr) {
          // Try to get URI after stop attempt if we didn't get it before
          if (!uri) {
            try {
              uri = currentRecording.getURI();
            } catch {
              // Final URI attempt failed
            }
          }
        }
      }

      // Only transcribe if we have a valid recording of sufficient length
      if (uri && currentDuration >= 1) {
        // Reset any previous transcription errors before new attempt
        resetTranscription?.();
        await transcribeAudio({ audioUri: uri, language: 'en' });
      } else if (currentDuration < 1 && currentDuration > 0) {
        // Recording was too short - subtle feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setRecordingDuration(0);
      isOperationInProgress.current = false;

    } catch (err) {
      console.warn('Recording stop issue:', err);
      setIsRecording(false);
      setIsInitializing(false);
      setRecordingDuration(0);
      isOperationInProgress.current = false;

      // Ensure cleanup of the recording object
      if (currentRecording) {
        try {
          await currentRecording.stopAndUnloadAsync();
        } catch {
          // Ignore - best effort cleanup
        }
      }
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

  // Show transcribing state
  if (isTranscribing) {
    return (
      <View style={styles.container}>
        <View style={styles.transcribingContainer}>
          <ActivityIndicator size="small" color={colors.boldTerracotta} />
          <Text style={styles.transcribingText}>Listening...</Text>
        </View>
      </View>
    );
  }

  // Show initializing state (brief, during first press)
  if (isInitializing && !isRecording) {
    return (
      <View style={styles.container}>
        <View style={styles.buttonWrapper}>
          <View style={[styles.micButton, styles.micButtonInitializing]}>
            <ActivityIndicator size="small" color={colors.boldTerracotta} />
          </View>
        </View>
        <Text style={styles.hintText}>Preparing...</Text>
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
        delayPressIn={0}
        delayPressOut={0}
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
          <Animated.View style={styles.recordingIndicatorPulse} />
          <View style={styles.recordingIndicator} />
          <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
        </View>
      )}

      {!isRecording && (
        <Text style={styles.hintText}>
          {permissionStatus === 'denied'
            ? 'Tap to enable mic'
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
    backgroundColor: colors.champagneGold,
    opacity: 0.3,
  },
  glow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.champagneGold,
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
    backgroundColor: colors.champagneGold,
    borderColor: colors.goldDark,
  },
  micButtonDisabled: {
    backgroundColor: colors.gray200,
    borderColor: colors.gray300,
    opacity: 0.5,
  },
  micButtonInitializing: {
    backgroundColor: colors.warmCream,
    borderColor: colors.gray200,
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
    backgroundColor: colors.champagneGold,
  },
  recordingIndicatorPulse: {
    position: 'absolute',
    left: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.champagneGold,
    opacity: 0.4,
  },
  durationText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.champagneGold,
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
    color: colors.champagneGold,
  },
});
