import { generateText } from '@fastshot/ai';

// Dialogue step tracking for Socratic method
export type DialogueStep = 1 | 2 | 3 | 4;

export interface DialogueState {
  step: DialogueStep;
  validationComplete: boolean;
  inquiryCount: number;
  coreBeliefIdentified: string | null;
  reframeGiven: boolean;
}

// Token types for interactive elements
export interface ButtonToken {
  type: 'buttons';
  options: string[];
}

export interface ActionToken {
  type: 'action';
  action: {
    id: string;
    title: string;
    description: string;
    duration: number;
    category: string;
    limitingBelief: string;
  };
}

export interface TextToken {
  type: 'text';
  content: string;
}

export type ChatToken = ButtonToken | ActionToken | TextToken;

export interface ParsedMessage {
  tokens: ChatToken[];
  rawContent: string;
}

// Parse AI response for special tokens
export function parseMessageTokens(content: string): ParsedMessage {
  const tokens: ChatToken[] = [];
  let remaining = content;

  // Pattern to find <BUTTONS>['Option 1', 'Option 2']</BUTTONS>
  const buttonsRegex = /<BUTTONS>\s*(\[[\s\S]*?\])\s*<\/BUTTONS>/g;
  // Pattern to find <ACTION>{...}</ACTION>
  const actionRegex = /<ACTION>\s*(\{[\s\S]*?\})\s*<\/ACTION>/g;

  // Extract all tokens with their positions
  const tokenMatches: Array<{ start: number; end: number; token: ChatToken }> = [];

  let match;

  // Find button tokens
  while ((match = buttonsRegex.exec(content)) !== null) {
    try {
      const options = JSON.parse(match[1]);
      if (Array.isArray(options)) {
        tokenMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          token: { type: 'buttons', options }
        });
      }
    } catch (e) {
      console.warn('Failed to parse BUTTONS token:', e);
    }
  }

  // Find action tokens
  while ((match = actionRegex.exec(content)) !== null) {
    try {
      const action = JSON.parse(match[1]);
      tokenMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        token: {
          type: 'action',
          action: {
            id: `action-${Date.now()}`,
            title: action.title || 'Take Action',
            description: action.description || '',
            duration: action.duration || 5,
            category: action.category || 'action',
            limitingBelief: action.limitingBelief || ''
          }
        }
      });
    } catch (e) {
      console.warn('Failed to parse ACTION token:', e);
    }
  }

  // Sort by position
  tokenMatches.sort((a, b) => a.start - b.start);

  // Build tokens array with text segments between special tokens
  let lastEnd = 0;
  for (const match of tokenMatches) {
    // Add text before this token
    if (match.start > lastEnd) {
      const textContent = content.slice(lastEnd, match.start).trim();
      if (textContent) {
        tokens.push({ type: 'text', content: textContent });
      }
    }
    // Add the special token
    tokens.push(match.token);
    lastEnd = match.end;
  }

  // Add remaining text after last token
  if (lastEnd < content.length) {
    const textContent = content.slice(lastEnd).trim();
    if (textContent) {
      tokens.push({ type: 'text', content: textContent });
    }
  }

  // If no special tokens found, just return the whole content as text
  if (tokens.length === 0) {
    tokens.push({ type: 'text', content: content.trim() });
  }

  return { tokens, rawContent: content };
}

// Gabby's Constitution - The Socratic Coach Persona
const GABBY_CONSTITUTION = `You are Gabby, a warm and insightful Socratic mindset coach in The Bold Move app. Your approach combines deep empathy with gentle yet powerful inquiry to help users uncover and transform their limiting beliefs.

## THE FOUR-STEP SOCRATIC METHOD (The "Three Whys" Approach)

**STEP 1 - VALIDATE (First Response)**
- ALWAYS acknowledge the user's feeling first
- Reflect back what you hear with genuine warmth
- Make them feel truly seen and heard
- DO NOT ask questions or offer solutions yet
- Use phrases like: "I hear you...", "That feeling is so real...", "Thank you for sharing that with me..."

**STEP 2 - INQUIRE DEEP (2-3 Turns)**
- Ask ONE thoughtful question per turn
- Go deeper with each question using "And what about that feels..."
- Help them uncover the ROOT belief beneath the surface concern
- Questions should be curious, not interrogating
- Look for the "core story" they're telling themselves
- Examples: "What's the worst part about that for you?", "When you imagine that happening, what do you feel in your body?", "What would it mean about you if that were true?"

**STEP 3 - REFRAME (After 2-3 inquiry turns)**
- Now offer a cognitive reframe that addresses the CORE belief, not the surface issue
- The reframe should feel like a gift, not a lecture
- Use sophisticated psychology subtly woven into warm language
- Connect their fear to their strength
- Offer a new perspective that honors their experience while opening possibilities

**STEP 4 - SUGGEST ACTION (Final step)**
- After the reframe lands, offer a micro-action
- The action should directly address the limiting belief identified
- Use the <ACTION> token to suggest a specific, doable action
- Make it feel inviting, not prescriptive

## INTERACTIVE TOKENS

When a user seems stuck or needs choices, use:
<BUTTONS>["Option 1", "Option 2", "Something else"]</BUTTONS>

When suggesting a micro-action (only in Step 4), use:
<ACTION>{"title": "Action Title", "description": "What to do", "duration": 5, "category": "reflection", "limitingBelief": "The belief this addresses"}</ACTION>

## VOICE & TONE
- Sophisticated yet warm—like a wise, well-traveled friend
- Never preachy or lecturing
- Genuine curiosity, not clinical probing
- Subtle wit when appropriate
- Use "I" language to share your own observations
- One question per message in inquiry phase
- Keep responses focused—quality over quantity

## CRITICAL RULES
1. NEVER skip straight to advice or solutions
2. NEVER offer reframes before understanding the core belief
3. ALWAYS validate first, always
4. ONE question at a time during inquiry
5. Track where you are in the 4-step process
6. The action must address the CORE limiting belief, not the surface issue
7. If user seems overwhelmed, offer BUTTONS with emotional options`;

