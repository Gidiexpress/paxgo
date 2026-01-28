import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const HYPE_SQUAD_PROMPT_KEY = '@boldmove_hype_squad_prompt_shown';
const COMPLETED_ACTIONS_KEY = '@boldmove_total_completed';
const TRIGGER_THRESHOLD = 3; // Show Hype Squad prompt after 3 completed actions

interface HypeSquadMatchingState {
  hasShownPrompt: boolean;
  totalCompletedActions: number;
  shouldShowPrompt: boolean;
}

export function useHypeSquadMatching() {
  const router = useRouter();
  const [state, setState] = useState<HypeSquadMatchingState>({
    hasShownPrompt: false,
    totalCompletedActions: 0,
    shouldShowPrompt: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Load state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const [promptShownStr, completedStr] = await Promise.all([
          AsyncStorage.getItem(HYPE_SQUAD_PROMPT_KEY),
          AsyncStorage.getItem(COMPLETED_ACTIONS_KEY),
        ]);

        const hasShown = promptShownStr === 'true';
        const completed = completedStr ? parseInt(completedStr, 10) : 0;
        const shouldShow = completed >= TRIGGER_THRESHOLD && !hasShown;

        setState({
          hasShownPrompt: hasShown,
          totalCompletedActions: completed,
          shouldShowPrompt: shouldShow,
        });

        // Auto-show modal if conditions met
        if (shouldShow) {
          setShowModal(true);
        }
      } catch (error) {
        console.error('Failed to load hype squad state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

  // Check if should show after action completion
  const checkForHypeSquadTrigger = useCallback(async (newTotalActions: number) => {
    if (newTotalActions >= TRIGGER_THRESHOLD && !state.hasShownPrompt) {
      setState(prev => ({
        ...prev,
        totalCompletedActions: newTotalActions,
        shouldShowPrompt: true,
      }));
      return true;
    }
    return false;
  }, [state.hasShownPrompt]);

  // Show the Hype Squad modal
  const showHypeSquadPrompt = useCallback(() => {
    setShowModal(true);
  }, []);

  // Handle user accepting the Hype Squad invite
  const acceptHypeSquadInvite = useCallback(async () => {
    // Mark as shown
    setState(prev => ({ ...prev, hasShownPrompt: true, shouldShowPrompt: false }));
    setShowModal(false);

    try {
      await AsyncStorage.setItem(HYPE_SQUAD_PROMPT_KEY, 'true');
    } catch (error) {
      console.error('Failed to mark hype squad prompt as shown:', error);
    }

    // Navigate to Hype Squads screen
    router.push('/hype-squads');
  }, [router]);

  // Handle user dismissing the prompt
  const dismissHypeSquadPrompt = useCallback(async () => {
    setState(prev => ({ ...prev, hasShownPrompt: true, shouldShowPrompt: false }));
    setShowModal(false);

    try {
      await AsyncStorage.setItem(HYPE_SQUAD_PROMPT_KEY, 'true');
    } catch (error) {
      console.error('Failed to mark hype squad prompt as shown:', error);
    }
  }, []);

  // Reset for testing
  const resetHypeSquadMatching = useCallback(async () => {
    setState({
      hasShownPrompt: false,
      totalCompletedActions: 0,
      shouldShowPrompt: false,
    });
    setShowModal(false);
    try {
      await AsyncStorage.removeItem(HYPE_SQUAD_PROMPT_KEY);
    } catch (error) {
      console.error('Failed to reset hype squad state:', error);
    }
  }, []);

  return {
    isLoading,
    showModal,
    totalCompletedActions: state.totalCompletedActions,
    hasShownPrompt: state.hasShownPrompt,
    shouldShowPrompt: state.shouldShowPrompt,
    checkForHypeSquadTrigger,
    showHypeSquadPrompt,
    acceptHypeSquadInvite,
    dismissHypeSquadPrompt,
    resetHypeSquadMatching,
  };
}
