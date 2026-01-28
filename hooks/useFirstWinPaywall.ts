import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSubscription } from './useSubscription';

const FIRST_WIN_KEY = '@boldmove_first_win_shown';
const COMPLETED_ACTIONS_KEY = '@boldmove_total_completed';
const DREAM_FIRST_WIN_PREFIX = '@boldmove_dream_first_win_';

interface FirstWinState {
  hasShownFirstWinPaywall: boolean;
  totalCompletedActions: number;
  dreamFirstWins: Record<string, boolean>; // Track first win per dream
}

export function useFirstWinPaywall() {
  const router = useRouter();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const [state, setState] = useState<FirstWinState>({
    hasShownFirstWinPaywall: false,
    totalCompletedActions: 0,
    dreamFirstWins: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  // Load state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const [shownStr, completedStr] = await Promise.all([
          AsyncStorage.getItem(FIRST_WIN_KEY),
          AsyncStorage.getItem(COMPLETED_ACTIONS_KEY),
        ]);

        // Load dream-specific first wins
        const allKeys = await AsyncStorage.getAllKeys();
        const dreamFirstWinKeys = allKeys.filter((k) => k.startsWith(DREAM_FIRST_WIN_PREFIX));
        const dreamFirstWinData = await AsyncStorage.multiGet(dreamFirstWinKeys);
        const dreamFirstWins: Record<string, boolean> = {};
        dreamFirstWinData.forEach(([key, value]) => {
          const dreamId = key.replace(DREAM_FIRST_WIN_PREFIX, '');
          dreamFirstWins[dreamId] = value === 'true';
        });

        setState({
          hasShownFirstWinPaywall: shownStr === 'true',
          totalCompletedActions: completedStr ? parseInt(completedStr, 10) : 0,
          dreamFirstWins,
        });
      } catch (error) {
        console.error('Failed to load first win state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

  // Mark action as completed and check if we should show paywall
  // Optional dreamId parameter to track per-dream first wins
  const onActionCompleted = useCallback(async (
    showCelebrationFirst: boolean = true,
    dreamId?: string
  ): Promise<{
    isFirstWin: boolean;
    isDreamFirstWin: boolean;
    shouldShowPaywall: boolean;
    newTotal: number;
  }> => {
    const newTotal = state.totalCompletedActions + 1;
    const isFirstWin = newTotal === 1;

    // Check if this is the first win for this specific dream
    const isDreamFirstWin = dreamId ? !state.dreamFirstWins[dreamId] : false;

    // Show paywall logic:
    // - Only for the very first action completed globally (isFirstWin)
    // - Only if paywall hasn't been shown before
    // - Only if user is NOT premium
    // Premium users starting a second dream will NOT see the paywall
    const shouldShowPaywall = isFirstWin && !state.hasShownFirstWinPaywall && !isPremium;

    // Update state
    const updatedDreamFirstWins = { ...state.dreamFirstWins };
    if (dreamId && isDreamFirstWin) {
      updatedDreamFirstWins[dreamId] = true;
    }

    setState(prev => ({
      ...prev,
      totalCompletedActions: newTotal,
      dreamFirstWins: updatedDreamFirstWins,
    }));

    // Persist
    try {
      const promises: Promise<void>[] = [
        AsyncStorage.setItem(COMPLETED_ACTIONS_KEY, newTotal.toString()),
      ];
      if (dreamId && isDreamFirstWin) {
        promises.push(
          AsyncStorage.setItem(`${DREAM_FIRST_WIN_PREFIX}${dreamId}`, 'true')
        );
      }
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to save completed actions:', error);
    }

    // Set celebration message based on milestone
    if (isDreamFirstWin && dreamId && !isFirstWin) {
      // First win for a new dream (not the very first ever)
      setCelebrationMessage("First step on your new dream! 🌟");
    } else if (isFirstWin) {
      setCelebrationMessage("You did it! Your first bold move! 🎉");
    } else if (newTotal === 5) {
      setCelebrationMessage("5 bold moves! You&apos;re building momentum! 🔥");
    } else if (newTotal === 10) {
      setCelebrationMessage("10 bold moves! You&apos;re unstoppable! ⭐");
    } else if (newTotal % 10 === 0) {
      setCelebrationMessage(`${newTotal} bold moves! Keep going! 💪`);
    } else {
      setCelebrationMessage("Another win in the books! ✓");
    }

    // Show celebration if requested
    if (showCelebrationFirst) {
      setShowCelebration(true);
    }

    return { isFirstWin, isDreamFirstWin, shouldShowPaywall, newTotal };
  }, [state.totalCompletedActions, state.hasShownFirstWinPaywall, state.dreamFirstWins, isPremium]);

  // Trigger paywall after celebration
  const triggerPaywallAfterCelebration = useCallback(async (delayMs: number = 1500) => {
    // Mark as shown
    setState(prev => ({ ...prev, hasShownFirstWinPaywall: true }));

    try {
      await AsyncStorage.setItem(FIRST_WIN_KEY, 'true');
    } catch (error) {
      console.error('Failed to mark first win paywall as shown:', error);
    }

    // Delay before showing paywall
    setTimeout(() => {
      setShowCelebration(false);
      router.push('/paywall');
    }, delayMs);
  }, [router]);

  // Dismiss celebration without paywall
  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
    setCelebrationMessage('');
  }, []);

  // Check if user has ever completed an action
  const hasCompletedAnyAction = state.totalCompletedActions > 0;

  // Check if should show paywall (first win, not yet shown, not premium)
  const shouldTriggerFirstWinPaywall = useCallback(() => {
    return (
      state.totalCompletedActions === 1 &&
      !state.hasShownFirstWinPaywall &&
      !isPremium &&
      !subscriptionLoading
    );
  }, [state.totalCompletedActions, state.hasShownFirstWinPaywall, isPremium, subscriptionLoading]);

  // Check if a dream has had its first win
  const hasDreamFirstWin = useCallback((dreamId: string): boolean => {
    return state.dreamFirstWins[dreamId] === true;
  }, [state.dreamFirstWins]);

  // Reset for testing
  const resetFirstWin = useCallback(async () => {
    setState({
      hasShownFirstWinPaywall: false,
      totalCompletedActions: 0,
      dreamFirstWins: {},
    });
    try {
      // Get all dream first win keys to remove them
      const allKeys = await AsyncStorage.getAllKeys();
      const dreamFirstWinKeys = allKeys.filter((k) => k.startsWith(DREAM_FIRST_WIN_PREFIX));

      await Promise.all([
        AsyncStorage.removeItem(FIRST_WIN_KEY),
        AsyncStorage.removeItem(COMPLETED_ACTIONS_KEY),
        ...dreamFirstWinKeys.map((k) => AsyncStorage.removeItem(k)),
      ]);
    } catch (error) {
      console.error('Failed to reset first win state:', error);
    }
  }, []);

  return {
    isLoading,
    hasCompletedAnyAction,
    totalCompletedActions: state.totalCompletedActions,
    hasShownFirstWinPaywall: state.hasShownFirstWinPaywall,
    showCelebration,
    celebrationMessage,
    onActionCompleted,
    triggerPaywallAfterCelebration,
    dismissCelebration,
    shouldTriggerFirstWinPaywall,
    hasDreamFirstWin,
    resetFirstWin,
  };
}
