import { useState, useCallback } from 'react';
import { generateTextGroq, transcribeAudioGroq, analyzeImageGroq } from '../services/groq';

/**
 * Hook for consuming Groq AI services
 */
export function useGroq() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Generate text response
     */
    const generateText = useCallback(async (prompt: string, systemPrompt?: string): Promise<string | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateTextGroq({ prompt, systemPrompt });
            if (!result) throw new Error('No response generated');
            return result;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to generate text';
            setError(msg);
            console.error(err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Transcribe audio
     */
    const transcribeAudio = useCallback(async (audioUri: string): Promise<string | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await transcribeAudioGroq(audioUri);
            if (!result) throw new Error('Transcription failed');
            return result;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to transcribe audio';
            setError(msg);
            console.error(err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Analyze image
     */
    const analyzeImage = useCallback(async (imageUri: string, prompt: string): Promise<string> => {
        setIsLoading(true);
        setError(null);
        try {
            // For Groq API, we need base64. 
            // If imageUri is already base64 (data:image...), strip prefix?
            // Or if it's a file path, we need to read it.
            // Assuming behavior similar to useNewell where we fetch the blob and convert.

            let base64Data = '';

            if (imageUri.startsWith('data:image')) {
                base64Data = imageUri.split(',')[1];
            } else {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }

            const result = await analyzeImageGroq(base64Data, prompt);
            if (!result) throw new Error('Image analysis failed');
            return result;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to analyze image';
            setError(msg);
            console.error(err);
            // Fallback message similar to previous implementation
            return "That looks like a bold move in progress! Keep going. 🌟";
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        generateText,
        transcribeAudio,
        analyzeImage,
        isLoading,
        error,
    };
}