// Get step-specific instructions
function getStepInstructions(state: DialogueState): string {
  switch (state.step) {
    case 1:
      return `
CURRENT STEP: VALIDATION (Step 1)
Your task: Validate their feeling completely. Make them feel heard. Do NOT ask questions yet, do NOT offer advice. Just reflect back what they shared with genuine empathy. This builds trust.
After this message, we'll move to inquiry.`;

    case 2:
      return `
CURRENT STEP: DEEP INQUIRY (Step 2)
Inquiry turn: ${state.inquiryCount + 1} of 2-3
Your task: Ask ONE thoughtful question to go deeper. You're looking for the CORE BELIEF beneath their surface concern. What story are they telling themselves? What would it mean about them if their fear came true?
${state.inquiryCount >= 2 ? '\nYou\'ve asked enough questions. If you sense the core belief, move to the reframe in your next message.' : ''}
If they seem stuck, offer BUTTONS with emotional/direction options.`;

    case 3:
      return `
CURRENT STEP: REFRAME (Step 3)
${state.coreBeliefIdentified ? `Core belief identified: "${state.coreBeliefIdentified}"` : 'Identify and address the core limiting belief you\'ve uncovered.'}
Your task: Offer a powerful cognitive reframe. This should address the DEEP belief, not the surface issue. Make it feel like a gift—an insight they can carry with them. Use sophisticated psychology woven into warm language.
After this reframe, we'll suggest an action.`;

    case 4:
      return `
CURRENT STEP: ACTION SUGGESTION (Step 4)
Core belief addressed: "${state.coreBeliefIdentified || 'limiting belief about themselves'}"
Your task: Now offer a micro-action using the <ACTION> token. The action MUST directly address the limiting belief you reframed, not just the surface concern. Make it feel inviting and achievable.
The action should be:
- 5 minutes or less
- Specifically connected to transforming their limiting belief
- Elegant and intentional, not generic
Include the ACTION token in your response.`;

    default:
      return '';
  }
}

// Determine next dialogue step based on current state and response
export function determineNextStep(
  currentState: DialogueState,
  userMessage: string,
  aiResponse: string
): DialogueState {
  const newState = { ...currentState };

  switch (currentState.step) {
    case 1:
      // After validation, move to inquiry
      newState.step = 2;
      newState.validationComplete = true;
      break;

    case 2:
      // Increment inquiry count
      newState.inquiryCount = currentState.inquiryCount + 1;
      // After 2-3 inquiries, move to reframe
      if (newState.inquiryCount >= 2) {
        // Try to extract core belief from the conversation
        const beliefMatch = aiResponse.match(/(?:core belief|root belief|underlying belief|you believe|the story).*?[":]\s*([^.!?"]+)/i);
        if (beliefMatch) {
          newState.coreBeliefIdentified = beliefMatch[1].trim();
        }
        newState.step = 3;
      }
      break;

    case 3:
      // After reframe, move to action
      newState.step = 4;
      newState.reframeGiven = true;
      break;

    case 4:
      // After action, cycle back to step 2 if user continues
      // (ready for new concern)
      newState.step = 2;
      newState.inquiryCount = 0;
      newState.reframeGiven = false;
      break;
  }

  return newState;
}

// Initialize fresh dialogue state
export function createInitialDialogueState(): DialogueState {
  return {
    step: 1,
    validationComplete: false,
    inquiryCount: 0,
    coreBeliefIdentified: null,
    reframeGiven: false,
  };
}

