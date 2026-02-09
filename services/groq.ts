import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

if (!GROQ_API_KEY) {
    console.warn('Missing EXPO_PUBLIC_GROQ_API_KEY environment variable');
}

export const groq = new Groq({
    apiKey: GROQ_API_KEY,
    dangerouslyAllowBrowser: true, // Required for Expo/React Native
});

export const MODELS = {
    TEXT: 'llama-3.3-70b-versatile',
    VISION: 'llama-3.2-11b-vision-preview',
    AUDIO: 'whisper-large-v3',
};

interface GroqTextOptions {
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
}

/**
 * Generate text using Groq
 */
export async function generateTextGroq({
    prompt,
    systemPrompt,
    maxTokens = 1024,
    temperature = 0.7,
}: GroqTextOptions): Promise<string | null> {
    try {
        const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        messages.push({ role: 'user', content: prompt });

        const completion = await groq.chat.completions.create({
            messages,
            model: MODELS.TEXT,
            max_tokens: maxTokens,
            temperature,
        });

        return completion.choices[0]?.message?.content || null;
    } catch (error) {
        console.error('Groq text generation error:', error);
        return null;
    }
}

/**
 * Analyze image using Groq Vision
 */
export async function analyzeImageGroq(
    base64Image: string,
    prompt: string
): Promise<string | null> {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            model: MODELS.VISION,
        });

        return completion.choices[0]?.message?.content || null;
    } catch (error) {
        console.error('Groq vision analysis error:', error);
        return null;
    }
}

/**
 * Transcribe audio using Groq Whisper
 * Note: Groq SDK might have specific requirements for file uploads in RN.
 * We might need to use FormData standard fetch if SDK has issues with FS.
 */
export async function transcribeAudioGroq(audioUri: string): Promise<string | null> {
    try {
        // In React Native, we typically need to create a FormData object
        // with the file to send it to an API.
        // The Groq SDK expects a File object or ReadStream, which might be tricky in RN.
        // Let's rely on a direct fetch to the transcription endpoint for maximum compatibility in Expo.

        const formData = new FormData();
        formData.append('file', {
            uri: audioUri,
            type: 'audio/m4a', // Adjust based on your audio type
            name: 'audio.m4a',
        } as any);
        formData.append('model', 'whisper-large-v3');

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                // Content-Type is set automatically by FormData
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Groq transcription failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.text || null;
    } catch (error) {
        console.error('Groq audio transcription error:', error);
        return null;
    }
}
