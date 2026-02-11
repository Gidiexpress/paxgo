import { useRoadmap as useRoadmapContext } from '@/contexts/RoadmapContext';
// Re-export the context hook as the main hook
export const useRoadmap = useRoadmapContext;

// Re-export the generation hook
// Note: We need to make sure this file still exports useRoadmapGeneration as it was defined in the original file
// The original file had useRoadmapGeneration defined inline.
// I will move useRoadmapGeneration to its own file first to keep things clean, or define it here if it doesn't depend on the context state directly.
// Looking at the original code, useRoadmapGeneration uses AI service but manages its own local state for the generation process effectively.
// So I will keep it here or move it. To minimize file churn, I will keep it here.

import { useState, useCallback } from 'react';
import { generateRoadmapActions, RoadmapActionData } from '@/services/aiService';

export function useRoadmapGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<{
    roadmap_title: string;
    actions: RoadmapActionData[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (dream: string, rootMotivation?: string) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedRoadmap(null);

    try {
      const result = await generateRoadmapActions(dream, rootMotivation || '');

      if (result.success && result.roadmap) {
        setGeneratedRoadmap({
          roadmap_title: result.roadmap.roadmap_title || 'Your Golden Path',
          actions: result.roadmap.actions,
        });
        return result;
      } else {
        throw new Error(result.error || 'Failed to generate roadmap');
      }
    } catch (err) {
      console.error('Roadmap generation error:', err);
      setError('Failed to generate your roadmap. Please try again.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setGeneratedRoadmap(null);
    setError(null);
  }, []);

  return {
    isGenerating,
    generatedRoadmap,
    error,
    generate,
    reset,
  };
}
