import { generateTextGroq } from './groq';
import { supabase } from '@/lib/supabase';
import { FiveWhysSession, FiveWhysResponse } from '@/types/database';

// Type-safe wrapper for Supabase operations on tables not yet in generated types
const supabaseAny = supabase as any;

// Five Whys dialogue state
export interface FiveWhysState {
  sessionId: string | null;
  currentWhyNumber: number;
  responses: FiveWhysResponse[];
  isComplete: boolean;
  rootMotivation: string | null;
}

// AI Coach constitution for natural coaching exploration
const COACHING_CONSTITUTION = `You are a sophisticated, neutral AI mindset coach helping someone discover their deepest motivation. This is a profound conversation about what truly matters to them.

## YOUR APPROACH
- You're having a natural, flowing conversation that goes progressively deeper
- Each question builds on what they just shared, peeling back another layer
- You're not following a formula—you're genuinely curious and present
- Your tone is warm, curious, and celebratory of their insights

## DEPTH PROGRESSION (INTERNAL GUIDE - NEVER MENTION THIS)
The conversation naturally moves through layers:
- Layer 1: Surface motivation (practical reasons)
- Layer 2: Emotional benefits (how it would feel)
- Layer 3: Identity connection (who they would become)
- Layer 4: Core values (what matters most)
- Layer 5: Root motivation (deepest truth—often about love, freedom, meaning, or connection)

## RESPONSE STYLE
For each turn, provide:
1. A brief, warm reflection on what they shared (1-2 sentences)
2. A thoughtful follow-up question that goes deeper

## VOICE
- Sophisticated yet warm—like a wise friend over coffee
- Use "I" language: "I'm struck by...", "What I'm hearing is..."
- Celebrate their insights: "That's beautiful...", "There's something powerful in that..."
- Never mention techniques, frameworks, or how many questions you're asking
- Never clinical, structured, or preachy`;

// Generate a Five Whys question based on the current state
export async function generateFiveWhysQuestion(
  dream: string,
  currentWhyNumber: number,
  previousResponses: FiveWhysResponse[],
  userName?: string
): Promise<{
  question: string;
  gabbyReflection: string;
}> {
  const isFirstQuestion = currentWhyNumber === 1;

  // Build context from previous responses
  const conversationContext = previousResponses
    .map((r) => `Why ${r.why_number}:\nQuestion: ${r.question}\nUser's answer: ${r.user_response}${r.gabby_reflection ? `\nAI Coach's reflection: ${r.gabby_reflection}` : ''}`)
    .join('\n\n');

  const depthGuidance: Record<number, string> = {
    1: 'Ask about the practical, surface-level reason this dream matters. Keep it gentle and inviting.',
    2: 'Go deeper into the emotional benefits. How would achieving this dream FEEL?',
    3: 'Explore identity. Who would they BECOME? What version of themselves does this represent?',
    4: 'Uncover core values. What does this dream reveal about what matters most to them?',
    5: 'Find the root motivation. This is often about love, freedom, meaning, connection, or leaving a legacy. Make this question profound but accessible.',
  };

  const prompt = `${COACHING_CONSTITUTION}

${userName ? `Their name: ${userName}` : ''}
Their dream: "${dream}"
Conversation depth: ${currentWhyNumber} of 5 (INTERNAL ONLY - never mention this number)
${depthGuidance[currentWhyNumber]}

${conversationContext
      ? `CONVERSATION SO FAR:\n${conversationContext}\n\nBased on their last response, reflect warmly on what they shared, then ask your next question to go deeper.`
      : `This is your FIRST question. Briefly acknowledge their dream with warmth, then ask why this dream matters to them.`
    }

Respond with:
1. ${isFirstQuestion ? 'A warm acknowledgment (1-2 sentences) of their dream' : 'A brief, warm reflection on their answer (1-2 sentences)'}
2. Your next question to explore deeper

CRITICAL: Do NOT mention "Five Whys", "layers", "steps", or any framework. Do NOT say "Question X of 5". This should feel like a natural, flowing conversation.

Keep the total response under 80 words. Be warm, genuine, and concise.`;

  try {
    const response = await generateTextGroq({ prompt });

    if (!response) {
      throw new Error('Empty response from AI');
    }

    // Parse the response - separate reflection from question
    const lines = response.trim().split('\n').filter((l) => l.trim());
    let gabbyReflection = '';
    let question = '';

    // Find the question (usually ends with ?)
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('?')) {
        question = lines[i].replace(/^[\d\.\)\-\*]+\s*/, '').trim();
        gabbyReflection = lines.slice(0, i).join(' ').replace(/^[\d\.\)\-\*]+\s*/, '').trim();
        break;
      }
    }

    // Fallback if parsing fails
    if (!question) {
      question = response.trim();
    }

    return { question, gabbyReflection };
  } catch (error) {
    console.error('Five Whys question generation error:', error);

    // Fallback questions
    const fallbackQuestions: Record<number, string> = {
      1: `I love that you're pursuing "${dream}". Tell me - what draws you to this dream?`,
      2: "That's meaningful. When you imagine having achieved this, how do you think you'd feel?",
      3: "Beautiful. Who would you become? What version of yourself does this represent?",
      4: "I'm struck by that. What does this reveal about what matters most to you?",
      5: "At the deepest level, what is this really about for you?",
    };

    return {
      question: fallbackQuestions[currentWhyNumber] || "Tell me more about what this means to you.",
      gabbyReflection: currentWhyNumber > 1 ? "Thank you for sharing that." : "",
    };
  }
}

