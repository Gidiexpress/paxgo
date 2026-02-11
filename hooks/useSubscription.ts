import { useState, useEffect, useCallback } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  isDeveloperOverride?: boolean;
}

const defaultSubscription: SubscriptionState = {
  tier: 'seeker',
  isActive: false,
  customerInfo: null,
  isLoading: true,
  isDeveloperOverride: false,
};

const DEV_PREMIUM_KEY = 'paxgo_dev_premium_override';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);

  // Daily AI limit (local logic for free users)
  const [dailyAIUsage, setDailyAIUsage] = useState(0);
  const dailyAILimit = 3;

  // Check entitlement from CustomerInfo
  const updateSubscriptionState = useCallback(async (customerInfo: CustomerInfo) => {
    const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId];

    // Check developer override
    const devOverride = await AsyncStorage.getItem(DEV_PREMIUM_KEY);
    const isOverrideActive = devOverride === 'true';

    setSubscription({
      tier: (entitlement || isOverrideActive) ? 'bold-adventurer' : 'seeker',
      isActive: !!entitlement || isOverrideActive,
      expiresAt: customerInfo.latestExpirationDate,
      customerInfo: customerInfo,
      isLoading: false,
      isDeveloperOverride: isOverrideActive,
    });
  }, []);

  // Toggle Developer Override
  const toggleDeveloperOverride = async () => {
    try {
      const current = await AsyncStorage.getItem(DEV_PREMIUM_KEY);
      const newValue = current === 'true' ? 'false' : 'true';
      await AsyncStorage.setItem(DEV_PREMIUM_KEY, newValue);

      // Force refresh state
      if (subscription.customerInfo) {
        updateSubscriptionState(subscription.customerInfo);
      }

      return newValue === 'true';
    } catch (e) {
      console.error('Failed to toggle dev override', e);
      return false;
    }
  };

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
        // Even on error, check for dev override
        const devOverride = await AsyncStorage.getItem(DEV_PREMIUM_KEY);
        if (devOverride === 'true') {
          setSubscription(prev => ({
            ...prev,
            isActive: true,
            tier: 'bold-adventurer',
            isLoading: false,
            isDeveloperOverride: true
          }));
        } else {
          setSubscription(prev => ({ ...prev, isLoading: false }));
        }
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
    toggleDeveloperOverride,
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
