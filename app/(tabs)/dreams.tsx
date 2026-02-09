import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Plus, Trophy, ChevronRight, Target, Sparkles } from 'lucide-react-native';
import {
    colors,
    spacing,
    borderRadius,
    typography,
    shadows,
} from '@/constants/theme';
import { useAuth } from '@fastshot/auth';
import { supabase } from '@/lib/supabase';

// Dream type for display
interface DreamItem {
    id: string;
    title: string;
    category: string;
    is_active: boolean;
    created_at: string;
    roadmap?: {
        id: string;
        title: string;
        status: string;
        total_actions: number;
        completed_actions: number;
    };
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
    career: '💼',
    travel: '✈️',
    finance: '💰',
    creative: '🎨',
    wellness: '🌿',
    'personal-growth': '🌱',
    default: '✨',
};

export default function DreamsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const [dreams, setDreams] = useState<DreamItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDreams = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Fetch dreams from the database
            const { data: dreamsData, error: dreamsError } = await supabase
                .from('dreams')
                .select('id, title, category, is_active, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (dreamsError) throw dreamsError;

            // For each dream, fetch its roadmap info
            const dreamsWithRoadmaps = await Promise.all(
                (dreamsData || []).map(async (dream) => {
                    const { data: roadmapData } = await supabase
                        .from('action_roadmaps')
                        .select('id, title, status')
                        .eq('user_id', user.id)
                        .eq('is_active', true)
                        .maybeSingle();

                    let roadmapInfo = null;
                    if (roadmapData) {
                        // Count actions
                        const { count: totalActions } = await supabase
                            .from('roadmap_actions')
                            .select('id', { count: 'exact', head: true })
                            .eq('roadmap_id', roadmapData.id)
                            .is('parent_action_id', null);

                        const { count: completedActions } = await supabase
                            .from('roadmap_actions')
                            .select('id', { count: 'exact', head: true })
                            .eq('roadmap_id', roadmapData.id)
                            .is('parent_action_id', null)
                            .eq('is_completed', true);

                        roadmapInfo = {
                            id: roadmapData.id,
                            title: roadmapData.title, // Map roadmap_title to title
                            status: roadmapData.status,
                            total_actions: totalActions || 0,
                            completed_actions: completedActions || 0,
                        };
                    }

                    return {
                        ...dream,
                        is_active: !!dream.is_active, // Ensure boolean
                        category: dream.category || 'default', // Handle null category
                        created_at: dream.created_at || new Date().toISOString(), // Handle null date
                        roadmap: roadmapInfo,
                    } as DreamItem;
                })
            );

            setDreams(dreamsWithRoadmaps);
        } catch (error) {
            console.error('Error fetching dreams:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchDreams();
    }, [fetchDreams]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDreams();
        setRefreshing(false);
    }, [fetchDreams]);

    const handleNewDream = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navigate to onboarding flow for new dream
        router.push('/journey/stuck-point');
    };

    const handleDreamPress = async (dream: DreamItem) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (dream.is_active) {
            // Already active, go to wins for this dream
            router.push('/(tabs)/wins');
        } else {
            // Switch to this dream
            await switchToDream(dream.id);
        }
    };

    const switchToDream = async (dreamId: string) => {
        if (!user?.id) return;

        try {
            // Deactivate all dreams
            await supabase
                .from('dreams')
                .update({ is_active: false })
                .eq('user_id', user.id);

            // Activate the selected dream
            await supabase
                .from('dreams')
                .update({ is_active: true })
                .eq('id', dreamId);

            // Refresh the list
            await fetchDreams();

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Navigate to home (action tab) to see the new roadmap
            router.push('/(tabs)/action');
        } catch (error) {
            console.error('Error switching dream:', error);
        }
    };

    const handleViewWins = async (dream: DreamItem) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/wins');
    };

    const getProgressPercentage = (dream: DreamItem) => {
        if (!dream.roadmap || dream.roadmap.total_actions === 0) return 0;
        return Math.round((dream.roadmap.completed_actions / dream.roadmap.total_actions) * 100);
    };

    const renderDreamCard = (dream: DreamItem, index: number) => {
        const icon = CATEGORY_ICONS[dream.category] || CATEGORY_ICONS.default;
        const progress = getProgressPercentage(dream);
        const isActive = dream.is_active;

        return (
            <Animated.View
                key={dream.id}
                entering={FadeInUp.delay(index * 80).duration(400)}
            >
                <TouchableOpacity
                    style={[styles.dreamCard, isActive && styles.dreamCardActive]}
                    onPress={() => handleDreamPress(dream)}
                    activeOpacity={0.7}
                >
                    {isActive && (
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>ACTIVE</Text>
                        </View>
                    )}

                    <View style={styles.dreamHeader}>
                        <Text style={styles.dreamIcon}>{icon}</Text>
                        <View style={styles.dreamInfo}>
                            <Text style={styles.dreamTitle} numberOfLines={2}>
                                {dream.title}
                            </Text>
                            <Text style={styles.dreamCategory}>
                                {dream.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Text>
                        </View>
                        <ChevronRight size={20} color={colors.gray400} />
                    </View>

                    {dream.roadmap && (
                        <View style={styles.progressSection}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${progress}%` }]} />
                            </View>
                            <Text style={styles.progressText}>
                                {dream.roadmap.completed_actions}/{dream.roadmap.total_actions} actions • {progress}%
                            </Text>
                        </View>
                    )}

                    <View style={styles.dreamActions}>
                        {isActive ? (
                            <TouchableOpacity
                                style={styles.viewWinsButton}
                                onPress={() => handleViewWins(dream)}
                            >
                                <Trophy size={16} color={colors.champagneGold} />
                                <Text style={styles.viewWinsText}>View Wins</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.resumeButton}
                                onPress={() => switchToDream(dream.id)}
                            >
                                <Target size={16} color={colors.vibrantTeal} />
                                <Text style={styles.resumeText}>Resume This Dream</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.boldTerracotta} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[colors.midnightNavy, colors.navyLight]}
                style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
            >
                <View style={styles.headerContent}>
                    <Sparkles size={28} color={colors.champagneGold} />
                    <Text style={styles.headerTitle}>Your Dreams</Text>
                </View>
                <Text style={styles.headerSubtitle}>
                    {dreams.length} dream{dreams.length !== 1 ? 's' : ''} on your journey
                </Text>
            </LinearGradient>

            {/* Dreams List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 100 },
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.boldTerracotta}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {dreams.length === 0 ? (
                    <Animated.View entering={FadeInUp} style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>✨</Text>
                        <Text style={styles.emptyTitle}>No dreams yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Tap the + button to start your first dream journey
                        </Text>
                    </Animated.View>
                ) : (
                    dreams.map((dream, index) => renderDreamCard(dream, index))
                )}
            </ScrollView>

            {/* Floating Action Button */}
            <Animated.View
                entering={FadeInDown.delay(300).duration(400)}
                style={[styles.fabContainer, { bottom: insets.bottom + 24 }]}
            >
                <TouchableOpacity
                    style={styles.fab}
                    onPress={handleNewDream}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[colors.boldTerracotta, colors.terracottaDark]}
                        style={styles.fabGradient}
                    >
                        <Plus size={28} color={colors.parchmentWhite} strokeWidth={2.5} />
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.fabLabel}>New Dream</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.parchmentWhite,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.xs,
    },
    headerTitle: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize['2xl'],
        color: colors.parchmentWhite,
    },
    headerSubtitle: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        color: colors.gray300,
        marginLeft: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    dreamCard: {
        backgroundColor: colors.parchmentWhite,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.gray200,
        ...shadows.md,
    },
    dreamCardActive: {
        borderColor: colors.vibrantTeal,
        borderWidth: 2,
    },
    activeBadge: {
        position: 'absolute',
        top: -8,
        right: spacing.md,
        backgroundColor: colors.vibrantTeal,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
    },
    activeBadgeText: {
        fontFamily: typography.fontFamily.bodySemiBold,
        fontSize: 10,
        color: colors.parchmentWhite,
        letterSpacing: 1,
    },
    dreamHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    dreamIcon: {
        fontSize: 32,
    },
    dreamInfo: {
        flex: 1,
    },
    dreamTitle: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.lg,
        color: colors.midnightNavy,
        marginBottom: 2,
    },
    dreamCategory: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        color: colors.gray500,
    },
    progressSection: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
    },
    progressBar: {
        height: 6,
        backgroundColor: colors.gray100,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.vibrantTeal,
        borderRadius: 3,
    },
    progressText: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.xs,
        color: colors.gray500,
    },
    dreamActions: {
        marginTop: spacing.md,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    viewWinsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.goldLight + '30',
        borderRadius: borderRadius.lg,
    },
    viewWinsText: {
        fontFamily: typography.fontFamily.bodySemiBold,
        fontSize: typography.fontSize.sm,
        color: colors.champagneGold,
    },
    resumeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.vibrantTeal + '15',
        borderRadius: borderRadius.lg,
    },
    resumeText: {
        fontFamily: typography.fontFamily.bodySemiBold,
        fontSize: typography.fontSize.sm,
        color: colors.vibrantTeal,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['3xl'],
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.xl,
        color: colors.midnightNavy,
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.base,
        color: colors.gray500,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
    fabContainer: {
        position: 'absolute',
        right: spacing.xl,
        alignItems: 'center',
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        ...shadows.lg,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabLabel: {
        fontFamily: typography.fontFamily.bodySemiBold,
        fontSize: typography.fontSize.xs,
        color: colors.boldTerracotta,
        marginTop: spacing.xs,
    },
});
