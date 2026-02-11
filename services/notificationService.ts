/**
 * Notification Service for The Bold Move
 * Handles push notifications using expo-notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationType,
  GABBY_DAILY_NUDGE_MESSAGES,
  GABBY_MORNING_REFRAMES,
  STREAK_SAVIOR_MESSAGES,
  getRandomMessage,
  formatStreakMessage,
} from '@/types/notifications';

const NOTIFICATION_PREFS_KEY = '@boldmove_notification_prefs';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notification channel IDs for Android
const CHANNELS = {
  daily_nudge: 'daily-nudge',
  morning_reframe: 'morning-reframe',
  hype_squad: 'hype-squad',
  streak_savior: 'streak-savior',
};

/**
 * Initialize notification channels (Android only)
 */
export async function initializeNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNELS.daily_nudge, {
      name: 'Daily Nudge',
      description: 'Your daily micro-action reminder',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4AF37', // Champagne Gold
    });

    await Notifications.setNotificationChannelAsync(CHANNELS.morning_reframe, {
      name: "PaxGo Morning Reframe",
      description: 'Mindset shifts and motivational quotes',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    await Notifications.setNotificationChannelAsync(CHANNELS.hype_squad, {
      name: 'Hype Squad Alerts',
      description: 'Updates from your support community',
      importance: Notifications.AndroidImportance.HIGH,
    });

    await Notifications.setNotificationChannelAsync(CHANNELS.streak_savior, {
      name: 'Streak Savior',
      description: "Don't lose your boldness streak!",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
    });
  }
}

/**
 * Check if the device can receive push notifications
 */
export function canReceivePushNotifications(): boolean {
  return Device.isDevice;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return 'denied';
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return 'granted';
  }

  const { status } = await Notifications.requestPermissionsAsync();

  return status === 'granted' ? 'granted' : 'denied';
}

/**
 * Get current notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

/**
 * Load notification preferences from storage
 */
export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load notification preferences:', error);
  }
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

/**
 * Save notification preferences to storage
 */
export async function saveNotificationPreferences(
  prefs: NotificationPreferences
): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save notification preferences:', error);
  }
}

/**
 * Parse time string (HH:mm) to hours and minutes
 */
function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Schedule the daily nudge notification
 */
export async function scheduleDailyNudge(time: string): Promise<string | null> {
  try {
    // Cancel existing daily nudge notifications
    await cancelNotificationsByType('daily_nudge');

    const { hours, minutes } = parseTime(time);
    const message = getRandomMessage(GABBY_DAILY_NUDGE_MESSAGES);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time for Your Bold Move! 🌟",
        body: message,
        data: { type: 'daily_nudge' },
        ...(Platform.OS === 'android' && { channelId: CHANNELS.daily_nudge }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Failed to schedule daily nudge:', error);
    return null;
  }
}

/**
 * Schedule morning reframe notifications
 */
export async function scheduleMorningReframe(
  frequency: 'daily' | 'weekdays' | 'weekends' | 'random'
): Promise<string[]> {
  try {
    // Cancel existing reframe notifications
    await cancelNotificationsByType('morning_reframe');

    const identifiers: string[] = [];
    const reframe = GABBY_MORNING_REFRAMES[Math.floor(Math.random() * GABBY_MORNING_REFRAMES.length)];

    if (frequency === 'daily') {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "PaxGo Morning Reframe ✨",
          body: reframe.message,
          data: { type: 'morning_reframe', theme: reframe.theme },
          ...(Platform.OS === 'android' && { channelId: CHANNELS.morning_reframe }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 7,
          minute: 30,
        },
      });
      identifiers.push(id);
    } else if (frequency === 'weekdays') {
      // Schedule for Monday-Friday
      for (let weekday = 2; weekday <= 6; weekday++) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "PaxGo Morning Reframe ✨",
            body: reframe.message,
            data: { type: 'morning_reframe', theme: reframe.theme },
            ...(Platform.OS === 'android' && { channelId: CHANNELS.morning_reframe }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour: 7,
            minute: 30,
          },
        });
        identifiers.push(id);
      }
    } else if (frequency === 'weekends') {
      // Schedule for Saturday and Sunday
      for (const weekday of [1, 7]) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "PaxGo Morning Reframe ✨",
            body: reframe.message,
            data: { type: 'morning_reframe', theme: reframe.theme },
            ...(Platform.OS === 'android' && { channelId: CHANNELS.morning_reframe }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour: 8,
            minute: 30,
          },
        });
        identifiers.push(id);
      }
    } else {
      // Random: 2-3 times per week (Monday, Wednesday, Friday)
      for (const weekday of [2, 4, 6]) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "PaxGo Morning Reframe ✨",
            body: GABBY_MORNING_REFRAMES[Math.floor(Math.random() * GABBY_MORNING_REFRAMES.length)].message,
            data: { type: 'morning_reframe' },
            ...(Platform.OS === 'android' && { channelId: CHANNELS.morning_reframe }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour: 7,
            minute: 30,
          },
        });
        identifiers.push(id);
      }
    }

    return identifiers;
  } catch (error) {
    console.error('Failed to schedule morning reframe:', error);
    return [];
  }
}

