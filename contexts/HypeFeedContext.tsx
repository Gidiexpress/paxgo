import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { HypeFeedItem, MOCK_HYPE_FEED } from '@/types/community';

interface HypeFeedContextType {
    feedItems: HypeFeedItem[];
    addToFeed: (item: Omit<HypeFeedItem, 'id' | 'createdAt' | 'cheersCount' | 'hasCheered'>) => void;
    cheerItem: (id: string) => void;
}

const HypeFeedContext = createContext<HypeFeedContextType | undefined>(undefined);

export function HypeFeedProvider({ children }: { children: ReactNode }) {
    const [feedItems, setFeedItems] = useState<HypeFeedItem[]>(MOCK_HYPE_FEED);

    const addToFeed = useCallback((newItem: Omit<HypeFeedItem, 'id' | 'createdAt' | 'cheersCount' | 'hasCheered'>) => {
        const item: HypeFeedItem = {
            ...newItem,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            cheersCount: 0,
            hasCheered: false,
        };

        // Add to top of feed
        setFeedItems(prev => [item, ...prev]);
    }, []);

    const cheerItem = useCallback((id: string) => {
        setFeedItems(prev => prev.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    cheersCount: item.cheersCount + 1,
                    hasCheered: true,
                };
            }
            return item;
        }));
    }, []);

    return (
        <HypeFeedContext.Provider value={{ feedItems, addToFeed, cheerItem }}>
            {children}
        </HypeFeedContext.Provider>
    );
}

export function useHypeFeed() {
    const context = useContext(HypeFeedContext);
    if (context === undefined) {
        throw new Error('useHypeFeed must be used within a HypeFeedProvider');
    }
    return context;
}
