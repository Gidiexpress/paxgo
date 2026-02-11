import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@fastshot/auth';
import {
    ActionRoadmapWithActions,
    RoadmapAction,
    ActionRoadmapInsert,
    RoadmapActionInsert,
    RoadmapStatus,
} from '@/types/database';
import {
    generateRoadmapActions,
    refineRoadmapAction,
    breakDownAction,
    RoadmapActionData
} from '@/services/aiService';

interface RoadmapContextType {
    // State
    roadmaps: ActionRoadmapWithActions[];
    activeRoadmap: ActionRoadmapWithActions | null;
    loading: boolean;
    error: string | null;

    // Derived
    activeProgress: number;
    completedCount: number;
    totalCount: number;
    globalCompletedCount: number;
    currentStreak: number;

    // Actions
    fetchRoadmaps: () => Promise<void>;
    createRoadmap: (dream: string, rootMotivation?: string) => Promise<ActionRoadmapWithActions | null>;
    completeAction: (actionId: string) => Promise<boolean>;
    uncompleteAction: (actionId: string) => Promise<boolean>;
    refineAction: (actionId: string, userFeedback?: string) => Promise<RoadmapAction | null>;
    breakDownActionIntoSteps: (actionId: string) => Promise<RoadmapAction[] | null>;
    updateRoadmapStatus: (roadmapId: string, status: RoadmapStatus) => Promise<boolean>;
    archiveRoadmap: (roadmapId: string) => Promise<boolean>;
    deleteRoadmap: (roadmapId: string) => Promise<boolean>;
    setActiveRoadmap: (roadmap: ActionRoadmapWithActions | null) => void;
    getProgress: (roadmap: ActionRoadmapWithActions) => number;
}

const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

