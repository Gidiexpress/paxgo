// Stuck Points for Onboarding
export interface StuckPoint {
  id: string;
  title: string;
  emoji: string;
  description: string;
  color: string;
}

export const stuckPoints: StuckPoint[] = [
  {
    id: 'career',
    title: 'Career',
    emoji: '💼',
    description: 'Feeling stuck in your professional journey',
    color: '#E2725B',
  },
  {
    id: 'travel',
    title: 'Travel',
    emoji: '✈️',
    description: 'Dreams of exploring the world',
    color: '#2EC4B6',
  },
  {
    id: 'personal-freedom',
    title: 'Personal Freedom',
    emoji: '🦋',
    description: 'Breaking free from limitations',
    color: '#D4AF37',
  },
  {
    id: 'relationships',
    title: 'Relationships',
    emoji: '💕',
    description: 'Building meaningful connections',
    color: '#F0A898',
  },
  {
    id: 'health',
    title: 'Health & Wellness',
    emoji: '🌿',
    description: 'Prioritizing your wellbeing',
    color: '#5DD9CE',
  },
  {
    id: 'creativity',
    title: 'Creativity',
    emoji: '🎨',
    description: 'Expressing your authentic self',
    color: '#E8C868',
  },
  {
    id: 'finances',
    title: 'Finances',
    emoji: '💰',
    description: 'Building financial confidence',
    color: '#22A399',
  },
  {
    id: 'education',
    title: 'Learning & Growth',
    emoji: '📚',
    description: 'Expanding your knowledge',
    color: '#1A3A4A',
  },
];

export const dreamCategories = [
  { id: 'solo-travel', label: 'Solo Travel Adventure', icon: '🌍' },
  { id: 'career-change', label: 'Career Pivot', icon: '🚀' },
  { id: 'start-business', label: 'Start a Business', icon: '💡' },
  { id: 'learn-skill', label: 'Learn New Skill', icon: '🎯' },
  { id: 'move-abroad', label: 'Move Abroad', icon: '🏠' },
  { id: 'write-book', label: 'Write a Book', icon: '✍️' },
  { id: 'fitness-goal', label: 'Fitness Transformation', icon: '💪' },
  { id: 'custom', label: 'Something Else...', icon: '✨' },
];
