import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, MicroAction, ProofEntry, PermissionSlip, DreamProgress, DeepDiveProgress } from '@/types';

const STORAGE_KEYS = {
  USER: '@paxgo_user',
  ACTIONS: '@paxgo_actions',
  PROOFS: '@paxgo_proofs',
  PERMISSION_SLIPS: '@paxgo_permission_slips',
  DREAM_PROGRESS: '@paxgo_dream_progress',
  ONBOARDING_COMPLETE: '@paxgo_onboarding_complete',
  CHAT_HISTORY: '@paxgo_chat_history',
  DEEP_DIVE: '@paxgo_deep_dive',
};

export function useStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  // Load value from storage
  useEffect(() => {
    const loadValue = async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error('Error loading from storage:', error);
      } finally {
        setLoading(false);
      }
    };
    loadValue();
  }, [key]);

  // Set value in storage
  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('Error saving to storage:', error);
      }
    },
    [key, storedValue]
  );

  // Remove value from storage
  const removeValue = useCallback(async () => {
    try {
      setStoredValue(initialValue);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  }, [key, initialValue]);

  return { value: storedValue, setValue, removeValue, loading };
}

// User hook
export function useUser() {
  const { value: user, setValue: setUser, loading } = useStorage<User | null>(
    STORAGE_KEYS.USER,
    null
  );

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (user) {
        await setUser({ ...user, ...updates });
      }
    },
    [user, setUser]
  );

  const createUser = useCallback(
    async (userData: Omit<User, 'id' | 'createdAt'>) => {
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      await setUser(newUser);
      return newUser;
    },
    [setUser]
  );

  return { user, setUser, updateUser, createUser, loading };
}

// Actions hook
export function useActions() {
  const { value: actions, setValue: setActions, loading } = useStorage<MicroAction[]>(
    STORAGE_KEYS.ACTIONS,
    []
  );

  const addAction = useCallback(
    async (action: Omit<MicroAction, 'id'>) => {
      const newAction: MicroAction = {
        ...action,
        id: Date.now().toString(),
      };
      await setActions((prev) => [...prev, newAction]);
      return newAction;
    },
    [setActions]
  );

  const completeAction = useCallback(
    async (actionId: string) => {
      await setActions((prev) =>
        prev.map((a) =>
          a.id === actionId
            ? { ...a, isCompleted: true, completedAt: new Date().toISOString() }
            : a
        )
      );
    },
    [setActions]
  );

  const getActiveActions = useCallback(() => {
    return actions.filter((a) => !a.isCompleted);
  }, [actions]);

  const getCompletedActions = useCallback(() => {
    return actions.filter((a) => a.isCompleted);
  }, [actions]);

  const getTodayActions = useCallback(() => {
    const today = new Date().toDateString();
    return actions.filter((a) => !a.isCompleted ||
      (a.completedAt && new Date(a.completedAt).toDateString() === today)
    );
  }, [actions]);

  return {
    actions,
    setActions,
    addAction,
    completeAction,
    getActiveActions,
    getCompletedActions,
    getTodayActions,
    loading,
  };
}

