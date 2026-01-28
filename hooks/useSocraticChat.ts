import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generateSocraticResponse,
  parseMessageTokens,
  createInitialDialogueState,
  DialogueState,
  ParsedMessage,
  ChatToken,
} from '@/services/socraticCoachService';
import { supabase } from '@/lib/supabase';
import { Json } from '@/types/database';

const CHAT_STATE_KEY = '@boldmove_chat_state';
const DIALOGUE_STATE_KEY = '@boldmove_dialogue_state';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens: ChatToken[];
  dialogueStep: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ChatState {
  messages: ChatMessage[];
  dialogueState: DialogueState;
}

export function useSocraticChat(stuckPoint?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dialogueState, setDialogueState] = useState<DialogueState>(createInitialDialogueState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  // Use refs to always have access to latest state in callbacks
  const messagesRef = useRef<ChatMessage[]>([]);
  const dialogueStateRef = useRef<DialogueState>(dialogueState);

  messagesRef.current = messages;
  dialogueStateRef.current = dialogueState;

  // Restore chat state on mount
  useEffect(() => {
    const restoreState = async () => {
      try {
        const [storedChat, storedDialogue] = await Promise.all([
          AsyncStorage.getItem(CHAT_STATE_KEY),
          AsyncStorage.getItem(DIALOGUE_STATE_KEY),
        ]);

        if (storedChat) {
          const parsedMessages: ChatMessage[] = JSON.parse(storedChat);
          // Only restore messages from last 24 hours
          const now = Date.now();
          const dayAgo = now - 24 * 60 * 60 * 1000;
          const recentMessages = parsedMessages.filter(
            m => new Date(m.timestamp).getTime() > dayAgo
          );
          if (recentMessages.length > 0) {
            setMessages(recentMessages);
            messagesRef.current = recentMessages;
          }
        }

        if (storedDialogue) {
          const parsedState: DialogueState = JSON.parse(storedDialogue);
          setDialogueState(parsedState);
          dialogueStateRef.current = parsedState;
        }
      } catch (err) {
        console.warn('Failed to restore chat state:', err);
      } finally {
        setIsRestored(true);
      }
    };

    restoreState();
  }, []);

  // Persist chat state whenever it changes
  useEffect(() => {
    if (isRestored && messages.length > 0) {
      const saveState = async () => {
        try {
          // Keep only last 50 messages
          const messagesToSave = messages.slice(-50);
          await Promise.all([
            AsyncStorage.setItem(CHAT_STATE_KEY, JSON.stringify(messagesToSave)),
            AsyncStorage.setItem(DIALOGUE_STATE_KEY, JSON.stringify(dialogueState)),
          ]);
        } catch (err) {
          console.warn('Failed to save chat state:', err);
        }
      };
      saveState();
    }
  }, [messages, dialogueState, isRestored]);

  // Send a message and get Socratic response
  const sendMessage = useCallback(async (userMessage: string) => {
    const trimmedMessage = userMessage.trim();
    if (!trimmedMessage || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Create user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
      tokens: [{ type: 'text', content: trimmedMessage }],
      dialogueStep: dialogueStateRef.current.step,
      timestamp: new Date().toISOString(),
    };

    // Add user message to state
    setMessages(prev => [...prev, userMsg]);

    try {
      // Get conversation history for context
      const history = messagesRef.current.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Generate Socratic response
      const { response, parsedResponse, newState } = await generateSocraticResponse(
        trimmedMessage,
        history,
        dialogueStateRef.current,
        stuckPoint
      );

      // Create assistant message
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        tokens: parsedResponse.tokens,
        dialogueStep: dialogueStateRef.current.step,
        timestamp: new Date().toISOString(),
        metadata: {
          coreBeliefIdentified: newState.coreBeliefIdentified,
        },
      };

      // Update state
      setMessages(prev => [...prev, assistantMsg]);
      setDialogueState(newState);

    } catch (err) {
      console.error('Chat error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, stuckPoint]);

  // Handle button selection
  const selectOption = useCallback(async (option: string) => {
    await sendMessage(option);
  }, [sendMessage]);

  // Clear chat and reset dialogue state
  const clearChat = useCallback(async () => {
    setMessages([]);
    setDialogueState(createInitialDialogueState());
    messagesRef.current = [];
    dialogueStateRef.current = createInitialDialogueState();
    setError(null);

    try {
      await Promise.all([
        AsyncStorage.removeItem(CHAT_STATE_KEY),
        AsyncStorage.removeItem(DIALOGUE_STATE_KEY),
      ]);
    } catch (err) {
      console.warn('Failed to clear chat state:', err);
    }
  }, []);

  // Get the last user message (useful for generating actions)
  const getLastUserMessage = useCallback(() => {
    return messagesRef.current.filter(m => m.role === 'user').pop()?.content || '';
  }, []);

  // Get current dialogue step description
  const getStepDescription = useCallback(() => {
    const stepDescriptions: Record<number, string> = {
      1: 'Validating your feelings',
      2: 'Understanding deeper',
      3: 'Offering a new perspective',
      4: 'Suggesting an action',
    };
    return stepDescriptions[dialogueState.step] || 'Listening';
  }, [dialogueState.step]);

  // Check if we're at the action step (for triggering paywall after first action)
  const isAtActionStep = dialogueState.step === 4;

  // Check if this is a fresh conversation
  const isFreshConversation = messages.length === 0;

  return {
    messages,
    dialogueState,
    isLoading,
    error,
    isRestored,
    isFreshConversation,
    isAtActionStep,
    sendMessage,
    selectOption,
    clearChat,
    getLastUserMessage,
    getStepDescription,
  };
}

// Helper to convert ChatToken to JSON-safe format for database
function serializeTokensForDb(tokens: ChatToken[]): Json[] {
  return tokens.map(token => {
    if (token.type === 'text') {
      return { type: 'text', content: token.content } as Json;
    } else if (token.type === 'buttons') {
      return { type: 'buttons', options: token.options } as Json;
    } else if (token.type === 'action') {
      return {
        type: 'action',
        action: {
          id: token.action.id,
          title: token.action.title,
          description: token.action.description,
          duration: token.action.duration,
          category: token.action.category,
          limitingBelief: token.action.limitingBelief,
        },
      } as Json;
    }
    return { type: 'unknown' } as Json;
  });
}

// Helper to build metadata as Json type
function buildMetadataForDb(tokens: ChatToken[], metadata?: Record<string, unknown>): Json {
  const result: { [key: string]: Json | undefined } = {
    tokens: serializeTokensForDb(tokens),
  };
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      result[key] = value as Json;
    });
  }
  return result;
}