/**
 * Schedule streak savior notification
 */
export async function scheduleStreakSavior(
  time: string,
  currentStreak: number
): Promise<string | null> {
  try {
    // Cancel existing streak savior notifications
    await cancelNotificationsByType('streak_savior');

    if (currentStreak === 0) {
      return null; // No streak to save
    }

    const { hours, minutes } = parseTime(time);
    const message = formatStreakMessage(
      getRandomMessage(STREAK_SAVIOR_MESSAGES),
      currentStreak
    );

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Streak Alert! 🔥",
        body: message,
        data: { type: 'streak_savior', streak: currentStreak },
        ...(Platform.OS === 'android' && { channelId: CHANNELS.streak_savior }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Failed to schedule streak savior:', error);
    return null;
  }
}

/**
 * Send an immediate hype squad notification
 */
export async function sendHypeSquadNotification(
  type: 'cheer' | 'newMember' | 'milestone',
  name: string
): Promise<void> {
  try {
    const messages = {
      cheer: `${name} just sent you a cheer! 🎉 Your Hype Squad believes in you!`,
      newMember: `Welcome ${name} to your Hype Squad! You've got a new cheerleader 👯‍♀️`,
      milestone: `Your squad mate ${name} just hit a milestone! Send them some love 💛`,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: type === 'cheer' ? "You've Been Cheered! 🎉" :
          type === 'newMember' ? "New Squad Member! 👯‍♀️" :
            "Squad Milestone! 🏆",
        body: messages[type],
        data: { type: 'hype_squad', subtype: type, name },
        ...(Platform.OS === 'android' && { channelId: CHANNELS.hype_squad }),
      },
      trigger: null, // Immediate notification
    });
  } catch (error) {
    console.error('Failed to send hype squad notification:', error);
  }
}

/**
 * Cancel notifications by type
 */
export async function cancelNotificationsByType(type: NotificationType): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(
      (notification) => notification.content.data?.type === type
    );

    for (const notification of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to cancel all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Update all scheduled notifications based on preferences
 */
export async function updateScheduledNotifications(
  prefs: NotificationPreferences,
  currentStreak: number = 0
): Promise<void> {
  if (!prefs.enabled) {
    await cancelAllNotifications();
    return;
  }

  // Daily Nudge
  if (prefs.dailyNudge.enabled) {
    await scheduleDailyNudge(prefs.dailyNudge.time);
  } else {
    await cancelNotificationsByType('daily_nudge');
  }

  // Morning Reframe
  if (prefs.morningReframe.enabled) {
    await scheduleMorningReframe(prefs.morningReframe.frequency);
  } else {
    await cancelNotificationsByType('morning_reframe');
  }

  // Streak Savior
  if (prefs.streakSavior.enabled && currentStreak > 0) {
    await scheduleStreakSavior(prefs.streakSavior.reminderTime, currentStreak);
  } else {
    await cancelNotificationsByType('streak_savior');
  }

  // Note: Hype Squad notifications are sent immediately when events occur,
  // not scheduled in advance
}

/**
 * Add notification response listener
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add notification received listener (when app is in foreground)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}
