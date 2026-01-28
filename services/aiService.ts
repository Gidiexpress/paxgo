import { generateText } from '@fastshot/ai';

// Cognitive reframing techniques tailored to each stuck point
const STUCK_POINT_TECHNIQUES: Record<string, string> = {
  career: `
COGNITIVE TECHNIQUES FOR CAREER:
- Reframe "I'm not qualified" → "Every expert started as a beginner. Your unique perspective IS your qualification."
- Use the "10-10-10 Rule": How will this fear matter in 10 minutes, 10 months, 10 years?
- Apply "Evidence Gathering": What accomplishments contradict this belief?
- Leverage "Identity Shift": You're not stuck—you're in transition. A chrysalis, not a cage.`,

  travel: `
COGNITIVE TECHNIQUES FOR TRAVEL:
- Reframe "I can't travel alone" → "Solo travel is self-discovery in motion. The world awaits your footsteps."
- Use "Possibility Thinking": What if this journey becomes your favorite story to tell?
- Apply "Small Steps Philosophy": One flight, one city, one conversation at a time.
- Challenge "All-or-Nothing": A weekend getaway counts. Start where you are.`,

  'personal-freedom': `
COGNITIVE TECHNIQUES FOR PERSONAL FREEDOM:
- Reframe "I have too many obligations" → "Every 'yes' to yourself is a vote for the life you want."
- Use "Permission Giving": You don't need anyone's approval to live authentically.
- Apply "Values Clarification": What would your 80-year-old self thank you for choosing?
- Challenge "Should" statements: Replace "should" with "could" and notice the freedom.`,

  relationships: `
COGNITIVE TECHNIQUES FOR RELATIONSHIPS:
- Reframe "I'll be rejected" → "Rejection is redirection toward those who'll truly see you."
- Use "Vulnerability Strength": Connection requires courage, and you have it.
- Apply "Growth Mindset": Every relationship teaches something valuable.
- Challenge "Mind Reading": You can't know what others think—focus on what you feel.`,

  health: `
COGNITIVE TECHNIQUES FOR HEALTH:
- Reframe "I've failed before" → "Each attempt teaches your body something new. This time builds on all of them."
- Use "Self-Compassion Talk": Would you speak to your best friend the way you speak to yourself?
- Apply "Progress Over Perfection": One healthy choice today matters more than a perfect month.
- Challenge "All-or-Nothing": A 10-minute walk is infinitely better than waiting for the "perfect" routine.`,

  creativity: `
COGNITIVE TECHNIQUES FOR CREATIVITY:
- Reframe "I'm not creative" → "Creativity isn't a gift—it's a practice. You're creative by nature."
- Use "Beginner's Mind": Create without judgment. The first draft is just for you.
- Apply "Play Over Productivity": Make art for the joy, not the outcome.
- Challenge "Comparison Trap": Your voice exists because no one else has it.`,

  finances: `
COGNITIVE TECHNIQUES FOR FINANCES:
- Reframe "I'm bad with money" → "Financial literacy is a skill, and skills can be learned."
- Use "Future Self Connection": What would Future You thank Present You for starting today?
- Apply "Small Wins": One positive money decision today creates tomorrow's momentum.
- Challenge "Scarcity Thinking": Focus on what you CAN control—your next choice.`,

  education: `
COGNITIVE TECHNIQUES FOR LEARNING:
- Reframe "I'm too old to learn" → "Your experience makes learning richer, not harder."
- Use "Curiosity Over Competence": You don't need to master—you need to explore.
- Apply "Growth Identity": "I'm someone who learns" is more powerful than any degree.
- Challenge "Expert Myth": Start as a student. Everyone you admire did too.`,
};

