import { useState, useCallback } from 'react';
import { useTextGeneration } from '@fastshot/ai';
import {
  getInstantReframe,
  generatePermissionSlip,
  generateMicroActions,
  continueConversation,
  PermissionSlipData,
  MicroActionData,
} from '@/services/aiService';
import { ChatMessage } from '@/types';

// Hook for Instant Reframe chat
export function useInstantReframe() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (userMessage: string) => {
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
      // Get AI response
      const response = messages.length === 0
        ? await getInstantReframe(userMessage)
        : await continueConversation(messages, userMessage);

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
  }, [messages]);

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

// Hook for Permission Slip generation
export function usePermissionSlip() {
  const [slip, setSlip] = useState<PermissionSlipData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSlip = useCallback(async (fear: string) => {
    setIsLoading(true);
    setError(null);
    setSlip(null);

    try {
      const response = await generatePermissionSlip(fear);
      if (response.success && response.data) {
        setSlip(response.data);
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
  }, []);

  return {
    slip,
    isLoading,
    error,
    generateSlip,
    clearSlip,
  };
}

// Hook for Micro-Action generation
export function useMicroActions() {
  const [actions, setActions] = useState<MicroActionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateActions = useCallback(async (dream: string, stuckPoint?: string) => {
    setIsLoading(true);
    setError(null);
    setActions([]);

    try {
      const response = await generateMicroActions(dream, stuckPoint);
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
