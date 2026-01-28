import { useState, useCallback, useRef } from 'react';
import {
  getInstantReframe,
  generatePermissionSlip,
  generateMicroActions,
  continueConversation,
  PermissionSlipData,
  MicroActionData,
  PermissionSlipStyle,
  getPermissionSlipStyle,
} from '@/services/aiService';
import { ChatMessage } from '@/types';

// Hook for intelligent chat with Gabby - context-aware and versatile
export function useInstantReframe(stuckPoint?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to always have access to latest messages in the callback
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

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

  const clearChat = useCallback(() => {
    setMessages([]);
    messagesRef.current = [];
    setError(null);
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

  const generateActions = useCallback(async (
    dream: string,
    stuckPoint?: string,
    completedActionsCount: number = 0
  ) => {
    setIsLoading(true);
    setError(null);
    setActions([]);

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

  const clearActions = useCallback(() => {
    setActions([]);
    setError(null);
  }, []);

  return {
    actions,
    isLoading,
    error,
    generateActions,
    clearActions,
  };
}
