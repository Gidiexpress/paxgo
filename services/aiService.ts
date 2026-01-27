import { generateText } from '@fastshot/ai';

// Gabby-style system prompt for supportive, personal reframes
const GABBY_SYSTEM_PROMPT = `You are Gabby, a warm, supportive, and empowering mindset coach for women who are feeling stuck. Your communication style is:

- Warm and personal, like a wise best friend
- Encouraging without being dismissive of real feelings
- Use phrases like "I hear you", "Let's turn this around", "Here's the truth"
- Always end with an actionable reframe or empowering perspective
- Keep responses concise (2-4 sentences max)
- Use occasional emojis sparingly for warmth (💪 ✨ 🌟)

When someone shares a fear or limiting belief, acknowledge it first, then gently reframe it into an empowering perspective. Never be preachy or condescending.`;

const PERMISSION_SLIP_PROMPT = `You are a supportive coach helping women overcome self-doubt. Given a fear or limiting belief, create a "Digital Permission Slip" - a formal-sounding but warm permission statement that grants the person permission to do what they're afraid of.

Format your response EXACTLY as JSON:
{
  "title": "Permission to [main theme]",
  "permission": "You are hereby granted full permission to [specific action/being]. [One empowering sentence about why this is valid].",
  "signedBy": "[A warm community phrase like 'Your Future Self' or 'The Women Who Came Before']"
}

Keep it elegant, warm, and empowering. The permission should directly address the fear mentioned.`;

const MICRO_ACTION_PROMPT = `You are a productivity coach specializing in breaking big dreams into tiny, achievable 5-minute tasks. Given a dream or goal, generate 3-5 specific micro-actions that:

- Can genuinely be completed in 5 minutes or less
- Are concrete and specific (not vague like "research")
- Build momentum and feel achievable
- Progress from easier to slightly more challenging

Format your response EXACTLY as JSON array:
[
  {
    "title": "Action title (short, action-oriented)",
    "description": "Brief description of exactly what to do",
    "duration": 5,
    "category": "research|planning|action|reflection|connection"
  }
]

Make actions feel exciting and doable, not overwhelming.`;

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
}

// Instant Reframe - Get supportive Gabby-style response
export async function getInstantReframe(fear: string): Promise<ReframeResponse> {
  try {
    const prompt = `${GABBY_SYSTEM_PROMPT}

User's fear or concern: "${fear}"

Respond as Gabby with a warm, supportive reframe:`;

    const response = await generateText({ prompt });

    return {
      success: true,
      message: response || "I hear you, and your feelings are valid. Let's work through this together. ✨",
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

// Permission Slip Generator
export async function generatePermissionSlip(fear: string): Promise<{
  success: boolean;
  data?: PermissionSlipData;
  error?: string;
}> {
  try {
    const prompt = `${PERMISSION_SLIP_PROMPT}

Fear or limiting belief: "${fear}"

Generate a permission slip JSON:`;

    const response = await generateText({ prompt });

    // Parse JSON from response
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]) as PermissionSlipData;
      return { success: true, data };
    }

    // Fallback if parsing fails
    return {
      success: true,
      data: {
        title: 'Permission to Be Bold',
        permission: `You are hereby granted full permission to pursue your dreams without apology. Your journey is valid, and you deserve to take up space.`,
        signedBy: 'Your Future Self',
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

// Micro-Action Engine
export async function generateMicroActions(dream: string, stuckPoint?: string): Promise<{
  success: boolean;
  actions?: MicroActionData[];
  error?: string;
}> {
  try {
    const context = stuckPoint ? ` (in the context of ${stuckPoint})` : '';
    const prompt = `${MICRO_ACTION_PROMPT}

Dream or goal${context}: "${dream}"

Generate micro-actions JSON array:`;

    const response = await generateText({ prompt });

    // Parse JSON array from response
    const jsonMatch = response?.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const actions = JSON.parse(jsonMatch[0]) as MicroActionData[];
      return { success: true, actions };
    }

    // Fallback actions
    return {
      success: true,
      actions: [
        {
          title: 'Write down your dream',
          description: 'Take 5 minutes to write exactly what you want to achieve',
          duration: 5,
          category: 'reflection',
        },
        {
          title: 'Find one inspiration',
          description: 'Search for one person who has done something similar',
          duration: 5,
          category: 'research',
        },
        {
          title: 'Identify first tiny step',
          description: 'What is the smallest possible action you could take today?',
          duration: 5,
          category: 'planning',
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

// Continue conversation with context
export async function continueConversation(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  newMessage: string
): Promise<ReframeResponse> {
  try {
    // Build conversation context
    const conversationContext = messages
      .slice(-6) // Keep last 6 messages for context
      .map((m) => `${m.role === 'user' ? 'User' : 'Gabby'}: ${m.content}`)
      .join('\n');

    const prompt = `${GABBY_SYSTEM_PROMPT}

Previous conversation:
${conversationContext}

User: ${newMessage}

Gabby:`;

    const response = await generateText({ prompt });

    return {
      success: true,
      message: response || "I'm here for you. Let's keep working through this together. ✨",
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
