// Community & Social Feature Types

export interface HypeFeedItem {
  id: string;
  // Anonymized user info
  avatarEmoji: string;
  dreamCategory: string;
  // Content
  winType: 'action' | 'milestone' | 'streak' | 'proof';
  winTitle: string;
  winDescription?: string;
  actionCount?: number;
  streakCount?: number;
  // Engagement
  cheersCount: number;
  hasCheered?: boolean;
  // Timing
  createdAt: string;
}

export interface HypeSquad {
  id: string;
  name: string;
  emoji: string;
  createdBy: string;
  members: HypeSquadMember[];
  inviteCode: string;
  createdAt: string;
}

export interface HypeSquadMember {
  id: string;
  name: string;
  avatarEmoji: string;
  joinedAt: string;
  // Stats visible to squad
  totalActions: number;
  currentStreak: number;
  recentWin?: string;
}

export interface HypeSquadActivity {
  id: string;
  squadId: string;
  memberId: string;
  memberName: string;
  activityType: 'action_completed' | 'milestone_reached' | 'streak_extended' | 'joined' | 'cheer_sent';
  description: string;
  createdAt: string;
}

export interface VirtualCheer {
  id: string;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  message: string;
  emoji: string;
  createdAt: string;
}

// Archive types
export interface ArchiveEntry {
  id: string;
  type: 'permission_slip' | 'micro_action' | 'proof' | 'milestone';
  title: string;
  description?: string;
  category: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ArchiveFilter {
  type?: ArchiveEntry['type'];
  category?: string;
  startDate?: string;
  endDate?: string;
}

// Mock data generators for demo purposes
export const MOCK_HYPE_FEED: HypeFeedItem[] = [
  {
    id: '1',
    avatarEmoji: '🦋',
    dreamCategory: 'Travel',
    winType: 'action',
    winTitle: 'Booked my first solo flight!',
    cheersCount: 47,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    avatarEmoji: '🌸',
    dreamCategory: 'Career',
    winType: 'milestone',
    winTitle: 'Reached 10 bold actions!',
    winDescription: 'Building momentum 🔥',
    actionCount: 10,
    cheersCount: 89,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    avatarEmoji: '🌺',
    dreamCategory: 'Creativity',
    winType: 'proof',
    winTitle: 'Finished my first painting',
    cheersCount: 124,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    avatarEmoji: '✨',
    dreamCategory: 'Personal Freedom',
    winType: 'streak',
    winTitle: '7-day action streak!',
    streakCount: 7,
    cheersCount: 203,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    avatarEmoji: '🌙',
    dreamCategory: 'Health',
    winType: 'action',
    winTitle: 'Signed up for yoga class',
    cheersCount: 31,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    avatarEmoji: '🔮',
    dreamCategory: 'Learning',
    winType: 'action',
    winTitle: 'Started my language course',
    cheersCount: 56,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Cheer emojis available
export const CHEER_EMOJIS = ['🎉', '💪', '✨', '🙌', '💫', '🌟', '❤️', '🔥'];

// Anonymization emojis for feed avatars
export const AVATAR_EMOJIS = ['🦋', '🌸', '🌺', '✨', '🌙', '🔮', '🌈', '🍀', '🌻', '💎', '🎀', '🌊'];
