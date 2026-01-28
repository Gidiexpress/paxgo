import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getInstantReframe,
  generatePermissionSlip,
  generateMicroActions,
  generateMicroActionsFromConversation,
  generateInlineChatAction,
  continueConversation,
  PermissionSlipData,
  MicroActionData,
  ChatActionSuggestion,
  PermissionSlipStyle,
  getPermissionSlipStyle,
} from '@/services/aiService';
import { ChatMessage } from '@/types';

const CHAT_HISTORY_KEY = '@boldmove_chat_history';

// Hook for intelligent chat with Gabby - context-aware and versatile with persistence
export function useInstantReframe(stuckPoint?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  // Use ref to always have access to latest messages in the callback
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  // Restore chat history on mount
  useEffect(() => {
    const restoreChatHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
        if (stored) {
          const parsedMessages: ChatMessage[] = JSON.parse(stored);
          // Only restore if messages are from the same session (within last 24 hours)
          const now = new Date().getTime();
          const dayAgo = now - 24 * 60 * 60 * 1000;
          const recentMessages = parsedMessages.filter(
            m => new Date(m.timestamp).getTime() > dayAgo
          );
          if (recentMessages.length > 0) {
            setMessages(recentMessages);
            messagesRef.current = recentMessages;
          }
        }
      } catch (err) {
        console.warn('Failed to restore chat history:', err);
      } finally {
        setIsRestored(true);
      }
    };
    restoreChatHistory();
  }, []);

  // Persist chat history whenever messages change
  useEffect(() => {
    if (isRestored && messages.length > 0) {
      const saveChatHistory = async () => {
        try {
          // Keep only last 50 messages to manage storage
          const messagesToSave = messages.slice(-50);
          await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messagesToSave));
        } catch (err) {
          console.warn('Failed to save chat history:', err);
        }
      };
      saveChatHistory();
    }
  }, [messages, isRestored]);

  const sendMessage = useCallback(async (userMessage: string, userStuckPoint?: string) => {
    // Validate input
    const trimmedMessage = userMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date().toISOString(),
    };

    // Get current messages for context BEFORE adding the new one
    const currentMessages = messagesRef.current;

    // Add user message to state
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Use provided stuck point or default
      const activeStuckPoint = userStuckPoint || stuckPoint;

      // Choose the appropriate AI function based on conversation state
      // First message: use getInstantReframe (handles greetings, questions, fears appropriately)
      // Subsequent messages: use continueConversation with full context
      const response = currentMessages.length === 0
        ? await getInstantReframe(trimmedMessage, activeStuckPoint)
        : await continueConversation(
            // Pass all current messages for full context
            currentMessages.map(m => ({ role: m.role, content: m.content })),
            trimmedMessage,
            activeStuckPoint
          );

      if (response.success && response.message) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setError(response.error || 'Unable to get a response. Please try again.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [stuckPoint]);

  const clearChat = useCallback(async () => {
    setMessages([]);
    messagesRef.current = [];
    setError(null);
    // Also clear persisted chat
    try {
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
    } catch (err) {
      console.warn('Failed to clear chat history:', err);
    }
  }, []);

  // Get the last user message for generating permission slips/actions
  const getLastUserMessage = useCallback(() => {
    return messagesRef.current.filter(m => m.role === 'user').pop()?.content || '';
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    getLastUserMessage,
    isRestored,
  };
}

// Hook for Permission Slip generation with style variants
export function usePermissionSlip() {
  const [slip, setSlip] = useState<PermissionSlipData | null>(null);
  const [slipStyle, setSlipStyle] = useState<PermissionSlipStyle>('classic');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSlip = useCallback(async (fear: string, stuckPoint?: string) => {
    setIsLoading(true);
    setError(null);
    setSlip(null);

    try {
      const response = await generatePermissionSlip(fear, stuckPoint);
      if (response.success && response.data) {
        setSlip(response.data);
        // Set style based on stuck point
        const style = getPermissionSlipStyle(stuckPoint);
        setSlipStyle(style);
      } else {
        setError(response.error || 'Failed to generate permission slip');
      }
    } catch (err) {
      setError('Failed to generate permission slip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSlip = useCallback(() => {
    setSlip(null);
    setError(null);
    setSlipStyle('classic');
  }, []);

  return {
    slip,
    slipStyle,
    isLoading,
    error,
    generateSlip,
    clearSlip,
  };
}

// Hook for context-aware Micro-Action generation
export function useMicroActions() {
  const [actions, setActions] = useState<MicroActionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedContext, setExtractedContext] = useState<string | null>(null);

  // Generate actions from a dream/goal string
  const generateActions = useCallback(async (
    dream: string,
    stuckPoint?: string,
    completedActionsCount: number = 0
  ) => {
    setIsLoading(true);
    setError(null);
    setActions([]);
    setExtractedContext(null);

    try {
      // Pass completed count for context-aware generation
      const response = await generateMicroActions(dream, stuckPoint, completedActionsCount);
      if (response.success && response.actions) {
        setActions(response.actions);
      } else {
        setError(response.error || 'Failed to generate micro-actions');
      }
    } catch (err) {
      setError('Failed to generate micro-actions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate actions from conversation context - more personalized
  const generateActionsFromChat = useCallback(async (
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    stuckPoint?: string,
    completedActionsCount: number = 0
  ) => {
    if (messages.length === 0) {
      setError('No conversation to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);
    setActions([]);
    setExtractedContext(null);

    try {
      const response = await generateMicroActionsFromConversation(
        messages,
        stuckPoint,
        completedActionsCount
      );
      if (response.success && response.actions) {
        setActions(response.actions);
        setExtractedContext(response.extractedContext || null);
      } else {
        setError(response.error || 'Failed to generate contextual actions');
      }
    } catch (err) {
      setError('Failed to generate contextual actions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearActions = useCallback(() => {
    setActions([]);
    setError(null);
    setExtractedContext(null);
  }, []);

  return {
    actions,
    isLoading,
    error,
    extractedContext,
    generateActions,
    generateActionsFromChat,
    clearActions,
  };
}

// Hook for inline chat action suggestions
export function useChatActionSuggestion() {
  const [suggestion, setSuggestion] = useState<ChatActionSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestion = useCallback(async (
    userMessage: string,
    stuckPoint?: string
  ) => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const response = await generateInlineChatAction(userMessage, stuckPoint);
      if (response.success && response.action) {
        setSuggestion(response.action);
      } else {
        setError(response.error || 'Failed to generate suggestion');
      }
    } catch (err) {
      setError('Failed to generate action suggestion.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    setError(null);
  }, []);

  return {
    suggestion,
    isLoading,
    error,
    generateSuggestion,
    clearSuggestion,
  };
}
