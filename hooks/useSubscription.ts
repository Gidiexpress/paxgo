import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBSCRIPTION_KEY = '@boldmove_subscription';

export type SubscriptionTier = 'seeker' | 'bold-adventurer' | 'sprint';

export interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt?: string;
  isActive: boolean;
}

const defaultSubscription: SubscriptionState = {
  tier: 'seeker',
  isActive: true,
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [loading, setLoading] = useState(true);

  // Load subscription from storage
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const stored = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as SubscriptionState;
          // Check if subscription is still active
          if (parsed.expiresAt) {
            const expiresAt = new Date(parsed.expiresAt);
            if (expiresAt < new Date()) {
              // Subscription expired, reset to free tier
              await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(defaultSubscription));
              setSubscription(defaultSubscription);
            } else {
              setSubscription(parsed);
            }
          } else {
            setSubscription(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSubscription();
  }, []);

  // Update subscription
  const updateSubscription = useCallback(async (newSubscription: Partial<SubscriptionState>) => {
    const updated = { ...subscription, ...newSubscription };
    setSubscription(updated);
    await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(updated));
  }, [subscription]);

  // Purchase subscription (mock implementation)
  const purchaseSubscription = useCallback(async (tier: SubscriptionTier) => {
    let expiresAt: string | undefined;

    if (tier === 'bold-adventurer') {
      // Monthly subscription - expires in 30 days
      const date = new Date();
      date.setDate(date.getDate() + 30);
      expiresAt = date.toISOString();
    } else if (tier === 'sprint') {
      // 7-day sprint
      const date = new Date();
      date.setDate(date.getDate() + 7);
      expiresAt = date.toISOString();
    }

    await updateSubscription({
      tier,
      expiresAt,
      isActive: true,
    });

    return true;
  }, [updateSubscription]);

  // Check if user has premium features
  const isPremium = subscription.tier === 'bold-adventurer' || subscription.tier === 'sprint';

  // Feature access checks
  const canAccessUnlimitedAI = isPremium;
  const canAccessHypeSquad = isPremium;
  const canAccessFullArchive = isPremium;
  const canAccessExclusiveMaps = isPremium;
  const canAccessPremiumActions = isPremium;

  // Daily AI limit for free users
  const [dailyAIUsage, setDailyAIUsage] = useState(0);
  const dailyAILimit = 3;

  const incrementAIUsage = useCallback(async () => {
    if (!isPremium) {
      setDailyAIUsage((prev) => prev + 1);
    }
  }, [isPremium]);

  const canUseAI = isPremium || dailyAIUsage < dailyAILimit;
  const remainingAIUses = isPremium ? Infinity : dailyAILimit - dailyAIUsage;

  return {
    subscription,
    loading,
    isPremium,
    purchaseSubscription,
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
