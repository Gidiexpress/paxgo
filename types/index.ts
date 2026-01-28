// Type definitions for Paxgo

export interface User {
  id: string;
  name: string;
  stuckPoint: string;
  dream: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface MicroAction {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  isPremium: boolean;
  isCompleted: boolean;
  completedAt?: string;
  category: string;
  dreamId: string;
}

export interface ProofEntry {
  id: string;
  actionId: string;
  imageUri?: string;
  note: string;
  createdAt: string;
  hashtags: string[];
  reactions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PermissionSlip {
  id: string;
  title: string;
  permission: string;
  signedBy: string;
  createdAt: string;
  fear: string;
}

export interface DreamProgress {
  dreamId: string;
  totalActions: number;
  completedActions: number;
  currentStreak: number;
  longestStreak: number;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  requiredActions: number;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
}

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 'seeker',
    name: 'The Seeker',
    price: 'Free',
    period: '',
    features: [
      '3 AI Reframes per day',
      'Basic micro-actions',
      'Limited proof gallery',
    ],
  },
  {
    id: 'bold-adventurer',
    name: 'The Bold Adventurer',
    price: '$9.99',
    period: '/mo',
    features: [
      'Unlimited AI Deep-Dives',
      'Private Hype Squads',
      'Full Archive Access',
      'Exclusive Dream Maps',
      'Premium micro-actions',
    ],
    isPopular: true,
  },
  {
    id: 'sprint',
    name: 'The 7-Day Sprint',
    price: '$4.99',
    period: 'one-time',
    features: [
      '7 days of unlimited access',
      'Intensive action plan',
      'Daily AI coaching',
    ],
  },
];
