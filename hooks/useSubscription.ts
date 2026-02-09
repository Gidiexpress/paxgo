import { useState, useEffect, useCallback } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { useAuth } from '@fastshot/auth';
import { REVENUECAT_CONFIG } from '@/constants/sub-config';
import { Alert } from 'react-native';

export type SubscriptionTier = 'seeker' | 'bold-adventurer';

export interface SubscriptionState {
  tier: SubscriptionTier;
  isActive: boolean;
  isTrial?: boolean;
  expiresAt?: string | null;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
}

const defaultSubscription: SubscriptionState = {
  tier: 'seeker',
  isActive: false,
  customerInfo: null,
  isLoading: true,
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);

  // Daily AI limit (local logic for free users)
  const [dailyAIUsage, setDailyAIUsage] = useState(0);
  const dailyAILimit = 3;

  // Check entitlement from CustomerInfo
  const updateSubscriptionState = useCallback((customerInfo: CustomerInfo) => {
    const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId];

    setSubscription({
      tier: entitlement ? 'bold-adventurer' : 'seeker',
      isActive: !!entitlement,
      expiresAt: customerInfo.latestExpirationDate,
      customerInfo: customerInfo,
      isLoading: false,
    });
  }, []);

  // Initialize and listen for updates
  useEffect(() => {
    const init = async () => {
      try {
        // Identify user in RevenueCat if logged in
        if (user?.id) {
          await Purchases.logIn(user.id);
        }

        Purchases.addCustomerInfoUpdateListener((info) => {
          updateSubscriptionState(info);
        });

        const customerInfo = await Purchases.getCustomerInfo();
        updateSubscriptionState(customerInfo);
      } catch (e) {
        console.error('Error fetching customer info:', e);
        setSubscription(prev => ({ ...prev, isLoading: false }));
      }
    };

    init();

    // Cleanup is handled by the SDK singleton nature usually, but good practice to remove if needed
    // Purchases.removeCustomerInfoUpdateListener(listener); 
  }, [user?.id, updateSubscriptionState]);

  // Restore purchases
  const restorePermissions = async () => {
    try {
      setSubscription(prev => ({ ...prev, isLoading: true }));
      const customerInfo = await Purchases.restorePurchases();
      updateSubscriptionState(customerInfo);

      if (customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId]) {
        Alert.alert('Success', 'Your purchases have been restored.');
      } else {
        Alert.alert('Notice', 'No active subscriptions found to restore.');
      }
      return customerInfo;
    } catch (e: any) {
      console.error('Error restoring purchases:', e);
      Alert.alert('Error', `Restore failed: ${e.message}`);
      setSubscription(prev => ({ ...prev, isLoading: false }));
      throw e;
    }
  };

  const isPremium = subscription.isActive;

  // Feature access checks
  const canAccessUnlimitedAI = isPremium;
  const canAccessHypeSquad = isPremium;
  const canAccessFullArchive = isPremium;
  const canAccessExclusiveMaps = isPremium;
  const canAccessPremiumActions = isPremium;

  const incrementAIUsage = useCallback(async () => {
    if (!isPremium) {
      setDailyAIUsage((prev) => prev + 1);
    }
  }, [isPremium]);

  const canUseAI = isPremium || dailyAIUsage < dailyAILimit;
  const remainingAIUses = isPremium ? Infinity : dailyAILimit - dailyAIUsage;

  return {
    subscription,
    isLoading: subscription.isLoading,
    isPremium,
    restorePermissions,
    canAccessUnlimitedAI,
    canAccessHypeSquad,
    canAccessFullArchive,
    canAccessExclusiveMaps,
    canAccessPremiumActions,
    canUseAI,
    remainingAIUses,
    incrementAIUsage,
  };
}