// Proofs hook
export function useProofs() {
  const { value: proofs, setValue: setProofs, loading } = useStorage<ProofEntry[]>(
    STORAGE_KEYS.PROOFS,
    []
  );

  const addProof = useCallback(
    async (proof: Omit<ProofEntry, 'id' | 'createdAt'>) => {
      const newProof: ProofEntry = {
        ...proof,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      await setProofs((prev) => [newProof, ...prev]);
      return newProof;
    },
    [setProofs]
  );

  const addReaction = useCallback(
    async (proofId: string, reaction: string) => {
      await setProofs((prev) =>
        prev.map((p) =>
          p.id === proofId
            ? { ...p, reactions: [...p.reactions, reaction] }
            : p
        )
      );
    },
    [setProofs]
  );

  return { proofs, setProofs, addProof, addReaction, loading };
}

// Permission Slips hook
export function usePermissionSlips() {
  const { value: slips, setValue: setSlips, loading } = useStorage<PermissionSlip[]>(
    STORAGE_KEYS.PERMISSION_SLIPS,
    []
  );

  const addSlip = useCallback(
    async (slip: Omit<PermissionSlip, 'id' | 'createdAt'>) => {
      const newSlip: PermissionSlip = {
        ...slip,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      await setSlips((prev) => [newSlip, ...prev]);
      return newSlip;
    },
    [setSlips]
  );

  return { slips, setSlips, addSlip, loading };
}

// Dream Progress hook
export function useDreamProgress() {
  const { value: progress, setValue: setProgress, loading } = useStorage<DreamProgress | null>(
    STORAGE_KEYS.DREAM_PROGRESS,
    null
  );

  const updateProgress = useCallback(
    async (updates: Partial<DreamProgress>) => {
      if (progress) {
        await setProgress({ ...progress, ...updates });
      }
    },
    [progress, setProgress]
  );

  const initializeProgress = useCallback(
    async (dreamId: string) => {
      const newProgress: DreamProgress = {
        dreamId,
        totalActions: 0,
        completedActions: 0,
        currentStreak: 0,
        longestStreak: 0,
        milestones: [],
      };
      await setProgress(newProgress);
      return newProgress;
    },
    [setProgress]
  );

  const incrementCompletedActions = useCallback(async () => {
    if (progress) {
      await setProgress({
        ...progress,
        completedActions: progress.completedActions + 1,
        currentStreak: progress.currentStreak + 1,
        longestStreak: Math.max(progress.longestStreak, progress.currentStreak + 1),
      });
    }
  }, [progress, setProgress]);

  return {
    progress,
    setProgress,
    updateProgress,
    initializeProgress,
    incrementCompletedActions,
    loading,
  };
}

// Onboarding hook
export function useOnboarding() {
  const { value: isComplete, setValue: setIsComplete, loading } = useStorage<boolean>(
    STORAGE_KEYS.ONBOARDING_COMPLETE,
    false
  );

  const completeOnboarding = useCallback(async () => {
    await setIsComplete(true);
  }, [setIsComplete]);

  const resetOnboarding = useCallback(async () => {
    await setIsComplete(false);
  }, [setIsComplete]);

  return { isComplete, completeOnboarding, resetOnboarding, loading };
}

// Deep Dive Progress hook
export function useDeepDive() {
  const { value: deepDive, setValue: setDeepDive, loading } = useStorage<DeepDiveProgress | null>(
    STORAGE_KEYS.DEEP_DIVE,
    null
  );

  const startDeepDive = useCallback(
    async (actionId: string, actionTitle: string) => {
      const newDeepDive: DeepDiveProgress = {
        actionId,
        actionTitle,
        tinySteps: [],
        currentStepIndex: 0,
        startedAt: new Date().toISOString(),
        isActive: true,
      };
      await setDeepDive(newDeepDive);
      return newDeepDive;
    },
    [setDeepDive]
  );

  const setTinySteps = useCallback(
    async (steps: DeepDiveProgress['tinySteps']) => {
      if (deepDive) {
        await setDeepDive({
          ...deepDive,
          tinySteps: steps,
        });
      }
    },
    [deepDive, setDeepDive]
  );

  const completeCurrentStep = useCallback(async () => {
    if (deepDive && deepDive.currentStepIndex < deepDive.tinySteps.length) {
      const updatedSteps = [...deepDive.tinySteps];
      updatedSteps[deepDive.currentStepIndex] = {
        ...updatedSteps[deepDive.currentStepIndex],
        isCompleted: true,
        completedAt: new Date().toISOString(),
      };

      const nextIndex = deepDive.currentStepIndex + 1;
      const isAllComplete = nextIndex >= deepDive.tinySteps.length;

      await setDeepDive({
        ...deepDive,
        tinySteps: updatedSteps,
        currentStepIndex: nextIndex,
        completedAt: isAllComplete ? new Date().toISOString() : undefined,
        isActive: !isAllComplete,
      });

      return isAllComplete;
    }
    return false;
  }, [deepDive, setDeepDive]);

  const endDeepDive = useCallback(async () => {
    await setDeepDive(null);
  }, [setDeepDive]);

  const hasActiveDeepDive = deepDive?.isActive && deepDive.currentStepIndex < deepDive.tinySteps.length;

  return {
    deepDive,
    setDeepDive,
    startDeepDive,
    setTinySteps,
    completeCurrentStep,
    endDeepDive,
    hasActiveDeepDive,
    loading,
  };
}
