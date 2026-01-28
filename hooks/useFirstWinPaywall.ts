import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSubscription } from './useSubscription';

const FIRST_WIN_KEY = '@boldmove_first_win_shown';
const COMPLETED_ACTIONS_KEY = '@boldmove_total_completed';

interface FirstWinState {
  hasShownFirstWinPaywall: boolean;
  totalCompletedActions: number;
}

export function useFirstWinPaywall() {
  const router = useRouter();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const [state, setState] = useState<FirstWinState>({
    hasShownFirstWinPaywall: false,
    totalCompletedActions: 0,
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

        setState({
          hasShownFirstWinPaywall: shownStr === 'true',
          totalCompletedActions: completedStr ? parseInt(completedStr, 10) : 0,
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
  const onActionCompleted = useCallback(async (showCelebrationFirst: boolean = true): Promise<{
    isFirstWin: boolean;
    shouldShowPaywall: boolean;
    newTotal: number;
  }> => {
    const newTotal = state.totalCompletedActions + 1;
    const isFirstWin = newTotal === 1;
    const shouldShowPaywall = isFirstWin && !state.hasShownFirstWinPaywall && !isPremium;

    // Update state
    setState(prev => ({
      ...prev,
      totalCompletedActions: newTotal,
    }));

    // Persist
    try {
      await AsyncStorage.setItem(COMPLETED_ACTIONS_KEY, newTotal.toString());
    } catch (error) {
      console.error('Failed to save completed actions:', error);
    }

    // Set celebration message based on milestone
    if (isFirstWin) {
      setCelebrationMessage("You did it! Your first bold move! 🎉");
    } else if (newTotal === 5) {
      setCelebrationMessage("5 bold moves! You're building momentum! 🔥");
    } else if (newTotal === 10) {
      setCelebrationMessage("10 bold moves! You're unstoppable! ⭐");
    } else if (newTotal % 10 === 0) {
      setCelebrationMessage(`${newTotal} bold moves! Keep going! 💪`);
    } else {
      setCelebrationMessage("Another win in the books! ✓");
    }

    // Show celebration if requested
    if (showCelebrationFirst) {
      setShowCelebration(true);
    }

    return { isFirstWin, shouldShowPaywall, newTotal };
  }, [state.totalCompletedActions, state.hasShownFirstWinPaywall, isPremium]);

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

  // Reset for testing
  const resetFirstWin = useCallback(async () => {
    setState({
      hasShownFirstWinPaywall: false,
      totalCompletedActions: 0,
    });
    try {
      await Promise.all([
        AsyncStorage.removeItem(FIRST_WIN_KEY),
        AsyncStorage.removeItem(COMPLETED_ACTIONS_KEY),
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
    resetFirstWin,
  };
}
