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
  const appState = useRef(AppState.currentState);

  const isDeviceSupported = canReceivePushNotifications();

  // Load preferences on mount
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        await initializeNotificationChannels();
        const prefs = await loadNotificationPreferences();

        // Update permission status
        const permissionStatus = await getNotificationPermissionStatus();
        prefs.permissionStatus = permissionStatus;

        setPreferences(prefs);

        // Update scheduled notifications based on loaded preferences
        if (prefs.permissionStatus === 'granted') {
          await updateScheduledNotifications(prefs, currentStreak);
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrefs();
  }, [currentStreak]);

  // Listen for app state changes to refresh permission status
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        const status = await getNotificationPermissionStatus();
        setPreferences(prev => {
          if (prev.permissionStatus !== status) {
            return { ...prev, permissionStatus: status };
          }
          return prev;
        });
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  // Set up notification listeners
  useEffect(() => {
    const responseSubscription = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      // Handle notification taps here (e.g., navigate to specific screens)
    });

    const receivedSubscription = addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification.request.content);
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    await saveNotificationPreferences(newPrefs);

    // Update scheduled notifications if permission is granted
    if (newPrefs.permissionStatus === 'granted') {
      await updateScheduledNotifications(newPrefs, currentStreak);
    }
  }, [preferences, currentStreak]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const status = await requestNotificationPermissions();
    const granted = status === 'granted';

    await updatePreferences({
      hasAskedPermission: true,
      permissionStatus: status,
    });

    if (granted) {
      await updateScheduledNotifications(preferences, currentStreak);
    }

    return granted;
  }, [updatePreferences, preferences, currentStreak]);

  const checkPermissionStatus = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    setPreferences(prev => ({ ...prev, permissionStatus: status }));
    return status;
  }, []);

  const refreshPermissionStatus = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    if (status !== preferences.permissionStatus) {
      await updatePreferences({ permissionStatus: status });
    }
  }, [preferences.permissionStatus, updatePreferences]);

  const toggleMasterSwitch = useCallback(async (enabled: boolean) => {
    await updatePreferences({ enabled });
  }, [updatePreferences]);

  const setDailyNudgeTime = useCallback(async (time: string) => {
    await updatePreferences({
      dailyNudge: { ...preferences.dailyNudge, time },
    });
  }, [preferences.dailyNudge, updatePreferences]);

  const setDailyNudgeEnabled = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      dailyNudge: { ...preferences.dailyNudge, enabled },
    });
  }, [preferences.dailyNudge, updatePreferences]);

  const setMorningReframeEnabled = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      morningReframe: { ...preferences.morningReframe, enabled },
    });
  }, [preferences.morningReframe, updatePreferences]);

  const setMorningReframeFrequency = useCallback(async (
    frequency: 'daily' | 'weekdays' | 'weekends' | 'random'
  ) => {
    await updatePreferences({
      morningReframe: { ...preferences.morningReframe, frequency },
    });
  }, [preferences.morningReframe, updatePreferences]);

  const setHypeSquadEnabled = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      hypeSquad: { ...preferences.hypeSquad, enabled },
    });
  }, [preferences.hypeSquad, updatePreferences]);

  const setStreakSaviorEnabled = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      streakSavior: { ...preferences.streakSavior, enabled },
    });
  }, [preferences.streakSavior, updatePreferences]);

  const setStreakSaviorTime = useCallback(async (time: string) => {
    await updatePreferences({
      streakSavior: { ...preferences.streakSavior, reminderTime: time },
    });
  }, [preferences.streakSavior, updatePreferences]);

  const markPrePromptShown = useCallback(async () => {
    await updatePreferences({ hasShownPrePrompt: true });
  }, [updatePreferences]);

  const shouldShowPrePrompt =
    isDeviceSupported &&
    !preferences.hasShownPrePrompt &&
    !preferences.hasAskedPermission &&
    preferences.permissionStatus === 'undetermined';

  return {
    preferences,
    isLoading,
    isDeviceSupported,
    requestPermission,
    checkPermissionStatus,
    updatePreferences,
    toggleMasterSwitch,
    setDailyNudgeTime,
    setDailyNudgeEnabled,
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
