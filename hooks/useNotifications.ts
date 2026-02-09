/**
 * Hook for managing push notifications in The Bold Move
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/notifications';
import {
  initializeNotificationChannels,
  canReceivePushNotifications,
  requestNotificationPermissions,
  getNotificationPermissionStatus,
  loadNotificationPreferences,
  saveNotificationPreferences,
  updateScheduledNotifications,
  addNotificationResponseListener,
  addNotificationReceivedListener,
} from '@/services/notificationService';

interface UseNotificationsReturn {
  preferences: NotificationPreferences;
  isLoading: boolean;
  isDeviceSupported: boolean;

  // Permission handling
  requestPermission: () => Promise<boolean>;
  checkPermissionStatus: () => Promise<'granted' | 'denied' | 'undetermined'>;

  // Preference updates
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  toggleMasterSwitch: (enabled: boolean) => Promise<void>;
  setDailyNudgeTime: (time: string) => Promise<void>;
  setDailyNudgeEnabled: (enabled: boolean) => Promise<void>;
  setMorningReframeEnabled: (enabled: boolean) => Promise<void>;
  setMorningReframeFrequency: (frequency: 'daily' | 'weekdays' | 'weekends' | 'random') => Promise<void>;
  setHypeSquadEnabled: (enabled: boolean) => Promise<void>;
  setStreakSaviorEnabled: (enabled: boolean) => Promise<void>;
  setStreakSaviorTime: (time: string) => Promise<void>;

  // Pre-prompt state
  markPrePromptShown: () => Promise<void>;
  shouldShowPrePrompt: boolean;

  // Refresh
  refreshPermissionStatus: () => Promise<void>;
}

export function useNotifications(currentStreak: number = 0): UseNotificationsReturn {
  // Stub implementation to disable notifications explicitly
  const stubPreferences: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    enabled: false,
    permissionStatus: 'denied',
  };

  const noOp = async () => { };

  return {
    preferences: stubPreferences,
    isLoading: false,
    isDeviceSupported: false, // Explicitly false to hide UI elements
    requestPermission: async () => false,
    checkPermissionStatus: async () => 'denied',
    updatePreferences: async () => { },
    toggleMasterSwitch: async () => { },
    setDailyNudgeTime: async () => { },
    setDailyNudgeEnabled: async () => { },
    setMorningReframeEnabled: async () => { },
    setMorningReframeFrequency: async () => { },
    setHypeSquadEnabled: async () => { },
    setStreakSaviorEnabled: async () => { },
    setStreakSaviorTime: async () => { },
    markPrePromptShown: async () => { },
    shouldShowPrePrompt: false,
    refreshPermissionStatus: async () => { },
  };
}
