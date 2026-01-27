import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useSubscription } from '@/hooks/useSubscription';

// RevenueCat integration - uncomment when API key is configured
// import Purchases, { PurchasesPackage } from 'react-native-purchases';

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
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  isPopular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'bold-adventurer',
    name: 'Bold Adventurer',
    price: '$9.99',
    period: '/mo',
    description: 'Most popular choice',
    isPopular: true,
  },
  {
    id: 'sprint',
    name: '7-Day Sprint',
    price: '$4.99',
    period: 'one-time',
    description: 'Try premium features',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { purchaseSubscription } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<string>('bold-adventurer');
  const [isLoading, setIsLoading] = useState(false);
  // const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  // RevenueCat integration - uncomment when configured
  // useEffect(() => {
  //   const loadOfferings = async () => {
  //     try {
  //       const offerings = await Purchases.getOfferings();
  //       if (offerings.current) {
  //         setPackages(offerings.current.availablePackages);
  //       }
  //     } catch (error) {
  //       console.error('Error loading offerings:', error);
  //     }
  //   };
  //   loadOfferings();
  // }, []);

  const handlePurchase = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // RevenueCat integration - uncomment when configured
      // const pkg = packages.find(p => p.identifier === selectedPlan);
      // if (pkg) {
      //   const { customerInfo } = await Purchases.purchasePackage(pkg);
      //   if (customerInfo.entitlements.active['premium']) {
      //     await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      //     router.back();
      //   }
      // }

      // Mock purchase for now
      await purchaseSubscription(selectedPlan as 'bold-adventurer' | 'sprint');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '🎉 Welcome, Bold Adventurer!',
        'You now have full access to all premium features.',
        [{ text: 'Let\'s Go!', onPress: () => router.back() }]
      );
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Error', 'Failed to complete purchase. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      // const customerInfo = await Purchases.restorePurchases();
      // if (customerInfo.entitlements.active['premium']) {
      //   Alert.alert('Restored!', 'Your purchases have been restored.');
      //   router.back();
      // } else {
      //   Alert.alert('No Purchases', 'No previous purchases found.');
      // }
      Alert.alert('Restore', 'No previous purchases found.');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setIsLoading(false);
    }
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

        {/* Plans */}
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
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
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
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handlePurchase}
            disabled={isLoading}
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
                <Text style={styles.ctaText}>
                  Upgrade to Bold Adventurer - {selectedPlan === 'bold-adventurer' ? '$9.99/mo' : '$4.99'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* 7-Day Sprint option */}
          {selectedPlan === 'bold-adventurer' && (
            <TouchableOpacity
              style={styles.sprintLink}
              onPress={() => setSelectedPlan('sprint')}
            >
              <Text style={styles.sprintLinkText}>
                Or try the 7-Day Sprint for $4.99
              </Text>
            </TouchableOpacity>
          )}
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
  planPrice: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.white,
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