// Sophisticated Gabby persona - Premium mindset coach
const GABBY_SYSTEM_PROMPT = `You are Gabby, an elite mindset coach with the warmth of a trusted confidante and the precision of a cognitive behavioral therapist. Your communication style embodies:

VOICE & TONE:
- Sophisticated yet approachable—like a wise friend who happens to have a psychology degree
- Deeply empathetic without being patronizing—you honor their feelings while gently expanding their perspective
- Luxuriously unhurried—your responses feel like exhaling into a cashmere blanket
- Subtly affirming—you see their strength even when they can't

SIGNATURE PHRASES:
- "I hear the weight behind those words..."
- "Here's what I'm noticing..."
- "Let's reframe this together..."
- "The truth you might be ready to hear..."
- "What if we considered..."

COMMUNICATION RULES:
- ALWAYS acknowledge their emotion first—validation before transformation
- Use elegant, evocative language that feels premium and intentional
- Keep responses to 3-4 thoughtful sentences maximum
- End with either a gentle reframe OR an empowering observation—never both
- Use ONE emoji maximum, only when it adds warmth (✨ 🌟 💫 preferred)
- Never use exclamation marks in excess—one per message maximum

COGNITIVE REFRAMING APPROACH:
1. REFLECT: Mirror their emotion to show you truly heard them
2. REFRAME: Offer a sophisticated alternative perspective
3. REDIRECT: Point toward possibility without toxic positivity

You are NOT:
- A cheerleader who dismisses real challenges
- Preachy or lecturing
- Using clichés or hollow affirmations
- Overwhelming with too many insights at once`;

const getStuckPointContext = (stuckPoint?: string): string => {
  if (!stuckPoint) return '';
  const techniques = STUCK_POINT_TECHNIQUES[stuckPoint] || STUCK_POINT_TECHNIQUES['personal-freedom'];
  return `\n\nUSER'S AREA OF FOCUS: ${stuckPoint.toUpperCase()}\n${techniques}`;
};

const PERMISSION_SLIP_PROMPT = `You create "Digital Permission Slips"—elegant, formal-sounding documents that grant women permission to pursue what fear has withheld. These are collectible artifacts that feel like receiving a scroll of validation.

STYLE REQUIREMENTS:
- Language should feel like it belongs on fine stationery
- Use phrases like "hereby granted," "full and unconditional permission," "with the authority vested"
- The permission should directly transform the fear mentioned
- Include a subtle reference to their inherent worthiness

FORMAT (respond EXACTLY as JSON):
{
  "title": "Permission to [transformative theme in 3-4 elegant words]",
  "permission": "You are hereby granted full and unconditional permission to [specific action/being that addresses their fear]. [One evocative sentence about why this permission was always theirs to claim].",
  "signedBy": "[Choose one: 'Your Future Self', 'The Sisterhood of Bold Women', 'The Universe That Conspires for You', 'Every Woman Who Walked Before']"
}

TONE: Ceremonial yet intimate. Like receiving a secret decree from a benevolent queen.`;

const MICRO_ACTION_PROMPT = `You are a luxury productivity architect who transforms dreams into exquisite micro-moments of progress. Each action you create should feel like an invitation to elegance, not a chore.

CREATE 3-5 MICRO-ACTIONS THAT:
- Can genuinely be completed in 5 minutes or less
- Feel sophisticated and intentional, not basic or boring
- Progress from grounding to slightly bolder
- Use evocative, aspirational language
- Match the user's specific dream and stuck point

ACTION NAMING STYLE:
- "Curate your first inspiration folder" not "Research online"
- "Craft a 3-sentence dream declaration" not "Write goals"
- "Discover one pioneer in your field" not "Find role models"

FORMAT (respond EXACTLY as JSON array):
[
  {
    "title": "Elegant action title (5-8 words max)",
    "description": "Specific, sophisticated description of exactly what to do",
    "duration": 5,
    "category": "research|planning|action|reflection|connection",
    "difficultyLevel": 1
  }
]

CATEGORIES:
- research: Exploration and discovery actions
- planning: Strategic and organizational actions
- action: Tangible doing actions
- reflection: Journaling and self-inquiry actions
- connection: Reaching out to others

DIFFICULTY LEVELS: 1 (gentle start) to 3 (bold move)`;

