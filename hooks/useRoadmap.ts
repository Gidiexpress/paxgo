import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@fastshot/auth';
import {
  ActionRoadmap,
  RoadmapAction,
  ActionRoadmapWithActions,
  ActionRoadmapInsert,
  RoadmapActionInsert,
  RoadmapStatus,
} from '@/types/database';
import {
  generateRoadmapActions,
  refineRoadmapAction,
  RoadmapActionData,
} from '@/services/aiService';

// Hook for managing action roadmaps
export function useRoadmap() {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<ActionRoadmapWithActions[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<ActionRoadmapWithActions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all roadmaps for the user
  const fetchRoadmaps = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data: roadmapData, error: roadmapError } = await supabase
        .from('action_roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (roadmapError) throw roadmapError;

      // Fetch actions for each roadmap
      const roadmapsWithActions: ActionRoadmapWithActions[] = [];

      for (const roadmap of roadmapData || []) {
        const { data: actionsData, error: actionsError } = await supabase
          .from('roadmap_actions')
          .select('*')
          .eq('roadmap_id', roadmap.id)
          .order('order_index', { ascending: true });

        if (actionsError) throw actionsError;

        roadmapsWithActions.push({
          ...roadmap,
          actions: actionsData || [],
        });
      }

      setRoadmaps(roadmapsWithActions);

      // Set active roadmap (first active one)
      const active = roadmapsWithActions.find((r) => r.status === 'active');
      setActiveRoadmap(active || null);
    } catch (err) {
      console.error('Error fetching roadmaps:', err);
      setError('Failed to load your roadmaps');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load roadmaps on mount
  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  // Create a new roadmap with AI-generated actions
  const createRoadmap = useCallback(
    async (dream: string, rootMotivation?: string) => {
      if (!user?.id) {
        setError('Please sign in to create a roadmap');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Generate actions using AI
        const aiResult = await generateRoadmapActions(dream, rootMotivation);

        if (!aiResult.success || !aiResult.actions) {
          throw new Error(aiResult.error || 'Failed to generate roadmap');
        }

        // Create the roadmap
        const roadmapInsert: ActionRoadmapInsert = {
          user_id: user.id,
          dream,
          root_motivation: rootMotivation || null,
          roadmap_title: aiResult.roadmap_title || 'Your Golden Path',
          status: 'active',
        };

        const { data: roadmapData, error: roadmapError } = await supabase
          .from('action_roadmaps')
          .insert(roadmapInsert)
          .select()
          .single();

        if (roadmapError) throw roadmapError;

        // Insert actions
        const actionsToInsert: RoadmapActionInsert[] = aiResult.actions.map(
          (action: RoadmapActionData) => ({
            roadmap_id: roadmapData.id,
            title: action.title,
            description: action.description,
            why_it_matters: action.why_it_matters,
            duration_minutes: action.duration_minutes,
            order_index: action.order_index,
            is_completed: false,
            gabby_tip: action.gabby_tip,
            category: action.category,
          })
        );

        const { data: actionsData, error: actionsError } = await supabase
          .from('roadmap_actions')
          .insert(actionsToInsert)
          .select();

        if (actionsError) throw actionsError;

        const newRoadmap: ActionRoadmapWithActions = {
          ...roadmapData,
          actions: actionsData || [],
        };

        // Update state
        setRoadmaps((prev) => [newRoadmap, ...prev]);
        setActiveRoadmap(newRoadmap);

        return newRoadmap;
      } catch (err) {
        console.error('Error creating roadmap:', err);
        setError('Failed to create your roadmap. Please try again.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  // Complete an action
  const completeAction = useCallback(
    async (actionId: string) => {
      try {
        const { error: updateError } = await supabase
          .from('roadmap_actions')
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq('id', actionId);

        if (updateError) throw updateError;

        // Update local state
        setRoadmaps((prev) =>
          prev.map((roadmap) => ({
            ...roadmap,
            actions: roadmap.actions.map((action) =>
              action.id === actionId
                ? { ...action, is_completed: true, completed_at: new Date().toISOString() }
                : action
            ),
          }))
        );

        if (activeRoadmap) {
          setActiveRoadmap({
            ...activeRoadmap,
            actions: activeRoadmap.actions.map((action) =>
              action.id === actionId
                ? { ...action, is_completed: true, completed_at: new Date().toISOString() }
                : action
            ),
          });
        }

        // Check if all actions are completed
        if (activeRoadmap) {
          const updatedActions = activeRoadmap.actions.map((a) =>
            a.id === actionId ? { ...a, is_completed: true } : a
          );
          const allCompleted = updatedActions.every((a) => a.is_completed);

          if (allCompleted) {
            await updateRoadmapStatus(activeRoadmap.id, 'completed');
          }
        }

        return true;
      } catch (err) {
        console.error('Error completing action:', err);
        setError('Failed to complete action');
        return false;
      }
    },
    [activeRoadmap]
  );

  // Uncomplete an action (undo)
  const uncompleteAction = useCallback(
    async (actionId: string) => {
      try {
        const { error: updateError } = await supabase
          .from('roadmap_actions')
          .update({
            is_completed: false,
            completed_at: null,
          })
          .eq('id', actionId);

        if (updateError) throw updateError;

        // Update local state
        setRoadmaps((prev) =>
          prev.map((roadmap) => ({
            ...roadmap,
            actions: roadmap.actions.map((action) =>
              action.id === actionId
                ? { ...action, is_completed: false, completed_at: null }
                : action
            ),
          }))
        );

        if (activeRoadmap) {
          setActiveRoadmap({
            ...activeRoadmap,
            actions: activeRoadmap.actions.map((action) =>
              action.id === actionId
                ? { ...action, is_completed: false, completed_at: null }
                : action
            ),
          });
        }

        return true;
      } catch (err) {
        console.error('Error uncompleting action:', err);
        return false;
      }
    },
    [activeRoadmap]
  );

  // Refine a single action with AI
  const refineAction = useCallback(
    async (actionId: string, userFeedback?: string) => {
      if (!activeRoadmap) return null;

      const currentAction = activeRoadmap.actions.find((a) => a.id === actionId);
      if (!currentAction) return null;

      setLoading(true);
      setError(null);

      try {
        const currentActionData: RoadmapActionData = {
          title: currentAction.title,
          description: currentAction.description || '',
          why_it_matters: currentAction.why_it_matters || '',
          duration_minutes: currentAction.duration_minutes || 15,
          gabby_tip: currentAction.gabby_tip || '',
          category: (currentAction.category as RoadmapActionData['category']) || 'action',
          order_index: currentAction.order_index,
        };

        const result = await refineRoadmapAction(
          currentActionData,
          activeRoadmap.dream,
          activeRoadmap.root_motivation || undefined,
          userFeedback
        );

        if (!result.success || !result.action) {
          throw new Error(result.error || 'Failed to refine action');
        }

        // Update the action in the database
        const { error: updateError } = await supabase
          .from('roadmap_actions')
          .update({
            title: result.action.title,
            description: result.action.description,
            why_it_matters: result.action.why_it_matters,
            duration_minutes: result.action.duration_minutes,
            gabby_tip: result.action.gabby_tip,
            category: result.action.category,
          })
          .eq('id', actionId);

        if (updateError) throw updateError;

        // Update local state
        const updatedAction: RoadmapAction = {
          ...currentAction,
          title: result.action.title,
          description: result.action.description,
          why_it_matters: result.action.why_it_matters,
          duration_minutes: result.action.duration_minutes,
          gabby_tip: result.action.gabby_tip,
          category: result.action.category,
        };

        setActiveRoadmap({
          ...activeRoadmap,
          actions: activeRoadmap.actions.map((a) =>
            a.id === actionId ? updatedAction : a
          ),
        });

        setRoadmaps((prev) =>
          prev.map((roadmap) =>
            roadmap.id === activeRoadmap.id
              ? {
                  ...roadmap,
                  actions: roadmap.actions.map((a) =>
                    a.id === actionId ? updatedAction : a
                  ),
                }
              : roadmap
          )
        );

        return updatedAction;
      } catch (err) {
        console.error('Error refining action:', err);
        setError('Failed to refine action. Please try again.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [activeRoadmap]
  );

  // Update roadmap status
  const updateRoadmapStatus = useCallback(
    async (roadmapId: string, status: RoadmapStatus) => {
      try {
        const { error: updateError } = await supabase
          .from('action_roadmaps')
          .update({ status })
          .eq('id', roadmapId);

        if (updateError) throw updateError;

        // Update local state
        setRoadmaps((prev) =>
          prev.map((roadmap) =>
            roadmap.id === roadmapId ? { ...roadmap, status } : roadmap
          )
        );

        if (activeRoadmap?.id === roadmapId) {
          setActiveRoadmap({ ...activeRoadmap, status });
        }

        return true;
      } catch (err) {
        console.error('Error updating roadmap status:', err);
        return false;
      }
    },
    [activeRoadmap]
  );

  // Archive a roadmap
  const archiveRoadmap = useCallback(
    async (roadmapId: string) => {
      return updateRoadmapStatus(roadmapId, 'archived');
    },
    [updateRoadmapStatus]
  );

  // Delete a roadmap
  const deleteRoadmap = useCallback(
    async (roadmapId: string) => {
      try {
        const { error: deleteError } = await supabase
          .from('action_roadmaps')
          .delete()
          .eq('id', roadmapId);

        if (deleteError) throw deleteError;

        // Update local state
        setRoadmaps((prev) => prev.filter((r) => r.id !== roadmapId));

        if (activeRoadmap?.id === roadmapId) {
          const remaining = roadmaps.filter((r) => r.id !== roadmapId);
          setActiveRoadmap(remaining.find((r) => r.status === 'active') || null);
        }

        return true;
      } catch (err) {
        console.error('Error deleting roadmap:', err);
        setError('Failed to delete roadmap');
        return false;
      }
    },
    [activeRoadmap, roadmaps]
  );

  // Calculate progress for a roadmap
  const getProgress = useCallback((roadmap: ActionRoadmapWithActions) => {
    if (roadmap.actions.length === 0) return 0;
    const completed = roadmap.actions.filter((a) => a.is_completed).length;
    return completed / roadmap.actions.length;
  }, []);

  // Get the active roadmap's progress
  const activeProgress = activeRoadmap ? getProgress(activeRoadmap) : 0;
  const completedCount = activeRoadmap?.actions.filter((a) => a.is_completed).length || 0;
  const totalCount = activeRoadmap?.actions.length || 0;

  return {
    // State
    roadmaps,
    activeRoadmap,
    loading,
    error,
    activeProgress,
    completedCount,
    totalCount,

    // Actions
    fetchRoadmaps,
    createRoadmap,
    completeAction,
    uncompleteAction,
    refineAction,
    updateRoadmapStatus,
    archiveRoadmap,
    deleteRoadmap,
    getProgress,
    setActiveRoadmap,
  };
}

// Hook for generating a new roadmap (used during onboarding or new dream creation)
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
      const result = await generateRoadmapActions(dream, rootMotivation);

      if (result.success && result.actions) {
        setGeneratedRoadmap({
          roadmap_title: result.roadmap_title || 'Your Golden Path',
          actions: result.actions,
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