// Generate the root motivation summary after completing all 5 whys
export async function generateRootMotivation(
  dream: string,
  responses: FiveWhysResponse[]
): Promise<string> {
  const conversationSummary = responses
    .map((r) => `Why ${r.why_number}: "${r.user_response}"`)
    .join('\n');

  const prompt = `You are AI Coach, a mindset coach. Based on this deep conversation, identify and articulate their ROOT MOTIVATION in one powerful sentence.

Dream: "${dream}"

Their responses:
${conversationSummary}

Write their root motivation as a statement that captures the deepest truth beneath their dream. This should feel like a profound insight—something they can carry with them.

Format: A single, powerful sentence (15-25 words) that starts with something like:
- "At your core, you seek..."
- "Your deepest motivation is..."
- "What truly drives you is..."
- "Beneath it all, you're pursuing..."

Make it feel personal and meaningful, not generic.

CRITICAL: Do NOT mention "Five Whys" or reference the process.`;

  try {
    const response = await generateTextGroq({ prompt });
    return response?.trim() || "Your dream connects to something deep within you—a desire for growth, meaning, and becoming who you're meant to be.";
  } catch (error) {
    console.error('Root motivation generation error:', error);
    return "Your dream connects to something deep within you—a desire for growth, meaning, and becoming who you're meant to be.";
  }
}

// Generate a personalized permission statement based on the Five Whys session
export async function generatePermissionStatement(
  dream: string,
  rootMotivation: string,
  responses: FiveWhysResponse[],
  userName?: string
): Promise<string> {
  const keyInsights = responses
    .slice(-3)
    .map((r) => r.user_response)
    .join('; ');

  const prompt = `You are AI Coach, a mindset coach. Create a personalized "Permission Statement" for someone who has just discovered their deepest motivation.

${userName ? `Their name: ${userName}` : ''}
Their dream: "${dream}"
Their root motivation: "${rootMotivation}"
Key insights: "${keyInsights}"

Write a Permission Statement that:
1. Gives them permission to pursue their dream
2. Acknowledges their root motivation
3. Addresses any self-doubt they might feel
4. Feels like a gift—warm, empowering, and personal
5. Is written in second person ("You have permission to...")

Format:
- Start with "You have permission to..." or "I give myself permission to..."
- 2-3 powerful sentences
- End with something affirming about who they are

CRITICAL: Do NOT mention "Five Whys", "journey", or the coaching process.

Keep it elegant and meaningful—this will be displayed as a beautiful keepsake.`;

  try {
    const response = await generateTextGroq({ prompt });
    return response?.trim() || `You have permission to pursue ${dream} with your whole heart. Your desire for this comes from a beautiful place within you—honor it.`;
  } catch (error) {
    console.error('Permission statement generation error:', error);
    return `You have permission to pursue ${dream} with your whole heart. Your desire for this comes from a beautiful place within you—honor it.`;
  }
}

// Database operations
export async function createFiveWhysSession(
  userId: string,
  dreamId?: string
): Promise<FiveWhysSession | null> {
  try {
    const { data, error } = await supabaseAny
      .from('five_whys_sessions')
      .insert({
        user_id: userId,
        dream_id: dreamId || null,
        status: 'in_progress',
        current_why_number: 1,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FiveWhysSession;
  } catch (error) {
    console.error('Error creating Five Whys session:', error);
    return null;
  }
}

export async function saveFiveWhysResponse(
  sessionId: string,
  whyNumber: number,
  question: string,
  userResponse: string,
  gabbyReflection?: string
): Promise<FiveWhysResponse | null> {
  try {
    const { data, error } = await supabaseAny
      .from('five_whys_responses')
      .insert({
        session_id: sessionId,
        why_number: whyNumber,
        question,
        user_response: userResponse,
        gabby_reflection: gabbyReflection || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update session's current why number
    await supabaseAny
      .from('five_whys_sessions')
      .update({ current_why_number: whyNumber + 1 })
      .eq('id', sessionId);

    return data as FiveWhysResponse;
  } catch (error) {
    console.error('Error saving Five Whys response:', error);
    return null;
  }
}

export async function completeFiveWhysSession(
  sessionId: string,
  rootMotivation: string
): Promise<void> {
  try {
    await supabaseAny
      .from('five_whys_sessions')
      .update({
        status: 'completed',
        root_motivation: rootMotivation,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
  } catch (error) {
    console.error('Error completing Five Whys session:', error);
  }
}

export async function getFiveWhysSession(
  sessionId: string
): Promise<{ session: FiveWhysSession; responses: FiveWhysResponse[] } | null> {
  try {
    const { data: session, error: sessionError } = await supabaseAny
      .from('five_whys_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    const { data: responses, error: responsesError } = await supabaseAny
      .from('five_whys_responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('why_number', { ascending: true });

    if (responsesError) throw responsesError;

    return {
      session: session as FiveWhysSession,
      responses: (responses || []) as FiveWhysResponse[],
    };
  } catch (error) {
    console.error('Error fetching Five Whys session:', error);
    return null;
  }
}

export async function getUserLatestFiveWhysSession(
  userId: string,
  dreamId?: string
): Promise<{ session: FiveWhysSession; responses: FiveWhysResponse[] } | null> {
  try {
    let query = supabaseAny
      .from('five_whys_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (dreamId) {
      query = query.eq('dream_id', dreamId);
    }

    const { data: sessions, error: sessionError } = await query;

    if (sessionError || !sessions || sessions.length === 0) {
      return null;
    }

    const session = sessions[0] as FiveWhysSession;

    const { data: responses, error: responsesError } = await supabaseAny
      .from('five_whys_responses')
      .select('*')
      .eq('session_id', session.id)
      .order('why_number', { ascending: true });

    if (responsesError) throw responsesError;

    return {
      session,
      responses: (responses || []) as FiveWhysResponse[],
    };
  } catch (error) {
    console.error('Error fetching user Five Whys session:', error);
    return null;
  }
}