// Context-aware micro-action prompt that considers user progress
const getContextAwareMicroActionPrompt = (completedCount: number): string => {
  if (completedCount === 0) {
    return `${MICRO_ACTION_PROMPT}

PROGRESSION NOTE: This user is just beginning. Start with the gentlest possible actions—things that feel like self-care, not challenges. Focus on reflection and low-stakes research.`;
  } else if (completedCount < 5) {
    return `${MICRO_ACTION_PROMPT}

PROGRESSION NOTE: User has completed ${completedCount} actions. They're building momentum. Include one slightly bolder action alongside gentle ones. Mix in one "connection" category action.`;
  } else if (completedCount < 15) {
    return `${MICRO_ACTION_PROMPT}

PROGRESSION NOTE: User has completed ${completedCount} actions. They're finding their stride. Actions can be more tangible and outward-facing. Include at least one action that involves external interaction.`;
  } else if (completedCount < 30) {
    return `${MICRO_ACTION_PROMPT}

PROGRESSION NOTE: User has completed ${completedCount} actions. They're becoming bold. Actions should stretch them slightly—real steps toward their dream, not just preparation. Include one action that feels exciting and slightly scary.`;
  } else {
    return `${MICRO_ACTION_PROMPT}

PROGRESSION NOTE: User has completed ${completedCount} actions—they're a true adventurer. Actions should be substantive steps that create real momentum. Include actions that might have felt impossible at the start.`;
  }
};

export interface ReframeResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface PermissionSlipData {
  title: string;
  permission: string;
  signedBy: string;
}

export interface MicroActionData {
  title: string;
  description: string;
  duration: number;
  category: string;
  difficultyLevel?: number;
}

// Instant Reframe - Sophisticated Gabby-style response with stuck point awareness
export async function getInstantReframe(fear: string, stuckPoint?: string): Promise<ReframeResponse> {
  try {
    const stuckPointContext = getStuckPointContext(stuckPoint);
    const prompt = `${GABBY_SYSTEM_PROMPT}${stuckPointContext}

User's fear or concern: "${fear}"

Respond as Gabby with a warm, sophisticated reframe that applies cognitive techniques relevant to their area of focus:`;

    const response = await generateText({ prompt });

    return {
      success: true,
      message: response || "I hear you, and what you're feeling is real. Let's hold space for this together, and then gently explore what might be waiting on the other side of this fear. ✨",
    };
  } catch (error) {
    console.error('Reframe error:', error);
    return {
      success: false,
      message: '',
      error: 'Unable to generate reframe. Please try again.',
    };
  }
}

// Permission Slip Generator - Premium artifact creation
export async function generatePermissionSlip(fear: string, stuckPoint?: string): Promise<{
  success: boolean;
  data?: PermissionSlipData;
  error?: string;
}> {
  try {
    const stuckPointContext = stuckPoint
      ? `\n\nUser's focus area: ${stuckPoint}. Tailor the permission to resonate with someone working through ${stuckPoint}-related fears.`
      : '';

    const prompt = `${PERMISSION_SLIP_PROMPT}${stuckPointContext}

Fear or limiting belief: "${fear}"

Generate a permission slip JSON:`;

    const response = await generateText({ prompt });

    // Parse JSON from response
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]) as PermissionSlipData;
      return { success: true, data };
    }

    // Elegant fallback if parsing fails
    return {
      success: true,
      data: {
        title: 'Permission to Claim Your Bold Path',
        permission: `You are hereby granted full and unconditional permission to pursue what calls to your heart without apology or hesitation. This permission was always yours—you are simply remembering what you've always known.`,
        signedBy: 'The Sisterhood of Bold Women',
      },
    };
  } catch (error) {
    console.error('Permission slip error:', error);
    return {
      success: false,
      error: 'Unable to generate permission slip. Please try again.',
    };
  }
}

