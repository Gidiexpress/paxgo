/**
 * Notification types and preferences for The Bold Move
 */

export type NotificationType =
  | 'daily_nudge'
  | 'morning_reframe'
  | 'hype_squad'
  | 'streak_savior';

export interface NotificationPreferences {
  // Master toggle
  enabled: boolean;

  // Individual notification types
  dailyNudge: {
    enabled: boolean;
    time: string; // HH:mm format, e.g., "09:00"
  };
  morningReframe: {
    enabled: boolean;
    frequency: 'daily' | 'weekdays' | 'weekends' | 'random'; // random = 2-3 times per week
  };
  hypeSquad: {
    enabled: boolean;
    cheers: boolean;
    newMembers: boolean;
  };
  streakSavior: {
    enabled: boolean;
    reminderTime: string; // HH:mm format, e.g., "20:00"
  };

  // Permission state
  hasAskedPermission: boolean;
  hasShownPrePrompt: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  dailyNudge: {
    enabled: true,
    time: '09:00',
  },
  morningReframe: {
    enabled: true,
    frequency: 'random',
  },
  hypeSquad: {
    enabled: true,
    cheers: true,
    newMembers: true,
  },
  streakSavior: {
    enabled: true,
    reminderTime: '20:00',
  },
  hasAskedPermission: false,
  hasShownPrePrompt: false,
  permissionStatus: 'undetermined',
};

// Gabby's empathetic notification messages
export const GABBY_DAILY_NUDGE_MESSAGES = [
  "Hey friend! Your 5-minute bold move is waiting. You've got this! 💪",
  "Time to shine! One small action today = one giant leap for your dreams ✨",
  "Ready for your daily dose of courage? Let's make magic happen 🌟",
  "Your future self is cheering you on! 5 minutes is all it takes 🎯",
  "Another day, another opportunity to surprise yourself. Let's go! 🚀",
  "The journey of a thousand miles... starts with your next micro-action 🌍",
  "Your dream is calling! Pick up and say 'I'm on my way' 📞",
  "Small steps, big impact. Your bold move is ready when you are 👟",
];

export const GABBY_MORNING_REFRAMES = [
  {
    message: "Remember: Every expert was once a beginner. Your 'not ready' is actually your 'growing stronger' 🌱",
    theme: 'growth',
  },
  {
    message: "What if today's tiny step is the one that changes everything? Only one way to find out... ✨",
    theme: 'possibility',
  },
  {
    message: "Fear and excitement feel the same in your body. Maybe you're not scared—you're just REALLY excited! 🎢",
    theme: 'reframe',
  },
  {
    message: "Your comfort zone is nice, but nothing legendary ever grew there. Ready to stretch a little? 🌟",
    theme: 'courage',
  },
  {
    message: "Plot twist: You don't need to feel ready. You just need to take the next step. 👣",
    theme: 'action',
  },
  {
    message: "The only difference between you and people who've done what you dream of? They started. Today's your day 🌅",
    theme: 'inspiration',
  },
  {
    message: "Permission slip reminder: You're allowed to want big things AND be a work in progress 💛",
    theme: 'self-compassion',
  },
  {
    message: "What would the boldest version of you do today? (Hint: It might be smaller than you think) 🦁",
    theme: 'boldness',
  },
];

export const STREAK_SAVIOR_MESSAGES = [
  "Hey! Your {streak}-day streak is counting on you. One quick action to keep the fire alive? 🔥",
  "Almost forgot! Your boldness streak ({streak} days!) would love a quick 5-min action before bed 💪",
  "Streak check! You've been amazing for {streak} days. Don't let today slip away! ✨",
  "Your future self will thank you! One small action to keep your {streak}-day streak going? 🌟",
  "Last call for boldness! Your {streak}-day streak is too good to break now 🏆",
];

export const HYPE_SQUAD_MESSAGES = {
  cheer: "{name} just sent you a cheer! 🎉 Your Hype Squad believes in you!",
  newMember: "Welcome {name} to your Hype Squad! You've got a new cheerleader 👯‍♀️",
  milestone: "Your squad mate {name} just hit a milestone! Send them some love 💛",
};

// Helper function to get a random message
export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Helper function to format streak message
export function formatStreakMessage(message: string, streak: number): string {
  return message.replace(/{streak}/g, streak.toString());
}