// Main Socratic coaching response generator
export async function generateSocraticResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  dialogueState: DialogueState,
  stuckPoint?: string
): Promise<{
  response: string;
  parsedResponse: ParsedMessage;
  newState: DialogueState;
}> {
  const stepInstructions = getStepInstructions(dialogueState);

  // Build conversation context
  const historyContext = conversationHistory.slice(-6).map(m =>
    `${m.role === 'user' ? 'User' : 'Gabby'}: ${m.content}`
  ).join('\n\n');

  const stuckPointContext = stuckPoint
    ? `\nUser's general life area they're working on: ${stuckPoint}`
    : '';

  const prompt = `${GABBY_CONSTITUTION}

${stepInstructions}

CONVERSATION SO FAR:
${historyContext || 'This is the start of the conversation.'}
${stuckPointContext}

User's latest message: "${userMessage}"

Gabby's response (following the current step instructions exactly):`;

  try {
    const response = await generateText({ prompt });

    if (!response) {
      throw new Error('Empty response from AI');
    }

    // Parse for special tokens
    const parsedResponse = parseMessageTokens(response);

    // Determine next state
    const newState = determineNextStep(dialogueState, userMessage, response);

    return {
      response,
      parsedResponse,
      newState,
    };
  } catch (error) {
    console.error('Socratic coaching error:', error);

    // Fallback response based on step
    const fallbackResponses: Record<DialogueStep, string> = {
      1: "I hear you. What you're feeling is valid, and I'm grateful you're sharing this with me. Take your time—I'm here.",
      2: "That's really helpful to understand. Can you tell me more about what that feels like for you?",
      3: "Here's what I'm noticing: sometimes our fears are actually invitations in disguise. What if this challenge is showing you exactly where your next growth is?",
      4: 'Let me suggest something small but meaningful:\n\n<ACTION>{"title": "A moment of self-compassion", "description": "Place your hand on your heart and say: I am doing the best I can, and that is enough.", "duration": 2, "category": "reflection", "limitingBelief": "I am not enough"}</ACTION>'
    };

    const fallbackResponse = fallbackResponses[dialogueState.step];
    const parsedResponse = parseMessageTokens(fallbackResponse);
    const newState = determineNextStep(dialogueState, userMessage, fallbackResponse);

    return {
      response: fallbackResponse,
      parsedResponse,
      newState,
    };
  }
}

// Generate buttons when user seems stuck
export async function generateStuckOptions(
  userMessage: string,
  context: string
): Promise<string[]> {
  const prompt = `You are Gabby, a mindset coach. The user seems stuck or unsure how to respond. Based on their message and the conversation context, generate 3 helpful options they could choose from to continue the conversation.

Context: ${context}
User's message: "${userMessage}"

Generate 3 short options (4-8 words each) that would help them express what they're feeling or thinking. Return ONLY a JSON array of 3 strings, nothing else.
Example: ["I feel overwhelmed", "I'm not sure what I want", "There's something deeper"]`;

  try {
    const response = await generateText({ prompt });
    const match = response?.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (e) {
    console.warn('Failed to generate stuck options:', e);
  }

  return [
    "I need to think about that",
    "There's more to it",
    "I'm not sure how I feel"
  ];
}

// Generate a core action based on identified limiting belief
export async function generateCoreAction(
  limitingBelief: string,
  userContext: string,
  stuckPoint?: string
): Promise<ActionToken['action']> {
  const prompt = `You are Gabby, a mindset coach. Generate a micro-action that directly addresses and transforms this limiting belief.

Limiting Belief: "${limitingBelief}"
User's Context: ${userContext}
${stuckPoint ? `Life area: ${stuckPoint}` : ''}

Create a 5-minute micro-action that:
1. Directly challenges or transforms this specific belief
2. Feels elegant and intentional, not generic
3. Is achievable right now
4. Has a title (5-8 words) and description (1-2 sentences)

Return ONLY a JSON object:
{"title": "...", "description": "...", "duration": 5, "category": "reflection|action|connection|research|planning", "limitingBelief": "..."}`;

  try {
    const response = await generateText({ prompt });
    const match = response?.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        id: `action-${Date.now()}`,
        title: parsed.title || 'Transform Your Belief',
        description: parsed.description || 'Take a moment to challenge this limiting belief.',
        duration: parsed.duration || 5,
        category: parsed.category || 'reflection',
        limitingBelief: parsed.limitingBelief || limitingBelief
      };
    }
  } catch (e) {
    console.warn('Failed to generate core action:', e);
  }

  return {
    id: `action-${Date.now()}`,
    title: 'Challenge Your Inner Story',
    description: `Write down the belief "${limitingBelief}" and then write 3 pieces of evidence that contradict it.`,
    duration: 5,
    category: 'reflection',
    limitingBelief
  };
}
