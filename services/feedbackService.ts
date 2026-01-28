import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { ActionFeedbackData } from '@/components/ActionFeedback';

const FEEDBACK_KEY = '@boldmove_action_feedback';

export interface StoredFeedback extends ActionFeedbackData {
  actionId: string;
  actionTitle: string;
  actionCategory?: string;
  timestamp: string;
}

// Store feedback locally
export async function storeFeedbackLocal(
  actionId: string,
  actionTitle: string,
  feedback: ActionFeedbackData,
  category?: string
): Promise<void> {
  try {
    const existingStr = await AsyncStorage.getItem(FEEDBACK_KEY);
    const existing: StoredFeedback[] = existingStr ? JSON.parse(existingStr) : [];

    const newFeedback: StoredFeedback = {
      ...feedback,
      actionId,
      actionTitle,
      actionCategory: category,
      timestamp: new Date().toISOString(),
    };

    // Keep last 100 feedback entries
    const updated = [...existing, newFeedback].slice(-100);
    await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to store feedback:', error);
  }
}

// Sync feedback to Supabase (for authenticated users)
export async function syncFeedbackToSupabase(
  userId: string,
  actionId: string,
  feedback: ActionFeedbackData
): Promise<void> {
  try {
    await supabase
      .from('micro_actions')
      .update({
        rating: feedback.rating,
      })
      .eq('id', actionId)
      .eq('user_id', userId);
  } catch (error) {
    console.error('Failed to sync feedback to Supabase:', error);
  }
}

// Get all stored feedback
export async function getAllFeedback(): Promise<StoredFeedback[]> {
  try {
    const data = await AsyncStorage.getItem(FEEDBACK_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get feedback:', error);
    return [];
  }
}

// Get feedback summary for AI context
export async function getFeedbackSummary(): Promise<{
  totalFeedback: number;
  averageRating: number;
  preferredCategories: string[];
  moodImprovementRate: number;
  repeatRate: number;
}> {
  try {
    const feedback = await getAllFeedback();

    if (feedback.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        preferredCategories: [],
        moodImprovementRate: 0,
        repeatRate: 0,
      };
    }

    // Calculate average rating
    const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = totalRating / feedback.length;

    // Count category preferences (high-rated actions)
    const categoryScores: Record<string, { total: number; count: number }> = {};
    feedback.forEach((f) => {
      if (f.actionCategory && f.rating >= 4) {
        if (!categoryScores[f.actionCategory]) {
          categoryScores[f.actionCategory] = { total: 0, count: 0 };
        }
        categoryScores[f.actionCategory].total += f.rating;
        categoryScores[f.actionCategory].count++;
      }
    });

    const preferredCategories = Object.entries(categoryScores)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([category]) => category);

    // Calculate mood improvement rate
    const moodChangeFeedback = feedback.filter(
      (f) => f.feelingBefore && f.feelingAfter
    );
    const moodImprovements = moodChangeFeedback.filter((f) => {
      const feelings = ['Anxious', 'Neutral', 'Good', 'Great', 'Amazing'];
      const beforeIndex = feelings.indexOf(f.feelingBefore!);
      const afterIndex = feelings.indexOf(f.feelingAfter!);
      return afterIndex > beforeIndex;
    });
    const moodImprovementRate =
      moodChangeFeedback.length > 0
        ? moodImprovements.length / moodChangeFeedback.length
        : 0;

    // Calculate repeat rate
    const repeatFeedback = feedback.filter((f) => f.wouldRepeat !== null);
    const wouldRepeat = repeatFeedback.filter((f) => f.wouldRepeat === true);
    const repeatRate =
      repeatFeedback.length > 0
        ? wouldRepeat.length / repeatFeedback.length
        : 0;

    return {
      totalFeedback: feedback.length,
      averageRating: Math.round(averageRating * 10) / 10,
      preferredCategories,
      moodImprovementRate: Math.round(moodImprovementRate * 100),
      repeatRate: Math.round(repeatRate * 100),
    };
  } catch (error) {
    console.error('Failed to get feedback summary:', error);
    return {
      totalFeedback: 0,
      averageRating: 0,
      preferredCategories: [],
      moodImprovementRate: 0,
      repeatRate: 0,
    };
  }
}

// Generate context string for AI prompts based on feedback
export async function generateFeedbackContextForAI(): Promise<string> {
  const summary = await getFeedbackSummary();

  if (summary.totalFeedback < 3) {
    return ''; // Not enough data
  }

  const contextParts: string[] = [];

  if (summary.averageRating >= 4) {
    contextParts.push(
      'The user generally finds the suggested actions very helpful.'
    );
  } else if (summary.averageRating < 3) {
    contextParts.push(
      'The user has found some actions less helpful - focus on higher-impact suggestions.'
    );
  }

  if (summary.preferredCategories.length > 0) {
    contextParts.push(
      `The user tends to prefer ${summary.preferredCategories.join(', ')} types of actions.`
    );
  }

  if (summary.moodImprovementRate > 70) {
    contextParts.push(
      'Actions have been effective at improving the user\'s mood.'
    );
  }

  if (summary.repeatRate > 70) {
    contextParts.push(
      'The user often wants to repeat suggested actions - continue with similar patterns.'
    );
  } else if (summary.repeatRate < 50) {
    contextParts.push(
      'Suggest more varied and engaging actions as the user often doesn\'t want to repeat past ones.'
    );
  }

  return contextParts.length > 0
    ? `\n\nUser preference insights from past feedback:\n${contextParts.join('\n')}`
    : '';
}

// Clear all feedback (for testing)
export async function clearAllFeedback(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FEEDBACK_KEY);
  } catch (error) {
    console.error('Failed to clear feedback:', error);
  }
}
