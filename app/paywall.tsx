import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { REVENUECAT_CONFIG } from '@/constants/sub-config';

interface PlanFeature {
  icon: string;
  text: string;
}

const premiumFeatures: PlanFeature[] = [
  { icon: '✓', text: 'Unlimited Groq AI Deep-Dives' },
  { icon: '✓', text: 'Private Hype Squads' },
  { icon: '✓', text: 'Full Archive Access' },
  { icon: '✓', text: 'Exclusive Dream Maps' },
];

interface Plan {
  id: string; // The RC Product Identifier
  package: PurchasesPackage; // The RC Package object
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  description: string;
  isPopular?: boolean;
  isTrial?: boolean;
  trialPrice?: string;
}

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium } = useSubscription(); // Use global state if needed

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // Animation for the trial badge
  const badgeScale = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      badgeScale.value = withSequence(
        withSpring(1.05, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  // FETCH OFFERINGS
  useEffect(() => {
    const loadOfferings = async () => {
      try {
        setIsFetching(true);
        // Ensure SDK is ready (configure happens in _layout, but good to check)
        const offerings = await Purchases.getOfferings();

        if (offerings.current && offerings.current.availablePackages.length > 0) {
          const fetchedPlans: Plan[] = offerings.current.availablePackages.map((pkg) => {
            const isMonthly = pkg.product.identifier.includes('monthly');
            const isYearly = pkg.product.identifier.includes('yearly');
            const isLifetime = pkg.product.identifier.includes('lifetime');

            // Map RC data to UI structure
            return {
              id: pkg.product.identifier,
              package: pkg,
              name: isLifetime ? 'Lifetime Access' : isYearly ? 'Bold Adventurer (Yearly)' : 'Bold Adventurer',
              price: pkg.product.priceString,
              period: isLifetime ? 'one-time' : isYearly ? '/year' : '/mo',
              description: isYearly
                ? 'Best Value: Save ~20%'
                : isLifetime
                  ? 'Pay once, own it forever'
                  : 'Full access, cancel anytime',
              isPopular: isYearly, // Mark Yearly as popular
              isTrial: false, // Set true if introPrice exists? pkg.product.introPrice
            };
          });

          setPlans(fetchedPlans);
          // Select the first one by default (usually Monthly or whatever is first)
          if (fetchedPlans.length > 0) {
            const defaultPlan = fetchedPlans.find(p => p.isPopular) || fetchedPlans[0];
            setSelectedPlan(defaultPlan.id);
          }
        }
      } catch (error) {
        console.error('Error loading offerings:', error);
        Alert.alert('Error', 'Could not load subscription products. Please check your connection.');
      } finally {
        setIsFetching(false);
      }
    };

    loadOfferings();
  }, []);

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    const planToBuy = plans.find(p => p.id === selectedPlan);
    if (!planToBuy) return;

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { customerInfo } = await Purchases.purchasePackage(planToBuy.package);

      if (customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId]) {
        // Success!
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Welcome to Pro!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId]) {
        Alert.alert('Restored!', 'Your purchases have been restored.');
        router.back();
      } else {
        Alert.alert('No Purchases', 'No active Pro subscription found to restore.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to restore purchases: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (!selectedPlan) return 'Loading...';
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return 'Select a Plan';
    return `Upgrade to ${plan.name}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.midnightNavy, '#0A2540', colors.terracottaDark]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Close Button */}
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + spacing.md }]}
        onPress={() => router.back()}
      >
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing['4xl'], paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn} style={styles.header}>
          <Text style={styles.title}>Unlock Your</Text>
          <Text style={styles.titleBold}>Boldest Self</Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.featuresContainer}>
          {premiumFeatures.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Loading Indicator */}
        {isFetching ? (
          <View style={{ padding: 20 }}>
            <ActivityIndicator size="large" color={colors.champagneGold} />
            <Text style={{ color: 'white', textAlign: 'center', marginTop: 10 }}>Loading Plans...</Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={{ padding: 20 }}>
            <Text style={{ color: 'white', textAlign: 'center' }}>No products found. Please check configuration.</Text>
          </View>
        ) : (
          /* Plans */
          <Animated.View entering={FadeInDown.delay(200)} style={styles.plansContainer}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.planCardSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedPlan(plan.id);
                }}
                activeOpacity={0.9}
              >
                {plan.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>BEST VALUE</Text>
                  </View>
                )}
                <View style={styles.planContent}>
                  <View style={styles.planRadio}>
                    <View
                      style={[
                        styles.planRadioInner,
                        selectedPlan === plan.id && styles.planRadioSelected,
                      ]}
                    />
                  </View>
                  <View style={styles.planDetails}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  </View>
                  <View style={styles.planPricing}>
                    <View style={styles.priceRow}>
                      <Text style={styles.planPrice}>
                        {plan.price}
                      </Text>
                    </View>
                    <Text style={styles.planPeriod}>
                      {plan.period}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.ctaContainer}>
          <TouchableOpacity
            style={[styles.ctaButton, { opacity: (isLoading || isFetching) ? 0.7 : 1 }]}
            onPress={handlePurchase}
            disabled={isLoading || isFetching}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.champagneGold, colors.goldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.midnightNavy} />
              ) : (
                <Text style={styles.ctaText}>{getButtonText()}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Trust signals */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.trustSignals}>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🔒</Text>
            <Text style={styles.trustText}>Secure Payment</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>↩️</Text>
            <Text style={styles.trustText}>Cancel Anytime</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>💳</Text>
            <Text style={styles.trustText}>No Hidden Fees</Text>
          </View>
        </Animated.View>

        {/* Restore & Terms */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.footer}>
          <TouchableOpacity onPress={handleRestore} disabled={isLoading}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            {Platform.OS === 'ios'
              ? 'Payment will be charged to your iTunes Account. Subscription automatically renews unless cancelled at least 24-hours before the end of the current period.'
              : 'Payment will be charged to your Google Play Account. Subscription automatically renews unless cancelled.'}
          </Text>

          <View style={styles.termsLinks}>
            <TouchableOpacity>
              <Text style={styles.termsLink}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={styles.termsDivider}>•</Text>
            <TouchableOpacity>
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['4xl'],
    color: colors.white,
    opacity: 0.9,
  },
  titleBold: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['5xl'],
    color: colors.white,
    marginTop: -spacing.sm,
  },
  featuresContainer: {
    marginBottom: spacing['3xl'],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  featureIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.vibrantTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureIcon: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  featureText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.white,
    flex: 1,
  },
  plansContainer: {
    marginBottom: spacing['2xl'],
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: colors.champagneGold,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  trialBadge: {
    position: 'absolute',
    top: -12,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  trialBadgeGradient: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  trialBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 12,
    color: colors.midnightNavy,
    letterSpacing: 0.5,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: spacing.lg,
    backgroundColor: colors.champagneGold,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  popularBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.midnightNavy,
    letterSpacing: 0.5,
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  planRadioSelected: {
    backgroundColor: colors.champagneGold,
  },
  planDetails: {
    flex: 1,
  },
  planName: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  planDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  originalPrice: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'line-through',
  },
  planPrice: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.white,
  },
  trialPrice: {
    color: colors.champagneGold,
    fontSize: typography.fontSize['2xl'],
  },
  planPeriod: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  ctaContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  ctaButton: {
    width: '100%',
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.lg,
  },
  ctaGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  sprintLink: {
    marginTop: spacing.lg,
  },
  sprintLinkText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    textDecorationLine: 'underline',
  },
  trustSignals: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  trustItem: {
    alignItems: 'center',
  },
  trustIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  trustText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  footer: {
    alignItems: 'center',
  },
  restoreText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.lg,
  },
  termsText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  termsLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsLink: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'underline',
  },
  termsDivider: {
    color: 'rgba(255,255,255,0.5)',
    marginHorizontal: spacing.sm,
  },
});