export function RoadmapProvider({ children }: { children: React.ReactNode }) {
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

            // Restore active roadmap if it exists and wasn't explicitly set yet
            // Or if the currently active roadmap is updated, reflect that
            if (activeRoadmap) {
                const updatedActive = roadmapsWithActions.find(r => r.id === activeRoadmap.id);
                if (updatedActive) {
                    setActiveRoadmap(updatedActive);
                } else {
                    // Fallback if active was deleted or something
                    const active = roadmapsWithActions.find((r) => r.status === 'active');
                    setActiveRoadmap(active || null);
                }
            } else {
                // Set active roadmap (first active one)
                const active = roadmapsWithActions.find((r) => r.status === 'active');
                setActiveRoadmap(active || null);
            }

        } catch (err) {
            console.error('Error fetching roadmaps:', err);
            setError('Failed to load your roadmaps');
        } finally {
            setLoading(false);
        }
    }, [user?.id, activeRoadmap?.id]); // Depend on ID to avoid circular dep on object

    // Create a new roadmap
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
                const aiResult = await generateRoadmapActions(dream, rootMotivation || '');

                if (!aiResult.success || !aiResult.roadmap) {
                    throw new Error(aiResult.error || 'Failed to generate roadmap');
                }

                const { roadmap_title, actions } = aiResult.roadmap;

                // Create the roadmap
                const roadmapInsert: ActionRoadmapInsert = {
                    user_id: user.id,
                    dream,
                    root_motivation: rootMotivation || 'To achieve my dreams',
                    title: roadmap_title || 'Your Golden Path',
                    status: 'active',
                };

                const { data: roadmapData, error: roadmapError } = await supabase
                    .from('action_roadmaps')
                    .insert(roadmapInsert)
                    .select()
                    .single();

                if (roadmapError) throw roadmapError;

                // Insert PHASES (Parent Actions)
                const insertedActions: RoadmapAction[] = [];

                for (const phase of actions) {
                    const { data: phaseData, error: phaseError } = await supabase
                        .from('roadmap_actions')
                        .insert({
                            roadmap_id: roadmapData.id,
                            user_id: user.id,
                            title: phase.title,
                            description: phase.description,
                            why_it_matters: phase.why_it_matters,
                            duration_minutes: phase.duration_minutes,
                            order_index: phase.order_index,
                            is_completed: false,
                            gabby_tip: phase.gabby_tip,
                            category: phase.category,
                        })
                        .select()
                        .single();

                    if (phaseError) throw phaseError;
                    if (!phaseData) continue;

                    const fullPhase = {
                        ...phaseData,
                        subActions: []
                    } as unknown as RoadmapAction;

                    // Insert Sub-steps if any
                    if (phase.sub_steps && phase.sub_steps.length > 0) {
                        const subStepsInsert = phase.sub_steps.map((step: any, index: number) => ({
                            roadmap_id: roadmapData.id,
                            user_id: user.id,
                            parent_action_id: phaseData.id,
                            title: step.title,
                            description: step.description,
                            duration_minutes: step.duration_minutes,
                            order_index: index,
                            is_completed: false,
                            category: 'action'
                        }));

                        const { data: subStepsData, error: subStepsError } = await supabase
                            .from('roadmap_actions')
                            .insert(subStepsInsert)
                            .select()
                            .order('order_index');

                        if (subStepsError) throw subStepsError;

                        if (subStepsData) {
                            fullPhase.subActions = subStepsData as unknown as RoadmapAction[];
                        }
                    }

                    insertedActions.push(fullPhase);
                }

                const newRoadmap: ActionRoadmapWithActions = {
                    id: roadmapData.id,
                    user_id: roadmapData.user_id,
                    dream: roadmapData.dream,
                    root_motivation: roadmapData.root_motivation,
                    title: (roadmapData as any).title || roadmap_title || 'Your Golden Path',
                    status: roadmapData.status,
                    created_at: roadmapData.created_at,
                    updated_at: roadmapData.updated_at,
                    actions: insertedActions,
                };

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
    const completeAction = useCallback(async (actionId: string) => {
        try {
            const { error: updateError } = await supabase
                .from('roadmap_actions')
                .update({
                    is_completed: true,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', actionId);

            if (updateError) throw updateError;

            // Update local state deeply
            const updateActions = (actions: RoadmapAction[]): RoadmapAction[] => {
                return actions.map(action => {
                    if (action.id === actionId) {
                        return { ...action, is_completed: true, completed_at: new Date().toISOString() };
                    }
                    if (action.subActions) {
                        return { ...action, subActions: updateActions(action.subActions) };
                    }
                    return action;
                });
            };

            setRoadmaps(prev => prev.map(r => ({ ...r, actions: updateActions(r.actions) })));

            if (activeRoadmap) {
                setActiveRoadmap(prev => prev ? { ...prev, actions: updateActions(prev.actions) } : null);
            }

            return true;
        } catch (err) {
            console.error('Error completing action:', err);
            setError('Failed to complete action');
            return false;
        }
    }, [activeRoadmap]);

    // Uncomplete an action
    const uncompleteAction = useCallback(async (actionId: string) => {
        try {
            const { error: updateError } = await supabase
                .from('roadmap_actions')
                .update({
                    is_completed: false,
                    completed_at: null,
                })
                .eq('id', actionId);

            if (updateError) throw updateError;

            const updateActions = (actions: RoadmapAction[]): RoadmapAction[] => {
                return actions.map(action => {
                    if (action.id === actionId) {
                        return { ...action, is_completed: false, completed_at: null };
                    }
                    if (action.subActions) {
                        return { ...action, subActions: updateActions(action.subActions) };
                    }
                    return action;
                });
            };

            setRoadmaps(prev => prev.map(r => ({ ...r, actions: updateActions(r.actions) })));

            if (activeRoadmap) {
                setActiveRoadmap(prev => prev ? { ...prev, actions: updateActions(prev.actions) } : null);
            }

            return true;
        } catch (err) {
            console.error('Error uncompleting action:', err);
            return false;
        }
    }, [activeRoadmap]);

    // Refine action
    const refineAction = useCallback(async (actionId: string, userFeedback?: string) => {
        if (!activeRoadmap) return null;
        const currentAction = activeRoadmap.actions.find((a) => a.id === actionId);
        if (!currentAction) return null;

        setLoading(true);
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

            if (!result.success || !result.action) throw new Error(result.error || 'Failed to refine');

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

            const updatedAction = { ...currentAction, ...result.action };

            const updateActions = (actions: RoadmapAction[]): RoadmapAction[] => {
                return actions.map(a => a.id === actionId ? { ...a, ...result.action } : a);
            };

            setRoadmaps(prev => prev.map(r =>
                r.id === activeRoadmap.id
                    ? { ...r, actions: updateActions(r.actions) }
                    : r
            ));

            setActiveRoadmap(prev => prev ? { ...prev, actions: updateActions(prev.actions) } : null);

            return updatedAction as RoadmapAction;
        } catch (err) {
            console.error('Error refining action:', err);
            setError('Failed to refine action');
            return null;
        } finally {
            setLoading(false);
        }
    }, [activeRoadmap]);

    // Break down action
    const breakDownActionIntoSteps = useCallback(async (actionId: string) => {
        if (!activeRoadmap || !user?.id) return null;
        const action = activeRoadmap.actions.find((a) => a.id === actionId);
        if (!action) return null;

        setLoading(true);
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

            if (!result.success || !result.actions) throw new Error(result.error);

            const actionsToInsert: RoadmapActionInsert[] = result.actions.map((newAction, index) => ({
                roadmap_id: activeRoadmap.id,
                user_id: user.id,
                parent_action_id: actionId,
                title: newAction.title,
                description: newAction.description,
                why_it_matters: newAction.why_it_matters,
                duration_minutes: newAction.duration_minutes,
                order_index: index,
                is_completed: false,
                gabby_tip: newAction.gabby_tip,
                category: newAction.category,
            }));

            const { data: newActionsData, error: insertError } = await supabase
                .from('roadmap_actions')
                .insert(actionsToInsert)
                .select();

            if (insertError) throw insertError;

            // Trigger fetch to refresh structure correctly
            await fetchRoadmaps();
            return newActionsData as unknown as RoadmapAction[];

        } catch (err) {
            console.error('Error breaking down action:', err);
            setError('Failed to break down action');
            return null;
        } finally {
            setLoading(false);
        }
    }, [activeRoadmap, user?.id, fetchRoadmaps]);

    // Update Status
    const updateRoadmapStatus = useCallback(async (roadmapId: string, status: RoadmapStatus) => {
        try {
            const { error: updateError } = await supabase
                .from('action_roadmaps')
                .update({ status })
                .eq('id', roadmapId);

            if (updateError) throw updateError;

            setRoadmaps(prev => prev.map(r => r.id === roadmapId ? { ...r, status } : r));
            if (activeRoadmap?.id === roadmapId) {
                setActiveRoadmap(prev => prev ? { ...prev, status } : null);
            }
            return true;
        } catch (err) {
            console.error('Error updating status:', err);
            return false;
        }
    }, [activeRoadmap]);

    const archiveRoadmap = useCallback((id: string) => updateRoadmapStatus(id, 'archived'), [updateRoadmapStatus]);

    const deleteRoadmap = useCallback(async (roadmapId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('action_roadmaps')
                .delete()
                .eq('id', roadmapId);

            if (deleteError) throw deleteError;

            setRoadmaps(prev => {
                const filtered = prev.filter(r => r.id !== roadmapId);
                // if deleted active, set new active
                if (activeRoadmap?.id === roadmapId) {
                    const newActive = filtered.find(r => r.status === 'active') || null;
                    setActiveRoadmap(newActive);
                }
                return filtered;
            });
            return true;
        } catch (err) {
            console.error('Error deleting roadmap:', err);
            return false;
        }
    }, [activeRoadmap]);

    const getProgress = useCallback((roadmap: ActionRoadmapWithActions) => {
        if (!roadmap.actions?.length) return 0;
        const completed = roadmap.actions.filter(a => a.is_completed).length;
        return completed / roadmap.actions.length;
    }, []);

    // Global Stat Calcs
    const globalStats = useMemo(() => {
        let allActions: RoadmapAction[] = [];
        roadmaps.forEach(r => {
            if (r.actions) {
                allActions = [...allActions, ...r.actions];
                r.actions.forEach(a => {
                    if (a.subActions) allActions = [...allActions, ...a.subActions];
                });
            }
        });

        const completedActions = allActions.filter(a => a.is_completed);
        const totalCompletedCount = completedActions.length;

        // Streak Logic
        const completedDates = completedActions
            .filter(a => a.completed_at)
            .map(a => new Date(a.completed_at!).toDateString())
            .filter((v, i, s) => s.indexOf(v) === i)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        let currentStreak = 0;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (completedDates.length > 0) {
            if (completedDates[0] === today || completedDates[0] === yesterday) {
                currentStreak = 1;
                let checkDate = new Date(completedDates[0]);
                for (let i = 1; i < completedDates.length; i++) {
                    const prevDate = new Date(checkDate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    if (completedDates[i] === prevDate.toDateString()) {
                        currentStreak++;
                        checkDate = prevDate;
                    } else {
                        break;
                    }
                }
            }
        }

        return { totalCompletedCount, currentStreak };
    }, [roadmaps]);

    // Initial fetch
    useEffect(() => {
        fetchRoadmaps();
    }, [fetchRoadmaps]);

    const activeProgress = activeRoadmap ? getProgress(activeRoadmap) : 0;
    const completedCount = activeRoadmap?.actions.filter(a => a.is_completed).length || 0;
    const totalCount = activeRoadmap?.actions.length || 0;

    return (
        <RoadmapContext.Provider
            value={{
                roadmaps,
                activeRoadmap,
                loading,
                error,
                activeProgress,
                completedCount,
                totalCount,
                globalCompletedCount: globalStats.totalCompletedCount,
                currentStreak: globalStats.currentStreak,
                fetchRoadmaps,
                createRoadmap,
                completeAction,
                uncompleteAction,
                refineAction,
                breakDownActionIntoSteps,
                updateRoadmapStatus,
                archiveRoadmap,
                deleteRoadmap,
                setActiveRoadmap,
                getProgress,
            }}
        >
            {children}
        </RoadmapContext.Provider>
    );
}

export function useRoadmap() {
    const context = useContext(RoadmapContext);
    if (context === undefined) {
        throw new Error('useRoadmap must be used within a RoadmapProvider');
    }
    return context;
}
