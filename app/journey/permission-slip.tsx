import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useAuth } from '@fastshot/auth';
import { useTextGeneration } from '@fastshot/ai';
import {
  colors,
  typography,
  borderRadius,
  spacing,
  shadows,
} from '@/constants/theme';
import {
  DigitalPermissionSlip,
  PermissionSlipStyleSelector,
} from '@/components/DigitalPermissionSlip';
import { PermissionSlipVisualStyle } from '@/types/database';
import {
  createPermissionSlip,
  signPermissionSlip,
  savePermissionSlipAsProof,
} from '@/services/permissionSlipService';
import {
  generatePermissionStatement,
  getUserLatestFiveWhysSession,
} from '@/services/fiveWhysService';
import { ConfettiAnimation } from '@/components/ConfettiAnimation';

const PERMISSION_SLIP_KEY = '@boldmove_permission_slip';

export default function PermissionSlipScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { generateText, isLoading: aiLoading } = useTextGeneration();
  const permissionSlipRef = useRef<View>(null);

  // State
  const [step, setStep] = useState<'style' | 'preview' | 'signed'>('style');
  const [selectedStyle, setSelectedStyle] = useState<PermissionSlipVisualStyle>('minimalist');
  const [permissionStatement, setPermissionStatement] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [slipId, setSlipId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load data and generate permission statement
  useEffect(() => {
    const generateContent = async () => {
      setIsGenerating(true);
      try {
        const [storedDream, storedMotivation] = await Promise.all([
          AsyncStorage.getItem('@boldmove_dream'),
          AsyncStorage.getItem('@boldmove_core_motivation'),
        ]);

        const dreamText = storedDream || 'achieve my dream';
        const motivationText = storedMotivation || 'becoming my best self';
        const userName = user?.email?.split('@')[0] || 'Bold Dreamer';

        // Try to get Five Whys session for richer context
        let fiveWhysResponses: any[] = [];
        if (user?.id) {
          const session = await getUserLatestFiveWhysSession(user.id);
          if (session) {
            fiveWhysResponses = session.responses;
          }
        }

        // Generate permission statement with AI
        let statement: string;
        if (fiveWhysResponses.length > 0) {
          const rootMotivation = fiveWhysResponses[fiveWhysResponses.length - 1]?.user_response || motivationText;
          statement = await generatePermissionStatement(
            dreamText,
            rootMotivation,
            fiveWhysResponses,
            userName
          );
        } else {
          // Fallback to simpler generation
          const prompt = `Generate a personalized "Permission Statement" - a certificate of self-permission.

Their dream: "${dreamText}"
Their core motivation: "${motivationText}"

Write a Permission Statement that:
1. Starts with "I give myself permission to..." or "You have permission to..."
2. Is 2-3 powerful, meaningful sentences
3. Acknowledges their dream and deeper motivation
4. Feels like a warm, empowering gift

Keep it elegant and personal. No emojis.`;

          const response = await generateText(prompt);
          statement = response || `You have permission to pursue ${dreamText} with your whole heart. Your desire for this comes from a beautiful place within you—honor it.`;
        }

        setPermissionStatement(statement);
      } catch (error) {
        console.error('Failed to generate permission statement:', error);
        setPermissionStatement(
          'You have permission to take bold action toward your dreams. Your courage to begin is already remarkable.'
        );
      } finally {
        setIsGenerating(false);
      }
    };

    generateContent();
  }, []);

  const handleStyleSelect = (style: PermissionSlipVisualStyle) => {
    setSelectedStyle(style);
  };

  const handleContinueToPreview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('preview');
  };

  const handleBackToStyle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('style');
  };

  const handleSign = async (signature: string) => {
    setIsSaving(true);
    const now = new Date().toISOString();
    setSignatureData(signature);
    setSignedAt(now);

    try {
      // Save to Supabase
      if (user?.id) {
        const storedDream = await AsyncStorage.getItem('@boldmove_dream');
        const dreamId = storedDream ? `dream-${Date.now()}` : undefined;

        const slip = await createPermissionSlip(
          user.id,
          permissionStatement,
          selectedStyle,
          undefined, // sessionId
          dreamId
        );

        if (slip) {
          const signedSlip = await signPermissionSlip(slip.id, signature);
          if (signedSlip) {
            setSlipId(signedSlip.id);
            // Save as proof
            await savePermissionSlipAsProof(user.id, signedSlip.id);
          }
        }
      }

      // Save locally as well
      await AsyncStorage.setItem(
        PERMISSION_SLIP_KEY,
        JSON.stringify({
          statement: permissionStatement,
          style: selectedStyle,
          signature,
          signedAt: now,
        })
      );

      // Show celebration
      setShowCelebration(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setShowCelebration(false), 3000);
      setStep('signed');
    } catch (error) {
      console.error('Error saving permission slip:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      // Try to capture the permission slip as an image
      if (permissionSlipRef.current) {
        const uri = await captureRef(permissionSlipRef, {
          format: 'png',
          quality: 1,
        });

        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your Permission Slip',
            UTI: 'public.png',
          });
        } else {
          await Share.share({
            message: `My Permission Slip\n\n"${permissionStatement}"\n\nSigned on ${new Date().toLocaleDateString()}\n\n#TheBoldMove #PermissionGranted`,
          });
        }
      } else {
        // Fallback to text share
        await Share.share({
          message: `My Permission Slip\n\n"${permissionStatement}"\n\nSigned on ${new Date().toLocaleDateString()}\n\n#TheBoldMove #PermissionGranted`,
        });
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleSaveToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Please grant permission to save images');
        return;
      }

      if (permissionSlipRef.current) {
        const uri = await captureRef(permissionSlipRef, {
          format: 'png',
          quality: 1,
        });
        await MediaLibrary.saveToLibraryAsync(uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        alert('Permission slip saved to your gallery!');
      }
    } catch (error) {
      console.error('Failed to save to gallery:', error);
      alert('Failed to save image');
    }
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/journey/first-action');
  };

  const getUserName = () => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Bold Adventurer';
  };

  // Loading state
  if (isGenerating) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[colors.midnightNavy, '#0A2540']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconContainer}>
            <Animated.View
              entering={FadeIn}
              style={styles.loadingIconGlow}
            >
              <LinearGradient
                colors={[colors.champagneGold + '40', colors.champagneGold + '10', 'transparent']}
                style={styles.glowGradient}
              />
            </Animated.View>
            <Text style={styles.loadingIcon}>📜</Text>
          </View>
          <ActivityIndicator size="large" color={colors.champagneGold} style={{ marginTop: spacing.xl }} />
          <Text style={styles.loadingTitle}>Crafting Your Permission Slip...</Text>
          <Text style={styles.loadingSubtitle}>
            A personalized certificate just for you
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.midnightNavy, '#0A2540']}
        style={StyleSheet.absoluteFill}
      />

      {/* Celebration confetti */}
      <ConfettiAnimation active={showCelebration} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing['4xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <Text style={styles.headerTitle}>
            {step === 'style' ? 'Choose Your Style' : 'Your Permission Slip'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {step === 'style'
              ? 'Select a visual style for your permission slip'
              : step === 'preview'
              ? 'Sign to make it official'
              : 'Your commitment is sealed'}
          </Text>
        </Animated.View>

        {/* Step 1: Style Selection */}
        {step === 'style' && (
          <Animated.View entering={FadeIn.delay(200)}>
            <PermissionSlipStyleSelector
              selectedStyle={selectedStyle}
              onSelectStyle={handleStyleSelect}
            />

            {/* Preview of selected style */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Preview</Text>
              <DigitalPermissionSlip
                permissionStatement={permissionStatement}
                visualStyle={selectedStyle}
                userName={getUserName()}
                animated={false}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinueToPreview}
            >
              <LinearGradient
                colors={[colors.champagneGold, colors.goldDark]}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>Continue to Sign</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Step 2: Preview and Sign */}
        {step === 'preview' && (
          <Animated.View entering={FadeIn.delay(200)}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToStyle}
            >
              <Text style={styles.backButtonText}>← Change Style</Text>
            </TouchableOpacity>

            <View ref={permissionSlipRef} collapsable={false}>
              <DigitalPermissionSlip
                permissionStatement={permissionStatement}
                visualStyle={selectedStyle}
                userName={getUserName()}
                onSign={handleSign}
                showSignatureArea={true}
                animated={true}
              />
            </View>

            {isSaving && (
              <View style={styles.savingOverlay}>
                <ActivityIndicator size="large" color={colors.champagneGold} />
                <Text style={styles.savingText}>Sealing your permission slip...</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Step 3: Signed - Show options */}
        {step === 'signed' && (
          <Animated.View entering={FadeInUp.delay(200)}>
            <View ref={permissionSlipRef} collapsable={false}>
              <DigitalPermissionSlip
                permissionStatement={permissionStatement}
                visualStyle={selectedStyle}
                signatureData={signatureData}
                signedAt={signedAt}
                userName={getUserName()}
                animated={true}
              />
            </View>

            {/* Success message */}
            <View style={styles.successMessage}>
              <Text style={styles.successIcon}>✨</Text>
              <Text style={styles.successTitle}>Permission Granted!</Text>
              <Text style={styles.successText}>
                Your permission slip has been saved to your Proof Gallery.
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleContinue}
              >
                <LinearGradient
                  colors={[colors.boldTerracotta, colors.terracottaDark]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.primaryButtonText}>
                    Take My First Bold Step →
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleShare}
                >
                  <Text style={styles.secondaryButtonText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSaveToGallery}
                >
                  <Text style={styles.secondaryButtonText}>Save to Photos</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Inspirational quote */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.quoteContainer}>
          <Text style={styles.quote}>
            &quot;The permission you&apos;ve been waiting for... is the permission you give yourself.&quot;
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnightNavy,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.midnightNavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
  },
  loadingIcon: {
    fontSize: 48,
  },
  loadingTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.parchmentWhite,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginTop: spacing.sm,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.champagneGold,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  previewContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  previewLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  backButtonText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
  },
  primaryButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.glow,
  },
  buttonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius['2xl'],
  },
  savingText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.parchmentWhite,
    marginTop: spacing.md,
  },
  successMessage: {
    alignItems: 'center',
    marginVertical: spacing['2xl'],
  },
  successIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.champagneGold,
    marginBottom: spacing.sm,
  },
  successText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  actionsContainer: {
    marginBottom: spacing.xl,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
    textDecorationLine: 'underline',
  },
  quoteContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  quote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
});
