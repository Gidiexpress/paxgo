import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, typography, borderRadius, spacing } from '@/constants/theme';
import { useProofs } from '@/hooks/useStorage';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { SignatureCanvas } from '@/components/vault/SignatureCanvas';
import { SimpleVoiceRecorder } from '@/components/vault/SimpleVoiceRecorder';
import { useNewell } from '@/hooks/useNewell';

type CaptureMode = 'photo' | 'voice' | 'signature';
type Category = 'action' | 'insight' | 'milestone';

export default function CaptureProofScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ actionId?: string; actionTitle?: string }>();
  const { addProof } = useProofs();
  const { showSuccess, showError } = useSnackbar();
  const { analyzeImage, transcribeAudio } = useNewell();

  const [mode, setMode] = useState<CaptureMode>('photo');
  const [category, setCategory] = useState<Category>('action');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiVisionComment, setAiVisionComment] = useState<string | null>(null);
  const [voiceSummary, setVoiceSummary] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showError('Camera permission required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Analyze with AI Vision
      analyzeWithAI(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('Photo library permission required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Analyze with AI Vision
      analyzeWithAI(result.assets[0].uri);
    }
  };

  const analyzeWithAI = async (uri: string) => {
    try {
      setIsProcessing(true);
      const analysis = await analyzeImage(uri, 'What achievement or progress do you see in this image? Provide an encouraging, specific comment about what Gabby notices.');
      setAiVisionComment(analysis);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('AI Vision analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceRecorded = async (uri: string) => {
    setVoiceUri(uri);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Transcribe and summarize
    try {
      setIsProcessing(true);
      const transcription = await transcribeAudio(uri);
      if (transcription) {
        setNote(transcription);
        // Generate reflection summary
        const summary = await generateReflectionSummary(transcription);
        setVoiceSummary(summary);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Voice transcription failed:', error);
      showError('Could not transcribe audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateReflectionSummary = async (transcript: string): Promise<string> => {
    // Use Newell AI to create a reflective summary
    const prompt = `Based on this voice note: "${transcript}"\n\nCreate a brief, thoughtful "Daily Reflection" that captures the essence of their achievement and growth. Keep it to 1-2 sentences.`;

    try {
      // This would use Newell text generation - simplified for now
      return `Reflection: You're taking meaningful steps forward by ${transcript.slice(0, 100)}...`;
    } catch {
      return transcript;
    }
  };

  const handleSignatureComplete = (svg: string) => {
    setSignatureData(svg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSeal = async () => {
    if (!note.trim() && !imageUri && !voiceUri && !signatureData) {
      showError('Add some content to seal this win');
      return;
    }

    setIsProcessing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const hashtagList = hashtags
        .split(/[,\s#]+/)
        .filter((tag) => tag.trim().length > 0);

      await addProof({
        actionId: params.actionId || 'general',
        imageUri: imageUri || undefined,
        voiceNoteUri: voiceUri || undefined,
        voiceTranscript: mode === 'voice' ? note : undefined,
        voiceSummary: voiceSummary || undefined,
        signatureData: signatureData || undefined,
        note: note.trim() || params.actionTitle || 'Achievement sealed',
        hashtags: hashtagList,
        reactions: [],
        category,
        aiVisionComment: aiVisionComment || undefined,
        isSealed: true,
        sealedAt: new Date().toISOString(),
      });

      showSuccess('Win sealed into the Vault! 🔒', { icon: '✨', duration: 3000 });

      // Navigate back with sealing animation trigger
      router.back();
    } catch (error) {
      console.error('Failed to seal proof:', error);
      showError('Failed to seal win. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderModeContent = () => {
    switch (mode) {
      case 'photo':
        return (
          <View style={styles.modeContent}>
            {imageUri ? (
              <View style={styles.imagePreview}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={handlePickImage}
                >
                  <Text style={styles.changeButtonText}>Change Photo</Text>
                </TouchableOpacity>

                {isProcessing && (
                  <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color={colors.vibrantTeal} />
                    <Text style={styles.processingText}>Gabby is analyzing...</Text>
                  </View>
                )}

                {aiVisionComment && (
                  <Animated.View entering={FadeIn} style={styles.aiComment}>
                    <View style={styles.gabbyBadge}>
                      <Text style={styles.gabbyBadgeText}>Gabby</Text>
                    </View>
                    <Text style={styles.aiCommentText}>{aiVisionComment}</Text>
                  </Animated.View>
                )}
              </View>
            ) : (
              <View style={styles.photoButtons}>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={handleTakePhoto}
                >
                  <LinearGradient
                    colors={[colors.vibrantTeal, colors.tealDark]}
                    style={styles.photoButtonGradient}
                  >
                    <Text style={styles.photoButtonIcon}>📷</Text>
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={handlePickImage}
                >
                  <LinearGradient
                    colors={[colors.vibrantTeal, colors.tealDark]}
                    style={styles.photoButtonGradient}
                  >
                    <Text style={styles.photoButtonIcon}>🖼️</Text>
                    <Text style={styles.photoButtonText}>Choose Photo</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'voice':
        return (
          <View style={styles.modeContent}>
            <SimpleVoiceRecorder onRecordingComplete={handleVoiceRecorded} />

            {isProcessing && (
              <View style={styles.processingCard}>
                <ActivityIndicator size="small" color={colors.vibrantTeal} />
                <Text style={styles.processingText}>Transcribing...</Text>
              </View>
            )}

            {voiceSummary && (
              <Animated.View entering={FadeIn} style={styles.reflectionCard}>
                <Text style={styles.reflectionLabel}>Daily Reflection</Text>
                <Text style={styles.reflectionText}>{voiceSummary}</Text>
              </Animated.View>
            )}
          </View>
        );

      case 'signature':
        return (
          <View style={styles.modeContent}>
            <Text style={styles.signaturePrompt}>
              Sign your commitment with your finger:
            </Text>
            <SignatureCanvas
              onSignatureComplete={handleSignatureComplete}
              onClear={() => setSignatureData(null)}
            />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1A2E', '#16213E']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seal the Win</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing['4xl'] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Mode Selector */}
          <Animated.View entering={FadeIn} style={styles.modeSelector}>
            {(['photo', 'voice', 'signature'] as CaptureMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeTab, mode === m && styles.modeTabActive]}
                onPress={() => {
                  setMode(m);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={styles.modeIcon}>
                  {m === 'photo' ? '📸' : m === 'voice' ? '🎙️' : '✍️'}
                </Text>
                <Text
                  style={[
                    styles.modeText,
                    mode === m && styles.modeTextActive,
                  ]}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Mode Content */}
          <Animated.View entering={FadeInDown.delay(100)}>
            {renderModeContent()}
          </Animated.View>

          {/* Note Input */}
          {mode !== 'voice' && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.noteSection}>
              <Text style={styles.sectionTitle}>Add a Note</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Describe your win..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={280}
              />
              <Text style={styles.characterCount}>{note.length}/280</Text>
            </Animated.View>
          )}

          {/* Category Selector */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryButtons}>
              {(['action', 'insight', 'milestone'] as Category[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive,
                    category === cat && cat === 'insight' && styles.categoryButtonInsight,
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat === 'action' ? '⚡ Action' : cat === 'insight' ? '💎 Insight' : '🏆 Milestone'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Hashtags */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.hashtagSection}>
            <Text style={styles.sectionTitle}>Tags (optional)</Text>
            <TextInput
              style={styles.hashtagInput}
              placeholder="#boldmove #progress"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={hashtags}
              onChangeText={setHashtags}
            />
          </Animated.View>

          {/* Seal Button */}
          <Animated.View entering={FadeInDown.delay(500)}>
            <TouchableOpacity
              style={styles.sealButton}
              onPress={handleSeal}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={[colors.champagneGold, colors.goldDark]}
                style={styles.sealButtonGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.sealButtonIcon}>🔒</Text>
                    <Text style={styles.sealButtonText}>Seal Into Vault</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.champagneGold,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.champagneGold,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeTabActive: {
    backgroundColor: 'rgba(46, 196, 182, 0.2)',
    borderColor: colors.vibrantTeal,
  },
  modeIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  modeText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  modeTextActive: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.vibrantTeal,
  },
  modeContent: {
    marginBottom: spacing.xl,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  photoButtonGradient: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  photoButtonIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  photoButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  imagePreview: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  previewImage: {
    width: '100%',
    height: 300,
  },
  changeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  changeButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.white,
    marginTop: spacing.sm,
  },
  aiComment: {
    backgroundColor: 'rgba(46, 196, 182, 0.15)',
    padding: spacing.md,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.vibrantTeal,
  },
  gabbyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.vibrantTeal,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  gabbyBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.white,
  },
  aiCommentText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 196, 182, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  reflectionCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  reflectionLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
    marginBottom: spacing.xs,
  },
  reflectionText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.white,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  signaturePrompt: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  noteSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
    marginBottom: spacing.md,
  },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.white,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  characterCount: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(46, 196, 182, 0.2)',
    borderColor: colors.vibrantTeal,
  },
  categoryButtonInsight: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: colors.champagneGold,
  },
  categoryButtonText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  categoryButtonTextActive: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.white,
  },
  hashtagSection: {
    marginBottom: spacing.xl,
  },
  hashtagInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sealButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: colors.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  sealButtonGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  sealButtonIcon: {
    fontSize: 24,
  },
  sealButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.white,
  },
});