// Sync chat messages to Supabase (for authenticated users)
export async function syncChatToSupabase(userId: string, messages: ChatMessage[]) {
  if (!userId || messages.length === 0) return;

  try {
    // Get existing message IDs
    const { data: existing } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('user_id', userId);

    const existingIds = new Set(existing?.map(m => m.id) || []);

    // Filter new messages
    const newMessages = messages.filter(m => !existingIds.has(m.id));

    if (newMessages.length > 0) {
      const messagesToInsert = newMessages.map(m => ({
        id: m.id,
        user_id: userId,
        role: m.role,
        content: m.content,
        dialogue_step: m.dialogueStep,
        metadata: buildMetadataForDb(m.tokens, m.metadata),
        created_at: m.timestamp,
      }));

      await supabase.from('chat_messages').insert(messagesToInsert);
    }
  } catch (error) {
    console.error('Failed to sync chat to Supabase:', error);
  }
}

// Restore chat from Supabase (for authenticated users)
export async function restoreChatFromSupabase(userId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;

    return (data || []).map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      tokens: (m.metadata as Record<string, unknown>)?.tokens as ChatToken[] || parseMessageTokens(m.content).tokens,
      dialogueStep: m.dialogue_step || 1,
      timestamp: m.created_at || new Date().toISOString(),
      metadata: m.metadata as Record<string, unknown>,
    }));
  } catch (error) {
    console.error('Failed to restore chat from Supabase:', error);
    return [];
  }
}