// Context-Aware Micro-Action Engine
export async function generateMicroActions(
  dream: string,
  stuckPoint?: string,
  completedActionsCount: number = 0
): Promise<{
  success: boolean;
  actions?: MicroActionData[];
  error?: string;
}> {
  try {
    const contextAwarePrompt = getContextAwareMicroActionPrompt(completedActionsCount);
    const stuckPointContext = stuckPoint
      ? `\nUser is working through ${stuckPoint}-related challenges.`
      : '';

    const prompt = `${contextAwarePrompt}

Dream or goal: "${dream}"${stuckPointContext}

Generate micro-actions JSON array that feel luxurious and intentional:`;

    const response = await generateText({ prompt });

    // Parse JSON array from response
    const jsonMatch = response?.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const actions = JSON.parse(jsonMatch[0]) as MicroActionData[];
      // Ensure difficulty levels increase
      return {
        success: true,
        actions: actions.map((a, i) => ({
          ...a,
          difficultyLevel: a.difficultyLevel || Math.min(i + 1, 3)
        }))
      };
    }

    // Elegant fallback actions
    return {
      success: true,
      actions: [
        {
          title: 'Create your dream sanctuary moment',
          description: 'Find a quiet space, close your eyes, and visualize your dream as if it has already happened. Notice how it feels.',
          duration: 5,
          category: 'reflection',
          difficultyLevel: 1,
        },
        {
          title: 'Curate one spark of inspiration',
          description: 'Search for one image, quote, or story that makes your dream feel more real. Save it somewhere special.',
          duration: 5,
          category: 'research',
          difficultyLevel: 1,
        },
        {
          title: 'Craft your bold declaration',
          description: 'Write three sentences describing your dream in present tense, as if you are already living it.',
          duration: 5,
          category: 'planning',
          difficultyLevel: 2,
        },
      ],
    };
  } catch (error) {
    console.error('Micro-action error:', error);
    return {
      success: false,
      error: 'Unable to generate micro-actions. Please try again.',
    };
  }
}

// Continue conversation with context and stuck point awareness
export async function continueConversation(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  newMessage: string,
  stuckPoint?: string
): Promise<ReframeResponse> {
  try {
    const stuckPointContext = getStuckPointContext(stuckPoint);

    // Build conversation context
    const conversationContext = messages
      .slice(-6) // Keep last 6 messages for context
      .map((m) => `${m.role === 'user' ? 'User' : 'Gabby'}: ${m.content}`)
      .join('\n');

    const prompt = `${GABBY_SYSTEM_PROMPT}${stuckPointContext}

Previous conversation:
${conversationContext}

User: ${newMessage}

Gabby (respond with sophisticated empathy and relevant cognitive reframing):`;

    const response = await generateText({ prompt });

    return {
      success: true,
      message: response || "I'm holding space for you in this moment. Let's breathe through this together. ✨",
    };
  } catch (error) {
    console.error('Conversation error:', error);
    return {
      success: false,
      message: '',
      error: 'Unable to continue conversation. Please try again.',
    };
  }
}

// Generate a variety of permission slip template styles
export type PermissionSlipStyle = 'classic' | 'royal' | 'cosmic' | 'sisterhood' | 'future-self';

export const PERMISSION_SLIP_STYLES: Record<PermissionSlipStyle, {
  signedBy: string;
  borderStyle: string;
  sealEmoji: string;
}> = {
  'classic': {
    signedBy: 'The Bold Women Before You',
    borderStyle: 'elegant',
    sealEmoji: '📜',
  },
  'royal': {
    signedBy: 'Her Majesty, Your Highest Self',
    borderStyle: 'ornate',
    sealEmoji: '👑',
  },
  'cosmic': {
    signedBy: 'The Universe That Conspires for You',
    borderStyle: 'celestial',
    sealEmoji: '✨',
  },
  'sisterhood': {
    signedBy: 'The Sisterhood of Bold Women',
    borderStyle: 'woven',
    sealEmoji: '💫',
  },
  'future-self': {
    signedBy: 'Your Future Self, Looking Back with Pride',
    borderStyle: 'modern',
    sealEmoji: '🌟',
  },
};

// Get a permission slip style based on the achievement type
export function getPermissionSlipStyle(category?: string): PermissionSlipStyle {
  const styleMap: Record<string, PermissionSlipStyle> = {
    'career': 'royal',
    'travel': 'cosmic',
    'personal-freedom': 'future-self',
    'relationships': 'sisterhood',
    'health': 'classic',
    'creativity': 'cosmic',
    'finances': 'royal',
    'education': 'classic',
  };

  return styleMap[category || ''] || 'classic';
}
