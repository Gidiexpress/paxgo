// Multi-Dream Types for The Bold Move

export interface Dream {
  id: string;
  title: string;
  category: DreamCategory;
  description: string;
  coreMotivation?: string;
  createdAt: string;
  isActive: boolean;
  progress: DreamProgress;
  fiveWhysCompleted: boolean;
  permissionSlipSigned: boolean;
}

export type DreamCategory = 'career' | 'travel' | 'finance' | 'creative' | 'wellness';

export interface DreamProgress {
  totalActions: number;
  completedActions: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt?: string;
}

export interface DreamChatHistory {
  dreamId: string;
  messages: DreamChatMessage[];
  lastUpdatedAt: string;
}

export interface DreamChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const DREAM_CATEGORIES: Record<DreamCategory, {
  title: string;
  icon: string;
  gradient: readonly [string, string];
  description: string;
}> = {
  career: {
    title: 'Career Growth',
    icon: '🚀',
    gradient: ['#E2725B', '#C45A45'] as const,
    description: 'Level up professionally',
  },
  travel: {
    title: 'Travel & Adventure',
    icon: '✈️',
    gradient: ['#2EC4B6', '#22A399'] as const,
    description: 'Explore the world',
  },
  finance: {
    title: 'Financial Freedom',
    icon: '💰',
    gradient: ['#D4AF37', '#B8952D'] as const,
    description: 'Build your wealth',
  },
  creative: {
    title: 'Creative Pursuits',
    icon: '🎨',
    gradient: ['#9B59B6', '#6C3483'] as const,
    description: 'Express yourself',
  },
  wellness: {
    title: 'Wellness & Habits',
    icon: '🧘',
    gradient: ['#27AE60', '#1E8449'] as const,
    description: 'Transform your lifestyle',
  },
};
