// Boldness Boost Types for The Bold Move

export interface BoostProduct {
  id: string;
  type: BoostType;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  imageUrl?: string;
  basePrice: number;
  premiumPrice: number; // 25% off for Bold Adventurer subscribers
  category: BoostCategory;
  estimatedReadTime?: string;
  tags: string[];
  isPurchased?: boolean;
}

export type BoostType = 'dream_map' | 'itinerary' | 'roadmap' | 'guide';

export type BoostCategory =
  | 'travel'
  | 'career'
  | 'finance'
  | 'wellness'
  | 'creative'
  | 'relationships';

export interface PurchasedBoost {
  id: string;
  boostId: string;
  purchasedAt: string;
  content: BoostContent;
  isRead: boolean;
  lastReadAt?: string;
}

export interface BoostContent {
  title: string;
  introduction: string;
  sections: BoostSection[];
  conclusion: string;
  quickTips?: string[];
  actionItems?: BoostActionItem[];
}

export interface BoostSection {
  id: string;
  title: string;
  content: string;
  icon?: string;
  subsections?: {
    title: string;
    content: string;
  }[];
}

export interface BoostActionItem {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
}

// Catalog of available boosts
export const BOOST_CATALOG: BoostProduct[] = [
  // Travel Itineraries
  {
    id: 'japan-14-day',
    type: 'itinerary',
    title: '14-Day Japan Solo Adventure',
    subtitle: 'Tokyo to Kyoto & Beyond',
    description: 'A comprehensive solo travel guide covering Tokyo, Kyoto, Osaka, and hidden gems. Includes day-by-day activities, budget tips, and local experiences.',
    icon: '🇯🇵',
    basePrice: 9.99,
    premiumPrice: 7.49,
    category: 'travel',
    estimatedReadTime: '45 min',
    tags: ['solo travel', 'asia', 'culture', 'adventure'],
  },
  {
    id: 'europe-backpack',
    type: 'itinerary',
    title: '30-Day European Backpacking',
    subtitle: 'Classic Route Reimagined',
    description: 'From Paris to Rome, discover the essential European experience with modern twists, hidden spots, and budget-friendly tips.',
    icon: '🗼',
    basePrice: 12.99,
    premiumPrice: 9.74,
    category: 'travel',
    estimatedReadTime: '60 min',
    tags: ['backpacking', 'europe', 'budget', 'adventure'],
  },
  {
    id: 'bali-wellness',
    type: 'itinerary',
    title: '10-Day Bali Wellness Retreat',
    subtitle: 'Mind, Body & Soul',
    description: 'Design your own wellness journey through Ubud, Canggu, and the Gili Islands with yoga, meditation, and healing experiences.',
    icon: '🌴',
    basePrice: 8.99,
    premiumPrice: 6.74,
    category: 'wellness',
    estimatedReadTime: '35 min',
    tags: ['wellness', 'yoga', 'retreat', 'asia'],
  },
  // Career Roadmaps
  {
    id: 'career-pivot',
    type: 'roadmap',
    title: 'Career Transition Blueprint',
    subtitle: '90-Day Pivot Plan',
    description: 'A strategic guide to changing careers, including skill mapping, networking strategies, and interview preparation tailored to your goals.',
    icon: '🎯',
    basePrice: 14.99,
    premiumPrice: 11.24,
    category: 'career',
    estimatedReadTime: '50 min',
    tags: ['career change', 'professional growth', 'networking'],
  },
  {
    id: 'leadership-rise',
    type: 'roadmap',
    title: 'Leadership Ascension Path',
    subtitle: 'From IC to Manager',
    description: 'Navigate the transition from individual contributor to people leader with frameworks, communication templates, and real scenarios.',
    icon: '👔',
    basePrice: 12.99,
    premiumPrice: 9.74,
    category: 'career',
    estimatedReadTime: '45 min',
    tags: ['leadership', 'management', 'career growth'],
  },
  // Dream Maps
  {
    id: 'freedom-finance',
    type: 'dream_map',
    title: 'Financial Freedom Map',
    subtitle: '5-Year Wealth Builder',
    description: 'Visualize your path to financial independence with actionable milestones, investment strategies, and mindset shifts.',
    icon: '💎',
    basePrice: 11.99,
    premiumPrice: 8.99,
    category: 'finance',
    estimatedReadTime: '40 min',
    tags: ['investing', 'savings', 'wealth building'],
  },
  {
    id: 'creative-empire',
    type: 'dream_map',
    title: 'Creative Empire Blueprint',
    subtitle: 'Monetize Your Passion',
    description: 'Transform your creative skills into sustainable income streams with branding, pricing, and client acquisition strategies.',
    icon: '✨',
    basePrice: 13.99,
    premiumPrice: 10.49,
    category: 'creative',
    estimatedReadTime: '55 min',
    tags: ['creative business', 'freelance', 'monetization'],
  },
  // Guides
  {
    id: 'habit-master',
    type: 'guide',
    title: 'Habit Mastery System',
    subtitle: '21-Day Transformation',
    description: 'Science-backed techniques to build lasting habits, break destructive patterns, and create your ideal daily routine.',
    icon: '🔥',
    basePrice: 7.99,
    premiumPrice: 5.99,
    category: 'wellness',
    estimatedReadTime: '30 min',
    tags: ['habits', 'productivity', 'self-improvement'],
  },
];

export const getBoostTypeLabel = (type: BoostType): string => {
  switch (type) {
    case 'dream_map':
      return 'Dream Map';
    case 'itinerary':
      return 'Itinerary';
    case 'roadmap':
      return 'Roadmap';
    case 'guide':
      return 'Guide';
    default:
      return 'Boost';
  }
};

export const getBoostCategoryIcon = (category: BoostCategory): string => {
  switch (category) {
    case 'travel':
      return '✈️';
    case 'career':
      return '🚀';
    case 'finance':
      return '💰';
    case 'wellness':
      return '🧘';
    case 'creative':
      return '🎨';
    case 'relationships':
      return '💝';
    default:
      return '⭐';
  }
};
