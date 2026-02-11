import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ActionCard } from '../ActionCard';
import { RoadmapAction } from '@/types/database';

interface RoadmapActionCardProps {
    action: RoadmapAction;
    index: number;
    onComplete: (id: string) => void;
    onPress: (action: RoadmapAction) => void;
    animationDelay: number;
    hasProof?: boolean;
    isLocked?: boolean;
}

export function RoadmapActionCard({
    action,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    index,
    onComplete,
    onPress,
    animationDelay,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasProof,
    isLocked,
}: RoadmapActionCardProps) {
    // Map RoadmapAction (database) to MicroAction (frontend)
    const mappedAction = {
        id: action.id,
        title: action.title,
        description: action.description || '',
        duration: action.duration_minutes || 15,
        isPremium: false, // Roadmap actions are part of the roadmap
        isCompleted: !!action.is_completed,
        completedAt: action.completed_at || undefined,
        category: action.category || 'action',
        dreamId: action.roadmap_id,
    };

    return (
        <Animated.View entering={FadeInDown.delay(animationDelay).springify()}>
            <ActionCard
                action={mappedAction}
                onComplete={onComplete}
                onPress={() => onPress(action)}
                isLocked={isLocked}
            />
        </Animated.View>
    );
}
