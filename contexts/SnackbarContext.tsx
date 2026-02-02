import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

export interface SnackbarConfig {
  id: string;
  message: string;
  type: SnackbarType;
  duration?: number; // in ms, default 4000
  action?: {
    label: string;
    onPress: () => void;
  };
  icon?: string;
  haptic?: boolean; // default true
}

interface SnackbarContextType {
  snackbars: SnackbarConfig[];
  showSnackbar: (config: Omit<SnackbarConfig, 'id'>) => string;
  hideSnackbar: (id: string) => void;
  showSuccess: (message: string, options?: Partial<SnackbarConfig>) => string;
  showError: (message: string, options?: Partial<SnackbarConfig>) => string;
  showInfo: (message: string, options?: Partial<SnackbarConfig>) => string;
  showWarning: (message: string, options?: Partial<SnackbarConfig>) => string;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function useSnackbar(): SnackbarContextType {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [snackbars, setSnackbars] = useState<SnackbarConfig[]>([]);
  const idCounter = useRef(0);

  const triggerHaptic = useCallback(async (type: SnackbarType) => {
    switch (type) {
      case 'success':
        // Light double tap for success
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 100);
        break;
      case 'error':
        // Heavy impact for error
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'warning':
        // Medium warning
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'info':
        // Soft tap for info
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        break;
    }
  }, []);

  const showSnackbar = useCallback((config: Omit<SnackbarConfig, 'id'>): string => {
    const id = `snackbar-${Date.now()}-${idCounter.current++}`;

    const snackbarConfig: SnackbarConfig = {
      id,
      duration: 4000,
      haptic: true,
      ...config,
    };

    // Trigger haptic feedback
    if (snackbarConfig.haptic !== false) {
      triggerHaptic(snackbarConfig.type);
    }

    setSnackbars(prev => {
      // Limit queue to 3 snackbars max
      const newQueue = [...prev, snackbarConfig];
      if (newQueue.length > 3) {
        return newQueue.slice(-3);
      }
      return newQueue;
    });

    return id;
  }, [triggerHaptic]);

  const hideSnackbar = useCallback((id: string) => {
    setSnackbars(prev => prev.filter(s => s.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, options?: Partial<SnackbarConfig>): string => {
    return showSnackbar({
      message,
      type: 'success',
      icon: '✓',
      ...options,
    });
  }, [showSnackbar]);

  const showError = useCallback((message: string, options?: Partial<SnackbarConfig>): string => {
    return showSnackbar({
      message,
      type: 'error',
      icon: '✕',
      duration: 5000, // Errors stay longer
      ...options,
    });
  }, [showSnackbar]);

  const showInfo = useCallback((message: string, options?: Partial<SnackbarConfig>): string => {
    return showSnackbar({
      message,
      type: 'info',
      icon: 'ℹ',
      ...options,
    });
  }, [showSnackbar]);

  const showWarning = useCallback((message: string, options?: Partial<SnackbarConfig>): string => {
    return showSnackbar({
      message,
      type: 'warning',
      icon: '⚠',
      ...options,
    });
  }, [showSnackbar]);

  return (
    <SnackbarContext.Provider
      value={{
        snackbars,
        showSnackbar,
        hideSnackbar,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
    </SnackbarContext.Provider>
  );
}
