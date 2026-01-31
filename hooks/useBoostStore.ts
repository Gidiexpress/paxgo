import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BoostProduct, PurchasedBoost, BoostContent, BOOST_CATALOG } from '@/types/boosts';
import { useSubscription } from './useSubscription';

const PURCHASED_BOOSTS_KEY = '@boldmove_purchased_boosts';

export function useBoostStore() {
  const [purchasedBoosts, setPurchasedBoosts] = useState<PurchasedBoost[]>([]);
  const [loading, setLoading] = useState(true);
  const { isPremium } = useSubscription();

  // Load purchased boosts from storage
  useEffect(() => {
    const loadPurchasedBoosts = async () => {
      try {
        const stored = await AsyncStorage.getItem(PURCHASED_BOOSTS_KEY);
        if (stored) {
          setPurchasedBoosts(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading purchased boosts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPurchasedBoosts();
  }, []);

  // Get all available boosts with purchase status
  const getAvailableBoosts = useCallback((): BoostProduct[] => {
    return BOOST_CATALOG.map((boost) => ({
      ...boost,
      isPurchased: purchasedBoosts.some((pb) => pb.boostId === boost.id),
    }));
  }, [purchasedBoosts]);

  // Get price for a boost (25% off for premium subscribers)
  const getBoostPrice = useCallback(
    (boost: BoostProduct): number => {
      return isPremium ? boost.premiumPrice : boost.basePrice;
    },
    [isPremium]
  );

  // Check if a boost is purchased
  const isBoostPurchased = useCallback(
    (boostId: string): boolean => {
      return purchasedBoosts.some((pb) => pb.boostId === boostId);
    },
    [purchasedBoosts]
  );

  // Get a purchased boost by ID
  const getPurchasedBoost = useCallback(
    (boostId: string): PurchasedBoost | undefined => {
      return purchasedBoosts.find((pb) => pb.boostId === boostId);
    },
    [purchasedBoosts]
  );

  // Purchase a boost (mock implementation - in real app would integrate with RevenueCat)
  const purchaseBoost = useCallback(
    async (boostId: string, content: BoostContent): Promise<PurchasedBoost> => {
      const newPurchase: PurchasedBoost = {
        id: `purchase_${Date.now()}`,
        boostId,
        purchasedAt: new Date().toISOString(),
        content,
        isRead: false,
      };

      const updatedPurchases = [...purchasedBoosts, newPurchase];
      setPurchasedBoosts(updatedPurchases);
      await AsyncStorage.setItem(PURCHASED_BOOSTS_KEY, JSON.stringify(updatedPurchases));

      return newPurchase;
    },
    [purchasedBoosts]
  );

  // Mark a boost as read
  const markBoostAsRead = useCallback(
    async (purchaseId: string): Promise<void> => {
      const updatedPurchases = purchasedBoosts.map((pb) =>
        pb.id === purchaseId
          ? { ...pb, isRead: true, lastReadAt: new Date().toISOString() }
          : pb
      );
      setPurchasedBoosts(updatedPurchases);
      await AsyncStorage.setItem(PURCHASED_BOOSTS_KEY, JSON.stringify(updatedPurchases));
    },
    [purchasedBoosts]
  );

  // Get boosts by category
  const getBoostsByCategory = useCallback(
    (category: string): BoostProduct[] => {
      return getAvailableBoosts().filter((boost) => boost.category === category);
    },
    [getAvailableBoosts]
  );

  // Get featured boosts (first 4)
  const getFeaturedBoosts = useCallback((): BoostProduct[] => {
    return getAvailableBoosts().slice(0, 4);
  }, [getAvailableBoosts]);

  // Get user's library (all purchased boosts with details)
  const getLibrary = useCallback((): Array<PurchasedBoost & { product: BoostProduct }> => {
    return purchasedBoosts
      .map((pb) => {
        const product = BOOST_CATALOG.find((b) => b.id === pb.boostId);
        if (!product) return null;
        return { ...pb, product };
      })
      .filter(Boolean) as Array<PurchasedBoost & { product: BoostProduct }>;
  }, [purchasedBoosts]);

  // Get unread count
  const unreadCount = purchasedBoosts.filter((pb) => !pb.isRead).length;

  return {
    loading,
    isPremium,
    purchasedBoosts,
    unreadCount,
    getAvailableBoosts,
    getBoostPrice,
    isBoostPurchased,
    getPurchasedBoost,
    purchaseBoost,
    markBoostAsRead,
    getBoostsByCategory,
    getFeaturedBoosts,
    getLibrary,
  };
}
