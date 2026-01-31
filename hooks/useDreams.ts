import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dream, DreamCategory, DreamChatHistory, DreamChatMessage } from '@/types/dreams';
import { MicroAction, ProofEntry } from '@/types';

const DREAMS_KEY = '@boldmove_dreams';
const ACTIVE_DREAM_KEY = '@boldmove_active_dream';
const DREAM_ACTIONS_PREFIX = '@boldmove_dream_actions_';
const DREAM_CHAT_PREFIX = '@boldmove_dream_chat_';
const DREAM_PROOFS_PREFIX = '@boldmove_dream_proofs_';

export function useDreams() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [activeDreamId, setActiveDreamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get the active dream object
  const activeDream = dreams.find((d) => d.id === activeDreamId) || null;

  // Load dreams from storage
  useEffect(() => {
    const loadDreams = async () => {
      try {
        const [storedDreams, storedActiveId] = await Promise.all([
          AsyncStorage.getItem(DREAMS_KEY),
          AsyncStorage.getItem(ACTIVE_DREAM_KEY),
        ]);

        if (storedDreams) {
          const parsedDreams = JSON.parse(storedDreams) as Dream[];
          setDreams(parsedDreams);
        }

        if (storedActiveId) {
          setActiveDreamId(storedActiveId);
        }
      } catch (error) {
        console.error('Error loading dreams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDreams();
  }, []);

  // Create a new dream
  const createDream = useCallback(
    async (
      title: string,
      category: DreamCategory,
      description: string,
      coreMotivation?: string
    ): Promise<Dream> => {
      const newDream: Dream = {
        id: `dream_${Date.now()}`,
        title,
        category,
        description,
        coreMotivation,
        createdAt: new Date().toISOString(),
        isActive: true,
        progress: {
          totalActions: 0,
          completedActions: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        fiveWhysCompleted: false,
        permissionSlipSigned: false,
      };

      const updatedDreams = [...dreams, newDream];
      setDreams(updatedDreams);
      setActiveDreamId(newDream.id);

      await Promise.all([
        AsyncStorage.setItem(DREAMS_KEY, JSON.stringify(updatedDreams)),
        AsyncStorage.setItem(ACTIVE_DREAM_KEY, newDream.id),
      ]);

      return newDream;
    },
    [dreams]
  );

  // Update a dream
  const updateDream = useCallback(
    async (dreamId: string, updates: Partial<Dream>): Promise<void> => {
      const updatedDreams = dreams.map((dream) =>
        dream.id === dreamId ? { ...dream, ...updates } : dream
      );
      setDreams(updatedDreams);
      await AsyncStorage.setItem(DREAMS_KEY, JSON.stringify(updatedDreams));
    },
    [dreams]
  );

  // Switch active dream
  const switchDream = useCallback(async (dreamId: string): Promise<void> => {
    setActiveDreamId(dreamId);
    await AsyncStorage.setItem(ACTIVE_DREAM_KEY, dreamId);
  }, []);

  // Delete a dream
  const deleteDream = useCallback(
    async (dreamId: string): Promise<void> => {
      const updatedDreams = dreams.filter((d) => d.id !== dreamId);
      setDreams(updatedDreams);

      // Clean up related data
      await Promise.all([
        AsyncStorage.setItem(DREAMS_KEY, JSON.stringify(updatedDreams)),
        AsyncStorage.removeItem(`${DREAM_ACTIONS_PREFIX}${dreamId}`),
        AsyncStorage.removeItem(`${DREAM_CHAT_PREFIX}${dreamId}`),
        AsyncStorage.removeItem(`${DREAM_PROOFS_PREFIX}${dreamId}`),
      ]);

      // Switch to another dream if this was active
      if (activeDreamId === dreamId && updatedDreams.length > 0) {
        await switchDream(updatedDreams[0].id);
      } else if (updatedDreams.length === 0) {
        setActiveDreamId(null);
        await AsyncStorage.removeItem(ACTIVE_DREAM_KEY);
      }
    },
    [dreams, activeDreamId, switchDream]
  );

  // Get actions for a specific dream
  const getDreamActions = useCallback(async (dreamId: string): Promise<MicroAction[]> => {
    try {
      const stored = await AsyncStorage.getItem(`${DREAM_ACTIONS_PREFIX}${dreamId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Add action to a dream
  const addDreamAction = useCallback(
    async (dreamId: string, action: Omit<MicroAction, 'id' | 'dreamId'>): Promise<MicroAction> => {
      const actions = await getDreamActions(dreamId);
      const newAction: MicroAction = {
        ...action,
        id: `action_${Date.now()}`,
        dreamId,
      };
      const updatedActions = [...actions, newAction];
      await AsyncStorage.setItem(
        `${DREAM_ACTIONS_PREFIX}${dreamId}`,
        JSON.stringify(updatedActions)
      );

      // Update dream progress
      const dream = dreams.find((d) => d.id === dreamId);
      if (dream) {
        await updateDream(dreamId, {
          progress: {
            ...dream.progress,
            totalActions: updatedActions.length,
          },
        });
      }

      return newAction;
    },
    [dreams, getDreamActions, updateDream]
  );

  // Complete an action
  const completeDreamAction = useCallback(
    async (dreamId: string, actionId: string): Promise<void> => {
      const actions = await getDreamActions(dreamId);
      const updatedActions = actions.map((a) =>
        a.id === actionId
          ? { ...a, isCompleted: true, completedAt: new Date().toISOString() }
          : a
      );
      await AsyncStorage.setItem(
        `${DREAM_ACTIONS_PREFIX}${dreamId}`,
        JSON.stringify(updatedActions)
      );

      // Update dream progress
      const dream = dreams.find((d) => d.id === dreamId);
      if (dream) {
        const completedCount = updatedActions.filter((a) => a.isCompleted).length;
        await updateDream(dreamId, {
          progress: {
            ...dream.progress,
            completedActions: completedCount,
            currentStreak: dream.progress.currentStreak + 1,
            longestStreak: Math.max(
              dream.progress.longestStreak,
              dream.progress.currentStreak + 1
            ),
            lastActivityAt: new Date().toISOString(),
          },
        });
      }
    },
    [dreams, getDreamActions, updateDream]
  );

  // Get chat history for a dream
  const getDreamChat = useCallback(
    async (dreamId: string): Promise<DreamChatHistory | null> => {
      try {
        const stored = await AsyncStorage.getItem(`${DREAM_CHAT_PREFIX}${dreamId}`);
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    },
    []
  );

  // Save chat message to dream
  const addDreamChatMessage = useCallback(
    async (dreamId: string, message: Omit<DreamChatMessage, 'id' | 'timestamp'>): Promise<void> => {
      const history = (await getDreamChat(dreamId)) || {
        dreamId,
        messages: [],
        lastUpdatedAt: new Date().toISOString(),
      };

      const newMessage: DreamChatMessage = {
        ...message,
        id: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      history.messages.push(newMessage);
      history.lastUpdatedAt = new Date().toISOString();

      await AsyncStorage.setItem(`${DREAM_CHAT_PREFIX}${dreamId}`, JSON.stringify(history));
    },
    [getDreamChat]
  );

  // Get proofs for a dream
  const getDreamProofs = useCallback(async (dreamId: string): Promise<ProofEntry[]> => {
    try {
      const stored = await AsyncStorage.getItem(`${DREAM_PROOFS_PREFIX}${dreamId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Add proof to a dream
  const addDreamProof = useCallback(
    async (dreamId: string, proof: Omit<ProofEntry, 'id' | 'createdAt'>): Promise<ProofEntry> => {
      const proofs = await getDreamProofs(dreamId);
      const newProof: ProofEntry = {
        ...proof,
        id: `proof_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updatedProofs = [...proofs, newProof];
      await AsyncStorage.setItem(
        `${DREAM_PROOFS_PREFIX}${dreamId}`,
        JSON.stringify(updatedProofs)
      );
      return newProof;
    },
    [getDreamProofs]
  );

  return {
    dreams,
    activeDream,
    activeDreamId,
    loading,
    createDream,
    updateDream,
    switchDream,
    deleteDream,
    getDreamActions,
    addDreamAction,
    completeDreamAction,
    getDreamChat,
    addDreamChatMessage,
    getDreamProofs,
    addDreamProof,
  };
}
