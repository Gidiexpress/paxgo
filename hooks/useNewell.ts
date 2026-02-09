import { useState, useCallback } from 'react';
import { generateTextGroq, analyzeImageGroq, transcribeAudioGroq } from '../services/groq';

/**
 * Hook for AI integrations (formerly Newell, now Groq)
 * Maintained for backward compatibility
 */
export function useNewell() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Analyze an image using Groq Vision
   */
  const analyzeImage = useCallback(async (imageUri: string, prompt: string): Promise<string> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Convert image to base64
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

      const response = await analyzeImageGroq(base64Data, prompt);

      if (response) {
        return response;
      } else {
        throw new Error('Failed to analyze image');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Image analysis failed';
      setError(errorMessage);
      console.error('Image analysis error:', err);
      // Return a fallback message
      return "Great work capturing this moment! Every step forward counts. 🌟";
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Transcribe audio using Groq Whisper
   */
  const transcribeAudio = useCallback(async (audioUri: string): Promise<string | null> => {
    setIsTranscribing(true);
    setError(null);

    try {
      const result = await transcribeAudioGroq(audioUri);
      if (!result) throw new Error('Transcription failed');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transcription failed';
      setError(errorMessage);
      console.error('Audio transcription error:', err);
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  /**
   * Generate text using Groq
   */
  const generateText = useCallback(async (prompt: string, systemPrompt?: string): Promise<string | null> => {
    try {
      return await generateTextGroq({ prompt, systemPrompt });
    } catch (err) {
      console.error('Text generation error:', err);
      return null;
    }
  }, []);

  return {
    analyzeImage,
    transcribeAudio,
    generateText,
    isAnalyzing,
    isTranscribing,
    error,
  };
}

