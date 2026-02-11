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
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeviceSupported, setIsDeviceSupported] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  // Initialize and load preferences
  useEffect(() => {
    const init = async () => {
      // Check device support
      const supported = canReceivePushNotifications();
      setIsDeviceSupported(supported);

      // Load preferences
      const storedPrefs = await loadNotificationPreferences();

      // Check current permission status
      const status = await getNotificationPermissionStatus();

      setPreferences({
        ...storedPrefs,
        permissionStatus: status,
      });

      setIsLoading(false);

      // Initialize channels on Android
      await initializeNotificationChannels();
    };

    init();
  }, []);

  // Handle app state changes (refresh permissions when coming back to app)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground, check permissions again
        await refreshPermissionStatus();
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  // Update scheduled notifications when preferences change
  useEffect(() => {
    if (!isLoading) {
      updateScheduledNotifications(preferences, currentStreak);
    }
  }, [preferences, currentStreak, isLoading]);

  const refreshPermissionStatus = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    setPreferences((prev) => ({
      ...prev,
      permissionStatus: status,
    }));
  }, []);

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      setPreferences((prev) => {
        const newPrefs = { ...prev, ...updates };
        saveNotificationPreferences(newPrefs);
        return newPrefs;
      });
    },
    []
  );

  const requestPermission = useCallback(async () => {
    const status = await requestNotificationPermissions();
    const granted = status === 'granted';

    await updatePreferences({
      permissionStatus: status,
      hasAskedPermission: true,
      enabled: granted ? true : preferences.enabled, // Auto-enable master switch if granted
    });

    return granted;
  }, [updatePreferences, preferences.enabled]);

  const markPrePromptShown = useCallback(async () => {
    await updatePreferences({ hasShownPrePrompt: true });
  }, [updatePreferences]);

  const toggleMasterSwitch = useCallback(async (enabled: boolean) => {
    await updatePreferences({ enabled });
  }, [updatePreferences]);

  const setDailyNudgeEnabled = useCallback(async (enabled: boolean) => {
    setPreferences((prev) => {
      const newPrefs: NotificationPreferences = {
        ...prev,
        dailyNudge: { ...prev.dailyNudge, enabled },
      };
      saveNotificationPreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const setDailyNudgeTime = useCallback(async (time: string) => {
    setPreferences((prev) => {
      const newPrefs: NotificationPreferences = {
        ...prev,
        dailyNudge: { ...prev.dailyNudge, time },
      };
      saveNotificationPreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const setMorningReframeEnabled = useCallback(async (enabled: boolean) => {
    setPreferences((prev) => {
      const newPrefs: NotificationPreferences = {
        ...prev,
        morningReframe: { ...prev.morningReframe, enabled },
      };
      saveNotificationPreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const setMorningReframeFrequency = useCallback(
    async (frequency: 'daily' | 'weekdays' | 'weekends' | 'random') => {
      setPreferences((prev) => {
        const newPrefs: NotificationPreferences = {
          ...prev,
          morningReframe: { ...prev.morningReframe, frequency },
        };
        saveNotificationPreferences(newPrefs);
        return newPrefs;
      });
    },
    []
  );

  const setHypeSquadEnabled = useCallback(async (enabled: boolean) => {
    setPreferences((prev) => {
      const newPrefs: NotificationPreferences = {
        ...prev,
        hypeSquad: { ...prev.hypeSquad, enabled },
      };
      saveNotificationPreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const setStreakSaviorEnabled = useCallback(async (enabled: boolean) => {
    setPreferences((prev) => {
      const newPrefs: NotificationPreferences = {
        ...prev,
        streakSavior: { ...prev.streakSavior, enabled },
      };
      saveNotificationPreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const setStreakSaviorTime = useCallback(async (time: string) => {
    setPreferences((prev) => {
      const newPrefs: NotificationPreferences = {
        ...prev,
        streakSavior: { ...prev.streakSavior, reminderTime: time },
      };
      saveNotificationPreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  // Determine if we should show the pre-prompt
  const shouldShowPrePrompt =
    !preferences.hasShownPrePrompt &&
    preferences.permissionStatus === 'undetermined';

  return {
    preferences,
    isLoading,
    isDeviceSupported,
    requestPermission,
    checkPermissionStatus: getNotificationPermissionStatus,
    updatePreferences,
    toggleMasterSwitch,
    setDailyNudgeEnabled,
    setDailyNudgeTime,
    setMorningReframeEnabled,
    setMorningReframeFrequency,
    setHypeSquadEnabled,
    setStreakSaviorEnabled,
    setStreakSaviorTime,
    markPrePromptShown,
    shouldShowPrePrompt,
    refreshPermissionStatus,
  };
}
