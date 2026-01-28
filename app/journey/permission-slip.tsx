import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTextGeneration } from '@fastshot/ai';
import { useAuth } from '@fastshot/auth';
import {
  colors,
  typography,
  borderRadius,
  spacing,
  shadows,
} from '@/constants/theme';

const PERMISSION_SLIP_KEY = '@boldmove_permission_slip';

interface PermissionSlipData {
  headline: string;
  affirmation: string;
  date: string;
}

export default function PermissionSlipScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { generateText, isLoading } = useTextGeneration();

  const [slipData, setSlipData] = useState<PermissionSlipData | null>(null);
  const [isSigned, setIsSigned] = useState(false);

  // Animation values
  const shimmerPosition = useSharedValue(0);
  const sealScale = useSharedValue(0);
  const sealRotation = useSharedValue(-180);

  useEffect(() => {
    // Shimmer animation
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + shimmerPosition.value * 0.4,
  }));

  const sealStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: sealScale.value },
      { rotate: `${sealRotation.value}deg` },
    ],
  }));

  // Load data and generate permission slip
  useEffect(() => {
    const generatePermissionSlip = async () => {
      try {
        const [storedDream, storedMotivation] = await Promise.all([
          AsyncStorage.getItem('@boldmove_dream'),
          AsyncStorage.getItem('@boldmove_core_motivation'),
        ]);

        const dreamText = storedDream || 'achieve my dream';
        const motivationText = storedMotivation || 'becoming my best self';

        const prompt = `Generate a personalized "Permission Slip" - a certificate of self-permission for someone embarking on a bold journey.

Their dream: "${dreamText}"
Their core motivation (why it matters): "${motivationText}"

Generate TWO things in this exact format:
HEADLINE: [A powerful 5-7 word headline granting permission, starting with "I give myself permission to..."]
AFFIRMATION: [A 2-sentence personalized affirmation that acknowledges their fear/hesitation but affirms their worthiness and capability. Make it feel like a warm hug. Include one emoji.]

Keep it genuine, not cheesy. This should feel like a premium, meaningful document.`;

        const response = await generateText(prompt);

        if (response) {
          // Parse the response
          const headlineMatch = response.match(/HEADLINE:\s*(.+)/i);
          const affirmationMatch = response.match(/AFFIRMATION:\s*(.+)/is);

          const headline = headlineMatch
            ? headlineMatch[1].trim()
            : `I give myself permission to pursue ${dreamText}`;
          const affirmation = affirmationMatch
            ? affirmationMatch[1].trim()
            : `You are worthy of this dream. Take that first step - the universe is waiting for you. ✨`;

          const data: PermissionSlipData = {
            headline,
            affirmation,
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          };

          setSlipData(data);
          await AsyncStorage.setItem(PERMISSION_SLIP_KEY, JSON.stringify(data));
        }
      } catch (error) {
        console.error('Failed to generate permission slip:', error);
        // Fallback
        setSlipData({
          headline: 'I give myself permission to take bold action',
          affirmation:
            'You are worthy of this dream. The path ahead may be uncertain, but your courage to begin is already remarkable. ✨',
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        });
      }
    };

    generatePermissionSlip();
  }, []);

  const handleSign = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSigned(true);

    // Animate the seal
    sealScale.value = withDelay(
      200,
      withSequence(
        withTiming(1.2, { duration: 300, easing: Easing.out(Easing.elastic(1)) }),
        withTiming(1, { duration: 200 })
      )
    );
    sealRotation.value = withDelay(
      200,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.elastic(1)) })
    );
  };

  const handleShare = async () => {
    if (!slipData) return;

    try {
      await Share.share({
        message: `🌟 My Permission Slip 🌟\n\n"${slipData.headline}"\n\n${slipData.affirmation}\n\nSigned on ${slipData.date}\n\n#TheBoldMove #PermissionGranted`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
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

  if (isLoading || !slipData) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.champagneGold} />
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <Text style={styles.headerTitle}>Your Permission Slip</Text>
          <Text style={styles.headerSubtitle}>
            Official authorization to be bold
          </Text>
        </Animated.View>

        {/* Certificate */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.certificateWrapper}>
          {/* Gold shimmer border */}
          <Animated.View style={[styles.shimmerBorder, shimmerStyle]}>
            <LinearGradient
              colors={[colors.champagneGold, colors.goldLight, colors.champagneGold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>

          <View style={styles.certificate}>
            {/* Decorative corners */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Certificate Header */}
            <View style={styles.certificateHeader}>
              <Text style={styles.certificateLabel}>OFFICIAL</Text>
              <Text style={styles.certificateTitle}>Permission Slip</Text>
              <View style={styles.certificateDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerIcon}>✦</Text>
                <View style={styles.dividerLine} />
              </View>
            </View>

            {/* Main Content */}
            <View style={styles.certificateBody}>
              <Text style={styles.headline}>{slipData.headline}</Text>
              <Text style={styles.affirmation}>{slipData.affirmation}</Text>
            </View>

            {/* Footer */}
            <View style={styles.certificateFooter}>
              <View style={styles.signatureSection}>
                <View style={styles.signatureLine}>
                  {isSigned && (
                    <Animated.Text
                      entering={FadeIn}
                      style={styles.signatureText}
                    >
                      {getUserName()}
                    </Animated.Text>
                  )}
                </View>
                <Text style={styles.signatureLabel}>Your Signature</Text>
              </View>

              <View style={styles.dateSection}>
                <Text style={styles.dateText}>{slipData.date}</Text>
                <Text style={styles.dateLabel}>Date Issued</Text>
              </View>
            </View>

            {/* Seal */}
            {isSigned && (
              <Animated.View style={[styles.seal, sealStyle]}>
                <LinearGradient
                  colors={[colors.champagneGold, colors.goldDark]}
                  style={styles.sealGradient}
                >
                  <Text style={styles.sealText}>APPROVED</Text>
                  <Text style={styles.sealSubtext}>✓</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          entering={FadeInUp.delay(400)}
          style={styles.actionsContainer}
        >
          {!isSigned ? (
            <TouchableOpacity style={styles.signButton} onPress={handleSign}>
              <LinearGradient
                colors={[colors.champagneGold, colors.goldDark]}
                style={styles.signGradient}
              >
                <Text style={styles.signText}>Sign & Accept</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <LinearGradient
                  colors={[colors.boldTerracotta, colors.terracottaDark]}
                  style={styles.continueGradient}
                >
                  <Text style={styles.continueText}>Take My First Bold Step →</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareText}>Share My Permission Slip</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

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
    paddingBottom: spacing['4xl'],
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
  },
  certificateWrapper: {
    position: 'relative',
    marginBottom: spacing['2xl'],
  },
  shimmerBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: borderRadius['2xl'] + 3,
    overflow: 'hidden',
  },
  shimmerGradient: {
    flex: 1,
  },
  certificate: {
    backgroundColor: colors.parchmentWhite,
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    position: 'relative',
    overflow: 'hidden',
    ...shadows.xl,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.champagneGold,
    opacity: 0.5,
  },
  cornerTL: {
    top: spacing.lg,
    left: spacing.lg,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    top: spacing.lg,
    right: spacing.lg,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    bottom: spacing.lg,
    left: spacing.lg,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: spacing.lg,
    right: spacing.lg,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  certificateHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  certificateLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.champagneGold,
    letterSpacing: 4,
  },
  certificateTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.midnightNavy,
    marginTop: spacing.sm,
  },
  certificateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.champagneGold,
    opacity: 0.5,
  },
  dividerIcon: {
    fontSize: 12,
    color: colors.champagneGold,
  },
  certificateBody: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  headline: {
    fontFamily: typography.fontFamily.headingItalic,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: spacing.xl,
  },
  affirmation: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: spacing.md,
  },
  certificateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  signatureSection: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.midnightNavy,
    minHeight: 30,
    justifyContent: 'flex-end',
    paddingBottom: spacing.xs,
  },
  signatureText: {
    fontFamily: typography.fontFamily.headingItalic,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
  },
  signatureLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  dateSection: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
  },
  dateLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  seal: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing['4xl'],
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    ...shadows.lg,
  },
  sealGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.midnightNavy,
    letterSpacing: 1,
  },
  sealSubtext: {
    fontSize: 20,
    color: colors.midnightNavy,
    marginTop: 2,
  },
  actionsContainer: {
    marginBottom: spacing.xl,
  },
  signButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.glow,
  },
  signGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  signText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  continueGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  continueText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  shareButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  shareText: {
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
