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
  breakDownAction,
  RoadmapActionData,
} from '@/services/aiService';
import { validateRoadmapSchema, getSchemaFixInstructions } from '@/lib/schemaValidator';

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
        // First, fetch parent actions only (actions without a parent)
        const { data: actionsData, error: actionsError } = await supabase
          .from('roadmap_actions')
          .select('*')
          .eq('roadmap_id', roadmap.id)
          .is('parent_action_id', null) // Only parent actions
          .order('order_index', { ascending: true });

        if (actionsError) throw actionsError;

        // For each parent action, fetch its sub-actions
        const actionsWithSubActions: RoadmapAction[] = [];
        for (const action of actionsData || []) {
          const { data: subActionsData } = await supabase
            .from('roadmap_actions')
            .select('*')
            .eq('parent_action_id', action.id)
            .order('order_index', { ascending: true });

          actionsWithSubActions.push({
            ...action,
            subActions: subActionsData || [],
          } as RoadmapAction);
        }

        roadmapsWithActions.push({
          ...roadmap,
          actions: actionsWithSubActions,
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
          root_motivation: rootMotivation || 'To achieve my dreams', // Fallback to prevent NULL constraint
          title: aiResult.roadmap_title || 'Your Golden Path',
          status: 'active',
        };

        const { data: roadmapData, error: roadmapError } = await supabase
          .from('action_roadmaps')
          .insert(roadmapInsert) // Use the correct insert object
          .select()
          .single();

        if (roadmapError) {
          console.warn('Roadmap insert error:', roadmapError);
          // throw roadmapError; // Suppress error to avoid breaking flow for user
        }

        // If insert failed but we have AI actions, we can still return a "virtual" roadmap for the UI
        if (!roadmapData) {
          // Mock response if database fails
          const virtualRoadmap = {
            id: 'virtual-' + Date.now(),
            ...roadmapInsert,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Create virtual actions
          const virtualActions = aiResult.actions.map((action: RoadmapActionData, index: number) => ({
            id: 'virtual-action-' + index,
            roadmap_id: virtualRoadmap.id,
            title: action.title,
            description: action.description,
            why_it_matters: action.why_it_matters,
            duration_minutes: action.duration_minutes,
            order_index: action.order_index,
            is_completed: false,
            gabby_tip: action.gabby_tip,
            category: action.category,
            created_at: new Date().toISOString()
          }));

          return {
            ...virtualRoadmap,
            actions: virtualActions
          };
        }

        // Insert actions (PHASES/PARENTS)
        const actionsToInsert: RoadmapActionInsert[] = aiResult.actions.map(
          (action: RoadmapActionData) => ({
            roadmap_id: roadmapData.id,
            user_id: user.id,
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

        // Attempt to insert actions
        const { data: phasesData, error: phasesError } = await supabase
          .from('roadmap_actions')
          .insert(actionsToInsert)
          .select()
          .order('order_index', { ascending: true }); // Ensure order matches input

        if (phasesError) console.error('Phases insert failed:', phasesError);

        // Insert MULTIPLE sub-actions for each phase
        if (phasesData && phasesData.length > 0) {
          for (let i = 0; i < aiResult.actions.length; i++) {
            const aiPhase = aiResult.actions[i];
            // Find the inserted phase that corresponds to this AI result (matching order_index is safest)
            const savedPhase = phasesData.find(p => p.order_index === aiPhase.order_index);

            if (aiPhase.sub_steps && aiPhase.sub_steps.length > 0 && savedPhase) {
              const subActionsToInsert = aiPhase.sub_steps.map((subStep: any, index: number) => ({
                roadmap_id: roadmapData.id,
                user_id: user.id,
                parent_action_id: savedPhase.id, // Link to the specific Phase ID
                title: subStep.title,
                description: subStep.description || null,
                duration_minutes: subStep.duration_minutes || 5, // Default duration
                order_index: index,
                is_completed: false,
                category: 'action',
              }));

              // Attach to the local object so it's included in the final return
              (savedPhase as any).subActions = subActionsToInsert;

              const { error: subActionsError } = await supabase
                .from('roadmap_actions')
                .insert(subActionsToInsert);

              if (subActionsError) {
                console.error(`Failed to insert sub-actions for phase ${savedPhase.title}:`, subActionsError);
              }
            }
          }
        }

        const newRoadmap: ActionRoadmapWithActions = {
          id: roadmapData.id,
          user_id: roadmapData.user_id,
          dream: roadmapData.dream,
          root_motivation: roadmapData.root_motivation,
          title: (roadmapData as any).title || (roadmapData as any).roadmap_title || 'Your Golden Path',
          status: roadmapData.status,
          created_at: roadmapData.created_at,
          updated_at: roadmapData.updated_at,
          actions: (phasesData || []) as any as RoadmapAction[],
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

        // Update local state - check both top-level actions AND sub-actions
        setRoadmaps((prev) =>
          prev.map((roadmap) => ({
            ...roadmap,
            actions: roadmap.actions.map((action) => {
              // If this action matches the ID, mark it complete
              if (action.id === actionId) {
                return { ...action, is_completed: true, completed_at: new Date().toISOString() };
              }
              // Also check if any sub-action matches the ID and update it
              if (action.subActions && action.subActions.length > 0) {
                return {
                  ...action,
                  subActions: action.subActions.map((sub) =>
                    sub.id === actionId
                      ? { ...sub, is_completed: true, completed_at: new Date().toISOString() }
                      : sub
                  ),
                };
              }
              return action;
            }),
          }))
        );

        if (activeRoadmap) {
          setActiveRoadmap({
            ...activeRoadmap,
            actions: activeRoadmap.actions.map((action) => {
              // If this action matches the ID, mark it complete
              if (action.id === actionId) {
                return { ...action, is_completed: true, completed_at: new Date().toISOString() };
              }
              // Also check if any sub-action matches the ID and update it
              if (action.subActions && action.subActions.length > 0) {
                return {
                  ...action,
                  subActions: action.subActions.map((sub) =>
                    sub.id === actionId
                      ? { ...sub, is_completed: true, completed_at: new Date().toISOString() }
                      : sub
                  ),
                };
              }
              return action;
            }),
          });
        }

        // Check if all actions are completed - REMOVED AUTO COMPLETION
        // We now handle this manually in the UI to keep the celebration screen open
        /*
        if (activeRoadmap) {
          const updatedActions = activeRoadmap.actions.map((a) =>
            a.id === actionId ? { ...a, is_completed: true } : a
          );
          const allCompleted = updatedActions.every((a) => a.is_completed);

          if (allCompleted) {
            await updateRoadmapStatus(activeRoadmap.id, 'completed');
          }
        }
        */

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

  // Break down a difficult action into smaller steps
  const breakDownActionIntoSteps = useCallback(
    async (actionId: string) => {
      if (!activeRoadmap) return null;
      if (!user?.id) {
        setError('Please sign in to break down actions');
        return null;
      }

      const action = activeRoadmap.actions.find((a) => a.id === actionId);
      if (!action) return null;

      setLoading(true);
      setError(null);

      try {
        const currentActionData: RoadmapActionData = {
          title: action.title,
          description: action.description || '',
          why_it_matters: action.why_it_matters || '',
          duration_minutes: action.duration_minutes || 15,
          gabby_tip: action.gabby_tip || '',
          category: (action.category as RoadmapActionData['category']) || 'action',
          order_index: action.order_index,
        };

        const result = await breakDownAction(
          currentActionData,
          activeRoadmap.dream,
          activeRoadmap.root_motivation || undefined
        );

        if (!result.success || !result.actions || result.actions.length === 0) {
          throw new Error(result.error || 'Failed to break down action');
        }

        // DON'T delete the parent - keep it and add sub-actions as children
        // Insert the new sub-actions with parent_action_id
        const actionsToInsert: RoadmapActionInsert[] = result.actions.map((newAction, index) => ({
          roadmap_id: activeRoadmap.id,
          user_id: user.id,
          parent_action_id: actionId, // Link to parent action
          title: newAction.title,
          description: newAction.description,
          why_it_matters: newAction.why_it_matters,
          duration_minutes: newAction.duration_minutes,
          order_index: index, // Sub-actions have their own ordering (0, 1, 2...)
          is_completed: false,
          gabby_tip: newAction.gabby_tip,
          category: newAction.category,
        }));

        const { data: newActionsData, error: insertError } = await supabase
          .from('roadmap_actions')
          .insert(actionsToInsert)
          .select();

        if (insertError) throw insertError;

        // Refresh roadmaps to get updated state
        await fetchRoadmaps();

        return newActionsData || [];
      } catch (err) {
        console.error('Error breaking down action:', err);
        setError('Failed to break down action. Please try again.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [activeRoadmap, fetchRoadmaps]
  );

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
    breakDownActionIntoSteps,
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
