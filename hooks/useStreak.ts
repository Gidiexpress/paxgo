import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const STREAK_KEY = '@boldmove_streak';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalBoldDays: number;
  weekActivity: boolean[]; // Last 7 days, index 0 = today
}

interface LocalStreakData extends StreakData {
  userId?: string;
}

// Check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Check if date1 is exactly one day before date2
function isYesterday(date1: Date, date2: Date): boolean {
  const yesterday = new Date(date2);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date1, yesterday);
}

// Get days since last activity (0 = today, 1 = yesterday, etc.)
function getDaysSince(lastDate: Date, now: Date): number {
  const diffTime = now.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Generate week activity array
function generateWeekActivity(lastActiveDate: string | null, currentStreak: number): boolean[] {
  const week: boolean[] = [false, false, false, false, false, false, false];

  if (!lastActiveDate || currentStreak === 0) {
    return week;
  }

  const lastActive = new Date(lastActiveDate);
  const today = new Date();
  const daysSince = getDaysSince(lastActive, today);

  // Mark active days based on streak
  for (let i = 0; i < Math.min(currentStreak, 7 - daysSince); i++) {
    const dayIndex = daysSince + i;
    if (dayIndex >= 0 && dayIndex < 7) {
      week[dayIndex] = true;
    }
  }

  return week;
}

export function useStreak(userId?: string) {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    totalBoldDays: 0,
    weekActivity: [false, false, false, false, false, false, false],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isBoldToday, setIsBoldToday] = useState(false);

  // Load streak data on mount
  useEffect(() => {
    const loadStreak = async () => {
      try {
        // First try local storage
        const localData = await AsyncStorage.getItem(STREAK_KEY);
        let data: LocalStreakData | null = localData ? JSON.parse(localData) : null;

        // If user is logged in, try to get from Supabase
        if (userId) {
          const { data: supabaseData, error } = await supabase
            .from('streaks')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (!error && supabaseData) {
            data = {
              currentStreak: supabaseData.current_streak || 0,
              longestStreak: supabaseData.longest_streak || 0,
              lastActiveDate: supabaseData.last_active_date,
              totalBoldDays: (supabaseData.current_streak || 0) + (supabaseData.longest_streak || 0), // Approximation
              weekActivity: generateWeekActivity(supabaseData.last_active_date, supabaseData.current_streak || 0),
              userId,
            };
          }
        }

        if (data) {
          // Check if streak needs to be reset (more than 1 day since last activity)
          const now = new Date();
          if (data.lastActiveDate) {
            const lastActive = new Date(data.lastActiveDate);
            const daysSince = getDaysSince(lastActive, now);

            if (daysSince > 1) {
              // Streak broken - reset current streak
              data = {
                ...data,
                currentStreak: 0,
                weekActivity: generateWeekActivity(null, 0),
              };
              // Save reset data
              await saveStreakData(data, userId);
            } else if (daysSince === 0) {
              // Same day - already bold today
              setIsBoldToday(true);
            }

            // Regenerate week activity
            data.weekActivity = generateWeekActivity(data.lastActiveDate, data.currentStreak);
          }

          setStreak(data);
        }
      } catch (error) {
        console.error('Failed to load streak:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreak();
  }, [userId]);

  // Save streak data to local storage and optionally Supabase
  const saveStreakData = async (data: StreakData, forUserId?: string) => {
    try {
      // Save locally
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({ ...data, userId: forUserId }));

      // Sync to Supabase if user is logged in
      if (forUserId) {
        const { error } = await supabase
          .from('streaks')
          .upsert({
            user_id: forUserId,
            current_streak: data.currentStreak,
            longest_streak: data.longestStreak,
            last_active_date: data.lastActiveDate,
          }, {
            onConflict: 'user_id',
          });

        if (error) {
          console.error('Failed to sync streak to Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Failed to save streak:', error);
    }
  };

  // Record a bold action (increment streak if not already bold today)
  const recordBoldAction = useCallback(async (): Promise<boolean> => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Check if already bold today
    if (streak.lastActiveDate) {
      const lastActive = new Date(streak.lastActiveDate);
      if (isSameDay(lastActive, now)) {
        // Already recorded today
        return false;
      }
    }

    // Calculate new streak
    let newStreak = 1;
    if (streak.lastActiveDate) {
      const lastActive = new Date(streak.lastActiveDate);
      if (isYesterday(lastActive, now)) {
        // Continuing streak
        newStreak = streak.currentStreak + 1;
      }
      // Otherwise starting fresh (newStreak = 1)
    }

    const newData: StreakData = {
      currentStreak: newStreak,
      longestStreak: Math.max(streak.longestStreak, newStreak),
      lastActiveDate: todayStr,
      totalBoldDays: streak.totalBoldDays + 1,
      weekActivity: generateWeekActivity(todayStr, newStreak),
    };

    setStreak(newData);
    setIsBoldToday(true);
    await saveStreakData(newData, userId);

    return true;
  }, [streak, userId]);

  // Get streak message for display
  const getStreakMessage = useCallback((): string => {
    if (streak.currentStreak === 0) {
      return "Start your boldness streak today!";
    }
    if (streak.currentStreak === 1) {
      return "You started a streak! Keep it going!";
    }
    if (streak.currentStreak < 7) {
      return `${streak.currentStreak} days bold! You're building momentum!`;
    }
    if (streak.currentStreak < 30) {
      return `${streak.currentStreak} day streak! You're unstoppable! 🔥`;
    }
    return `${streak.currentStreak} days! You're a legend! 👑`;
  }, [streak.currentStreak]);

  // Get celebration milestone if reached
  const getStreakMilestone = useCallback((streakCount: number): { title: string; emoji: string } | null => {
    const milestones: Record<number, { title: string; emoji: string }> = {
      3: { title: "3-Day Streak!", emoji: "🌱" },
      7: { title: "Week Warrior!", emoji: "🔥" },
      14: { title: "Fortnight Focus!", emoji: "⚡" },
      21: { title: "Habit Hero!", emoji: "🏆" },
      30: { title: "Monthly Master!", emoji: "👑" },
      50: { title: "50-Day Legend!", emoji: "🌟" },
      100: { title: "Century of Bold!", emoji: "💎" },
    };
    return milestones[streakCount] || null;
  }, []);

  // Check if we just hit a milestone
  const checkMilestone = useCallback((): { title: string; emoji: string } | null => {
    return getStreakMilestone(streak.currentStreak);
  }, [streak.currentStreak, getStreakMilestone]);

  // Reset streak (mainly for testing)
  const resetStreak = useCallback(async () => {
    const newData: StreakData = {
      currentStreak: 0,
      longestStreak: streak.longestStreak,
      lastActiveDate: null,
      totalBoldDays: streak.totalBoldDays,
      weekActivity: [false, false, false, false, false, false, false],
    };
    setStreak(newData);
    setIsBoldToday(false);
    await saveStreakData(newData, userId);
  }, [streak.longestStreak, streak.totalBoldDays, userId]);

  return {
    streak,
    isLoading,
    isBoldToday,
    recordBoldAction,
    getStreakMessage,
    checkMilestone,
    getStreakMilestone,
    resetStreak,
  };
}
