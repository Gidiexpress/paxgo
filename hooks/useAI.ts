import { useState, useCallback } from 'react';
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

// Hook for Instant Reframe chat with stuck point awareness
export function useInstantReframe(stuckPoint?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (userMessage: string, userStuckPoint?: string) => {
    setIsLoading(true);
    setError(null);

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Use provided stuck point or default
      const activeStuckPoint = userStuckPoint || stuckPoint;

      // Get AI response with stuck point context
      const response = messages.length === 0
        ? await getInstantReframe(userMessage, activeStuckPoint)
        : await continueConversation(messages, userMessage, activeStuckPoint);

      if (response.success) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setError(response.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [messages, stuckPoint]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
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
