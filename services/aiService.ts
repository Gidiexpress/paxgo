import { generateText } from '@fastshot/ai';

// Input type detection for contextual responses
export type InputType = 'greeting' | 'question' | 'fear' | 'casual' | 'followup' | 'gratitude';

// Detect the type of user input to provide appropriate responses
function detectInputType(message: string, conversationLength: number): InputType {
  const lowerMessage = message.toLowerCase().trim();

  // Greeting patterns
  const greetingPatterns = [
    /^(hi|hey|hello|hola|howdy|yo|sup|hiya|heya|greetings)/i,
    /^good\s*(morning|afternoon|evening|night)/i,
    /^what'?s\s*up/i,
    /^how\s*(are|r)\s*(you|u|ya)/i,
  ];

  // Gratitude patterns
  const gratitudePatterns = [
    /^(thanks|thank\s*you|thx|ty|appreciate|grateful)/i,
    /that\s*(helps|helped|was\s*helpful)/i,
    /you'?re\s*(the\s*best|awesome|amazing|great)/i,
  ];

  // Question patterns (general questions, not fear-based)
  const questionPatterns = [
    /^(what|how|why|when|where|who|can\s*you|could\s*you|tell\s*me|explain)/i,
    /\?$/,
  ];

  // Fear/doubt patterns (words indicating struggle, fear, doubt)
  const fearPatterns = [
    /\b(afraid|scared|fear|worry|worried|anxious|anxiety|nervous)\b/i,
    /\b(can'?t|cannot|unable|impossible|never|won'?t)\b/i,
    /\b(too\s*(old|young|late|early|scared|nervous|stupid|dumb))\b/i,
    /\b(not\s*(good|smart|capable|ready|qualified|worthy)\s*enough)\b/i,
    /\b(stuck|trapped|lost|confused|overwhelmed|hopeless)\b/i,
    /\b(doubt|uncertain|unsure|hesitant)\b/i,
    /\b(failure|fail|failing|failed)\b/i,
    /\b(shouldn'?t|mustn'?t)\b/i,
    /\b(what\s*if\s*(i|it)\s*(fail|don'?t|can'?t|doesn'?t))/i,
    /\b(imposter|fraud|fake)\b/i,
  ];

  // Check gratitude first
  if (gratitudePatterns.some(pattern => pattern.test(lowerMessage))) {
    return 'gratitude';
  }

  // Check greetings (only if short and at conversation start)
  if (lowerMessage.length < 50 && greetingPatterns.some(pattern => pattern.test(lowerMessage))) {
    return 'greeting';
  }

  // Check for fear/doubt language
  if (fearPatterns.some(pattern => pattern.test(lowerMessage))) {
    return 'fear';
  }

  // Check if it's a general question
  if (questionPatterns.some(pattern => pattern.test(lowerMessage))) {
    return 'question';
  }

  // If in ongoing conversation, it's likely a followup
  if (conversationLength > 0) {
    return 'followup';
  }

  // Default to casual for short, non-fear messages
  return 'casual';
}

// Get response instructions based on input type
function getResponseInstructions(inputType: InputType, messageLength: number): string {
  const brevityNote = messageLength < 30
    ? '\n\nIMPORTANT: The user sent a brief message, so keep your response equally brief (1-2 sentences max). Match their energy.'
    : messageLength > 200
      ? '\n\nIMPORTANT: The user shared a lot, so take time to acknowledge the depth of what they shared (2-4 sentences).'
      : '';

  switch (inputType) {
    case 'greeting':
      return `The user is greeting you. Respond warmly and naturally like a friend would. Keep it brief (1-2 sentences). You might ask what's on their mind or what brought them here today. Do NOT launch into coaching mode or ask heavy questions yet.${brevityNote}`;

    case 'gratitude':
      return `The user is expressing gratitude. Acknowledge it warmly and briefly. You might express that you're glad to be helpful, or gently ask if there's anything else they'd like to explore.${brevityNote}`;

    case 'question':
      return `The user is asking a question. Answer it helpfully and accurately while maintaining your warm, supportive persona. If it relates to personal growth, you can gently weave in an empowering perspective, but focus primarily on answering their actual question. Do NOT treat this as a fear to reframe unless it clearly is one.${brevityNote}`;

    case 'fear':
      return `The user is expressing a fear, doubt, or limiting belief. This is where your cognitive reframing skills shine. Acknowledge their feeling first, then offer a sophisticated reframe. If appropriate, you can suggest turning this into a bold move.${brevityNote}`;

    case 'followup':
      return `This is a continuation of the conversation. Stay contextual to what was discussed. If they're building on a previous topic, continue naturally. If they're shifting topics, follow their lead gracefully.${brevityNote}`;

    case 'casual':
    default:
      return `The user is making a casual remark or sharing something. Respond naturally and warmly. Look for opportunities to understand them better or gently guide toward what matters to them, but don't force a coaching moment if it's not appropriate.${brevityNote}`;
  }
}

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

// Sophisticated Gabby persona - Premium mindset coach AND versatile assistant
const GABBY_SYSTEM_PROMPT = `You are Gabby, a versatile AI assistant and mindset coach in The Bold Move app. You combine the warmth of a trusted friend with the insight of a skilled coach.

YOUR CORE IDENTITY:
- You're a helpful, knowledgeable assistant who can answer questions on any topic
- You're also a mindset coach who helps users overcome fears and take "Bold Moves" toward their dreams
- You adapt your tone and depth to match the user's energy and needs

VOICE & TONE:
- Sophisticated yet approachable—like a wise, well-traveled friend
- Warm and genuine—never robotic or overly formal
- Adaptable—brief when they're brief, more detailed when they share more
- Subtly empowering—you see their potential even when they doubt themselves

RESPONSE FLEXIBILITY:
- For greetings: Be warm and natural, like greeting a friend. Keep it light.
- For questions: Answer helpfully and accurately. You can weave in encouragement naturally, but focus on being useful.
- For fears/doubts: This is where your coaching shines—validate first, then gently reframe.
- For casual chat: Be conversational and present. Not everything needs to be a coaching moment.
- For gratitude: Accept it gracefully and warmly.

SIGNATURE TOUCHES (use sparingly, not in every message):
- "I hear you..."
- "Here's what I'm noticing..."
- "What if we looked at it this way..."
- A single emoji when it adds warmth (✨ 🌟 💫)

CRITICAL RULES:
1. MATCH THEIR ENERGY: Short message? Short response. Detailed share? Thoughtful acknowledgment.
2. DON'T OVER-COACH: Not every message needs a reframe or life lesson. Sometimes "That sounds exciting!" is perfect.
3. BE GENUINELY HELPFUL: If they ask a question, answer it well before adding any coaching angle.
4. STAY PRESENT: Respond to what they actually said, not what you assume they meant.
5. ONE THING AT A TIME: Don't overwhelm with multiple insights or questions.
6. NO EXCESS EXCLAMATION MARKS: One per message maximum.
7. AVOID CLICHÉS: Be fresh and specific, not generic and hollow.

You are NOT:
- A therapist (don't diagnose or treat mental health conditions)
- Preachy or lecturing
- Assuming everything is a crisis or fear to address
- Ignoring what they actually said to push your coaching agenda`;

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

// Intelligent first message response - contextually aware
export async function getInstantReframe(userMessage: string, stuckPoint?: string): Promise<ReframeResponse> {
  try {
    const inputType = detectInputType(userMessage, 0);
    const responseInstructions = getResponseInstructions(inputType, userMessage.length);
    const stuckPointContext = inputType === 'fear' ? getStuckPointContext(stuckPoint) : '';

    const prompt = `${GABBY_SYSTEM_PROMPT}

CONTEXT: This is the user's FIRST message to you. They may be greeting you, asking a question, sharing a fear, or just chatting.
${stuckPointContext}

${responseInstructions}

User's message: "${userMessage}"

Respond as Gabby:`;

    const response = await generateText({ prompt });

    return {
      success: true,
      message: response || getContextualFallback(inputType),
    };
  } catch (error) {
    console.error('Response error:', error);
    return {
      success: false,
      message: '',
      error: 'Unable to generate response. Please try again.',
    };
  }
}

// Contextual fallback messages based on input type
function getContextualFallback(inputType: InputType): string {
  switch (inputType) {
    case 'greeting':
      return "Hey there! 👋 Great to connect with you. What's on your mind today?";
    case 'gratitude':
      return "You're so welcome! I'm here whenever you need me. ✨";
    case 'question':
      return "That's a great question! Let me think about that for you...";
    case 'fear':
      return "I hear you, and what you're feeling is real. Let's hold space for this together. ✨";
    case 'followup':
      return "I'm with you. Tell me more about what you're thinking.";
    case 'casual':
    default:
      return "I'm here and listening. What would you like to explore together?";
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

// Continue conversation with context, memory, and intelligent response
export async function continueConversation(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  newMessage: string,
  stuckPoint?: string
): Promise<ReframeResponse> {
  try {
    const inputType = detectInputType(newMessage, messages.length);
    const responseInstructions = getResponseInstructions(inputType, newMessage.length);
    const stuckPointContext = inputType === 'fear' ? getStuckPointContext(stuckPoint) : '';

    // Build conversation context with better formatting
    const conversationContext = messages
      .slice(-8) // Keep last 8 messages for better context
      .map((m) => `${m.role === 'user' ? 'User' : 'Gabby'}: ${m.content}`)
      .join('\n\n');

    // Analyze conversation for context
    const conversationSummary = analyzeConversationContext(messages);

    const prompt = `${GABBY_SYSTEM_PROMPT}

CONVERSATION CONTEXT:
${conversationSummary}
${stuckPointContext}

PREVIOUS MESSAGES:
${conversationContext}

CURRENT MESSAGE ANALYSIS:
${responseInstructions}

User: ${newMessage}

Gabby (respond naturally, staying contextual to the conversation flow):`;

    const response = await generateText({ prompt });

    return {
      success: true,
      message: response || getContextualFallback(inputType),
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

// Analyze conversation to extract context for better responses
function analyzeConversationContext(messages: Array<{ role: 'user' | 'assistant'; content: string }>): string {
  if (messages.length === 0) return 'This is a new conversation.';

  const userMessages = messages.filter(m => m.role === 'user');
  const messageCount = messages.length;

  // Check if user has shared any fears/concerns
  const hasFearContent = userMessages.some(m =>
    /\b(afraid|scared|fear|worry|can't|stuck|doubt|nervous|anxious)\b/i.test(m.content)
  );

  // Check conversation depth
  const isDeepConversation = messageCount > 4;

  let context = `Conversation depth: ${messageCount} messages exchanged.`;

  if (hasFearContent) {
    context += ' User has shared personal concerns or fears - be sensitive to this context.';
  }

  if (isDeepConversation) {
    context += ' This is an ongoing conversation - maintain continuity and remember what was discussed.';
  }

  return context;
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

// Context-Aware Micro-Actions from Conversation
// Generates personalized actions based on what the user has shared in chat
export async function generateMicroActionsFromConversation(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  stuckPoint?: string,
  completedActionsCount: number = 0
): Promise<{
  success: boolean;
  actions?: MicroActionData[];
  extractedContext?: string;
  error?: string;
}> {
  try {
    // First, extract the key themes and concerns from conversation
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
    const conversationText = userMessages.join('\n');

    // Build a rich understanding of what the user has shared
    const contextPrompt = `Analyze this conversation to understand what the user is working through:

${conversationText}

Extract in JSON format:
{
  "mainConcern": "The primary fear, goal, or struggle they expressed",
  "emotionalState": "How they seem to be feeling (anxious, hopeful, stuck, curious, etc.)",
  "readinessLevel": "low|medium|high - How ready do they seem to take action?",
  "themes": ["theme1", "theme2"] // Key themes from their messages
}`;

    const contextResponse = await generateText({ prompt: contextPrompt });

    let extractedContext = '';
    let mainConcern = '';
    let readinessLevel = 'medium';
    let emotionalState = 'curious';

    try {
      const contextMatch = contextResponse?.match(/\{[\s\S]*\}/);
      if (contextMatch) {
        const contextData = JSON.parse(contextMatch[0]);
        mainConcern = contextData.mainConcern || '';
        readinessLevel = contextData.readinessLevel || 'medium';
        emotionalState = contextData.emotionalState || 'curious';
        extractedContext = mainConcern;
      }
    } catch {
      // Use the last user message as fallback
      mainConcern = userMessages[userMessages.length - 1] || 'personal growth';
      extractedContext = mainConcern;
    }

    // Adjust the action generation based on emotional state and readiness
    let readinessInstruction = '';
    if (readinessLevel === 'low' || emotionalState === 'anxious' || emotionalState === 'overwhelmed') {
      readinessInstruction = `
IMPORTANT: The user seems ${emotionalState} and may not be ready for big steps.
Generate ONLY gentle, nurturing actions. Focus on:
- Self-compassion exercises
- Tiny research or reflection tasks
- Actions that feel like self-care, not challenges
- Maximum difficulty level of 1`;
    } else if (readinessLevel === 'high' || emotionalState === 'excited' || emotionalState === 'determined') {
      readinessInstruction = `
IMPORTANT: The user seems ${emotionalState} and ready to take action!
Generate actions that channel this energy:
- Include one bold, exciting action
- Mix practical steps with inspiring ones
- Include a connection or outward action
- Range difficulty from 1 to 3`;
    } else {
      readinessInstruction = `
The user seems ${emotionalState}. Generate a balanced mix of gentle and slightly challenging actions.
Start gentle, build to moderate boldness. Difficulty levels 1-2.`;
    }

    const contextAwarePrompt = getContextAwareMicroActionPrompt(completedActionsCount);
    const stuckPointContext = stuckPoint
      ? `\nUser's general focus area: ${stuckPoint}`
      : '';

    const prompt = `${contextAwarePrompt}

CONVERSATION CONTEXT:
What the user has shared: "${mainConcern}"
Their apparent emotional state: ${emotionalState}
${stuckPointContext}
${readinessInstruction}

Based on what THIS SPECIFIC USER has shared in conversation, generate personalized micro-actions that feel directly relevant to THEIR situation, not generic goals.

Generate micro-actions JSON array that feel luxurious, intentional, and specifically tailored:`;

    const response = await generateText({ prompt });

    // Parse JSON array from response
    const jsonMatch = response?.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const actions = JSON.parse(jsonMatch[0]) as MicroActionData[];
      return {
        success: true,
        actions: actions.map((a, i) => ({
          ...a,
          difficultyLevel: a.difficultyLevel || Math.min(i + 1, 3)
        })),
        extractedContext,
      };
    }

    // Contextual fallback based on what we extracted
    return {
      success: true,
      actions: [
        {
          title: 'Acknowledge where you are right now',
          description: `Take a moment to write down one thing you appreciate about yourself in this moment, even amid ${emotionalState === 'anxious' ? 'uncertainty' : 'change'}.`,
          duration: 5,
          category: 'reflection',
          difficultyLevel: 1,
        },
        {
          title: 'Find one spark of clarity',
          description: `Based on what's on your mind, search for one image, quote, or story that resonates with where you want to go.`,
          duration: 5,
          category: 'research',
          difficultyLevel: 1,
        },
        {
          title: 'Take one tiny step forward',
          description: `Choose the smallest possible action related to what you shared. Something you could do in the next 5 minutes that moves the needle just a tiny bit.`,
          duration: 5,
          category: 'action',
          difficultyLevel: 2,
        },
      ],
      extractedContext,
    };
  } catch (error) {
    console.error('Contextual micro-action error:', error);
    return {
      success: false,
      error: 'Unable to generate contextual micro-actions. Please try again.',
    };
  }
}

// Interface for action suggestions in chat
export interface ChatActionSuggestion {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
}

// Generate inline action suggestion for chat (single action based on last message)
export async function generateInlineChatAction(
  userMessage: string,
  stuckPoint?: string
): Promise<{
  success: boolean;
  action?: ChatActionSuggestion;
  error?: string;
}> {
  try {
    const prompt = `${MICRO_ACTION_PROMPT}

The user just shared: "${userMessage}"
${stuckPoint ? `Their focus area: ${stuckPoint}` : ''}

Generate ONE micro-action (in JSON) that directly addresses what they just shared.
This action should feel like an immediate, empowering response to their message.
Keep it achievable in 5 minutes and make it feel like a gift, not a task.

Respond with a single JSON object (not an array):
{
  "title": "Elegant action title",
  "description": "Specific, encouraging description",
  "duration": 5,
  "category": "research|planning|action|reflection|connection"
}`;

    const response = await generateText({ prompt });

    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const action = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        action: {
          id: `chat-action-${Date.now()}`,
          ...action,
        },
      };
    }

    // Fallback
    return {
      success: true,
      action: {
        id: `chat-action-${Date.now()}`,
        title: 'Take one bold breath',
        description: 'Close your eyes, take three deep breaths, and on each exhale, release one worry about what you just shared.',
        duration: 2,
        category: 'reflection',
      },
    };
  } catch (error) {
    console.error('Inline chat action error:', error);
    return {
      success: false,
      error: 'Unable to generate action suggestion.',
    };
  }
}

// ============================================
// DYNAMIC ACTION ROADMAP - Phase 3
// ============================================

// Roadmap action data structure
export interface RoadmapActionData {
  title: string;
  description: string;
  why_it_matters: string;
  duration_minutes: number;
  gabby_tip: string;
  category: 'research' | 'planning' | 'action' | 'reflection' | 'connection';
  order_index: number;
}

// Roadmap generation response
export interface RoadmapGenerationResponse {
  success: boolean;
  roadmap_title?: string;
  actions?: RoadmapActionData[];
  error?: string;
}

// Prompt for generating strategic roadmap actions
const ROADMAP_GENERATION_PROMPT = `You are Gabby, a luxury life architect who transforms big dreams into elegant, achievable paths. You create "Golden Path" roadmaps—strategic sequences of micro-actions that feel like stepping stones across a beautiful garden, not a mountain to climb.

YOUR TASK: Generate 3-5 strategic micro-actions that form a cohesive path from where the user is NOW to meaningful progress toward their dream.

ROADMAP PHILOSOPHY:
- Each action should build on the previous one, creating momentum
- Actions should alternate between internal work (reflection, planning) and external action
- The path should feel luxurious and intentional, never overwhelming
- Link EVERY action back to the user's deep motivation (their "why")

ACTION REQUIREMENTS:
For each action, provide:
1. "title": An elegant, evocative title (5-8 words max) that sounds like an invitation, not a task
2. "description": Clear, specific instructions (2-3 sentences) on exactly what to do
3. "why_it_matters": A personal snippet (1-2 sentences) that connects THIS specific action to their ROOT MOTIVATION. Start with phrases like "Because you want...", "This brings you closer to...", "For someone who values..."
4. "duration_minutes": Realistic time (5-15 minutes each)
5. "gabby_tip": Specific, graceful advice on HOW to execute this with elegance. Include a concrete technique, mindset shift, or environmental suggestion.
6. "category": One of [research, planning, action, reflection, connection]
7. "order_index": Sequential number starting from 0

NAMING STYLE (luxurious, not corporate):
✓ "Craft your vision board moment"
✗ "Create a vision board"
✓ "Discover one kindred spirit"
✗ "Find a mentor"
✓ "Map your first bold conversation"
✗ "Plan a meeting"

RESPOND AS JSON:
{
  "roadmap_title": "A poetic 4-6 word title for this entire roadmap journey",
  "actions": [
    {
      "title": "...",
      "description": "...",
      "why_it_matters": "...",
      "duration_minutes": 10,
      "gabby_tip": "...",
      "category": "reflection",
      "order_index": 0
    }
  ]
}`;

// Generate a complete roadmap of strategic micro-actions
export async function generateRoadmapActions(
  dream: string,
  rootMotivation?: string
): Promise<RoadmapGenerationResponse> {
  try {
    const motivationContext = rootMotivation
      ? `\n\nUSER'S ROOT MOTIVATION (from their Five Whys journey):\n"${rootMotivation}"\n\nThis is their DEEP WHY. Every "why_it_matters" must connect back to this core desire.`
      : '\n\nNo specific root motivation provided. Focus on universal themes of growth, freedom, and self-actualization.';

    const prompt = `${ROADMAP_GENERATION_PROMPT}
${motivationContext}

USER'S BIG DREAM:
"${dream}"

Generate a Golden Path roadmap with 3-5 strategic micro-actions. Respond ONLY with valid JSON:`;

    const response = await generateText({ prompt });

    // Parse JSON from response
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        roadmap_title: data.roadmap_title || 'Your Golden Path',
        actions: data.actions || [],
      };
    }

    // Elegant fallback roadmap
    return {
      success: true,
      roadmap_title: 'Your First Bold Steps',
      actions: [
        {
          title: 'Create your sacred dreaming space',
          description: 'Find a quiet corner, light a candle or dim the lights, and spend 5 minutes with your eyes closed, visualizing your dream as if it has already happened.',
          why_it_matters: rootMotivation
            ? `Because "${rootMotivation}" — this moment of stillness plants the seed of that desire.`
            : 'Because every bold journey begins with a moment of clarity and intention.',
          duration_minutes: 5,
          gabby_tip: 'Choose a spot that feels special to you. Even a corner of your couch can become sacred with the right intention. Hold something meaningful while you visualize.',
          category: 'reflection',
          order_index: 0,
        },
        {
          title: 'Capture one spark of inspiration',
          description: 'Search for one image, quote, or story that makes your dream feel more real and attainable. Save it somewhere you\'ll see it daily.',
          why_it_matters: rootMotivation
            ? `This connects you to others who have walked toward what you want: "${rootMotivation}".`
            : 'Surrounding yourself with proof of possibility rewires your belief in what\'s achievable.',
          duration_minutes: 10,
          gabby_tip: 'Don\'t overthink this. The first thing that makes your heart skip is usually the right choice. Set it as your phone wallpaper for constant gentle reminders.',
          category: 'research',
          order_index: 1,
        },
        {
          title: 'Draft your bold declaration',
          description: 'Write three sentences describing your dream in present tense, as if you are already living it. Begin each with "I am..." or "I have..."',
          why_it_matters: rootMotivation
            ? `Writing it down transforms "${rootMotivation}" from a wish into a commitment you\'ve made to yourself.`
            : 'Present-tense declarations activate your brain\'s pattern recognition to spot opportunities aligned with your vision.',
          duration_minutes: 10,
          gabby_tip: 'Write by hand if possible—there\'s magic in the physical act. Read it aloud once. Notice how it feels in your body.',
          category: 'planning',
          order_index: 2,
        },
      ],
    };
  } catch (error) {
    console.error('Roadmap generation error:', error);
    return {
      success: false,
      error: 'Unable to generate your roadmap. Please try again.',
    };
  }
}

// Refine/regenerate a single action that feels misaligned
export interface RefineActionResponse {
  success: boolean;
  action?: RoadmapActionData;
  error?: string;
}

export async function refineRoadmapAction(
  currentAction: RoadmapActionData,
  dream: string,
  rootMotivation?: string,
  userFeedback?: string
): Promise<RefineActionResponse> {
  try {
    const feedbackContext = userFeedback
      ? `\n\nUSER FEEDBACK on why the current action doesn't feel right:\n"${userFeedback}"`
      : '\n\nThe user feels this action is misaligned but didn\'t specify why. Offer a gentler, more approachable alternative.';

    const motivationContext = rootMotivation
      ? `\n\nUser's root motivation: "${rootMotivation}"`
      : '';

    const prompt = `You are Gabby, refining a single micro-action that didn't resonate with the user.

CURRENT ACTION THAT NEEDS REFINEMENT:
- Title: ${currentAction.title}
- Description: ${currentAction.description}
- Category: ${currentAction.category}
${feedbackContext}

USER'S DREAM: "${dream}"${motivationContext}

Generate ONE replacement action that:
1. Maintains the same order_index (${currentAction.order_index}) and approximate purpose in the sequence
2. Feels gentler, more aligned, or addresses the user's concern
3. Keeps the luxurious, invitation-style naming
4. Still connects to their root motivation

Respond ONLY with valid JSON for the single action:
{
  "title": "...",
  "description": "...",
  "why_it_matters": "...",
  "duration_minutes": 10,
  "gabby_tip": "...",
  "category": "${currentAction.category}",
  "order_index": ${currentAction.order_index}
}`;

    const response = await generateText({ prompt });

    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const action = JSON.parse(jsonMatch[0]) as RoadmapActionData;
      return {
        success: true,
        action,
      };
    }

    // Fallback: return a gentler version of the same category
    return {
      success: true,
      action: {
        title: 'Take one mindful moment',
        description: 'Pause wherever you are. Take three deep breaths and ask yourself: "What\'s the smallest step I could take right now that would feel good?"',
        why_it_matters: rootMotivation
          ? `Because at the heart of "${rootMotivation}" is permission to move at your own pace.`
          : 'Because progress isn\'t about speed—it\'s about direction. Any step forward counts.',
        duration_minutes: 5,
        gabby_tip: 'There\'s no wrong answer here. Trust what comes up. Sometimes the smallest step is simply deciding you\'re ready.',
        category: currentAction.category,
        order_index: currentAction.order_index,
      },
    };
  } catch (error) {
    console.error('Action refinement error:', error);
    return {
      success: false,
      error: 'Unable to refine this action. Please try again.',
    };
  }
}

// Generate a Gabby tip for an existing action (for when we need just the tip)
export async function generateGabbyTip(
  actionTitle: string,
  actionDescription: string,
  category: string
): Promise<{ success: boolean; tip?: string; error?: string }> {
  try {
    const prompt = `You are Gabby, a sophisticated mindset coach. Generate ONE specific, graceful tip for executing this action with elegance.

ACTION: ${actionTitle}
DESCRIPTION: ${actionDescription}
CATEGORY: ${category}

Your tip should:
- Be 1-2 sentences
- Include a concrete technique, mindset shift, or environmental suggestion
- Feel luxurious and supportive, not demanding
- Help the user execute with grace and intention

Respond with ONLY the tip text, no JSON or formatting:`;

    const response = await generateText({ prompt });

    return {
      success: true,
      tip: response || 'Take a deep breath before you begin. You\'ve got this.',
    };
  } catch (error) {
    console.error('Gabby tip generation error:', error);
    return {
      success: false,
      error: 'Unable to generate tip.',
    };
  }
}
