import { useState, useCallback } from 'react';

const NEWELL_API_URL = process.env.EXPO_PUBLIC_NEWELL_API_URL;
const PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID;

interface NewellResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Hook for Newell AI integrations (Vision, Audio Transcription, Text Generation)
 */
export function useNewell() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Analyze an image using Newell AI Vision
   */
  const analyzeImage = useCallback(async (imageUri: string, prompt: string): Promise<string> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Convert image to base64
      const base64 = await fetch(imageUri)
        .then(res => res.blob())
        .then(blob => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              // Remove data URL prefix
              const base64Data = result.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });

      const response = await fetch(`${NEWELL_API_URL}/vision/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Project-ID': PROJECT_ID || '',
        },
        body: JSON.stringify({
          image: base64,
          prompt,
          model: 'gpt-4-vision',
        }),
      });

      if (!response.ok) {
        throw new Error(`Vision API error: ${response.statusText}`);
      }

      const data: NewellResponse = await response.json();

      if (data.success && data.data?.analysis) {
        return data.data.analysis;
      } else {
        throw new Error(data.error || 'Failed to analyze image');
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
   * Transcribe audio using Newell AI Audio Transcription
   */
  const transcribeAudio = useCallback(async (audioUri: string): Promise<string | null> => {
    setIsTranscribing(true);
    setError(null);

    try {
      // Convert audio to base64
      const base64 = await fetch(audioUri)
        .then(res => res.blob())
        .then(blob => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              const base64Data = result.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });

      const response = await fetch(`${NEWELL_API_URL}/audio/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Project-ID': PROJECT_ID || '',
        },
        body: JSON.stringify({
          audio: base64,
          model: 'whisper-1',
        }),
      });

      if (!response.ok) {
        throw new Error(`Transcription API error: ${response.statusText}`);
      }

      const data: NewellResponse = await response.json();

      if (data.success && data.data?.transcription) {
        return data.data.transcription;
      } else {
        throw new Error(data.error || 'Failed to transcribe audio');
      }
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
   * Generate text using Newell AI (for summaries, reflections, etc.)
   */
  const generateText = useCallback(async (prompt: string, systemPrompt?: string): Promise<string | null> => {
    try {
      const response = await fetch(`${NEWELL_API_URL}/text/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Project-ID': PROJECT_ID || '',
        },
        body: JSON.stringify({
          prompt,
          systemPrompt: systemPrompt || 'You are Gabby, an encouraging AI coach helping users celebrate their achievements.',
          model: 'gpt-4',
          maxTokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`Text generation API error: ${response.statusText}`);
      }

      const data: NewellResponse = await response.json();

      if (data.success && data.data?.text) {
        return data.data.text;
      } else {
        throw new Error(data.error || 'Failed to generate text');
      }
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
