import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { HypeFeedItem, MOCK_HYPE_FEED, CHEER_EMOJIS } from '@/types/community';
import { useHypeFeed } from '@/contexts/HypeFeedContext';

// Hype Feed Item Card
interface HypeFeedCardProps {
  item: HypeFeedItem;
  onCheer: (id: string) => void;
  index: number;
}

function HypeFeedCard({ item, onCheer, index }: HypeFeedCardProps) {
  const [cheered, setCheered] = useState(item.hasCheered || false);
  const cheerScale = useSharedValue(1);

  // Sync with item updates
  useEffect(() => {
    if (item.hasCheered !== undefined) {
      setCheered(item.hasCheered);
    }
  }, [item.hasCheered]);

  const handleCheer = useCallback(() => {
    if (cheered) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate button
    cheerScale.value = withSequence(
      withSpring(1.4, { damping: 4 }),
      withSpring(1, { damping: 8 })
    );

    // Optimistic update locally (context also updates)
    setCheered(true);
    onCheer(item.id);
  }, [cheered, item.id, onCheer]);

  const cheerButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cheerScale.value }],
  }));

  const getWinIcon = () => {
    switch (item.winType) {
      case 'milestone':
        return '🏆';
      case 'streak':
        return '🔥';
      case 'proof':
        return '📸';
      default:
        return '✓';
    }
  };

  const getTimeAgo = () => {
    const diff = Date.now() - new Date(item.createdAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <Card style={styles.feedCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>{item.avatarEmoji}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.anonymousLabel}>A Bold Woman</Text>
            <Text style={styles.categoryLabel}>{item.dreamCategory} Journey</Text>
          </View>
          <Text style={styles.timeAgo}>{getTimeAgo()}</Text>
        </View>

        {/* Win Content */}
        <View style={styles.winContent}>
          <View style={styles.winIconContainer}>
            <Text style={styles.winIcon}>{getWinIcon()}</Text>
          </View>
          <View style={styles.winTextContainer}>
            <Text style={styles.winTitle}>{item.winTitle}</Text>
            {item.winDescription && (
              <Text style={styles.winDescription}>{item.winDescription}</Text>
            )}
            {!!item.streakCount && item.streakCount > 0 && (
              <Badge variant="gold" label={`${item.streakCount} days in a row!`} />
            )}
            {!!item.actionCount && item.actionCount > 0 && (
              <Badge variant="default" label={`${item.actionCount} actions`} />
            )}
          </View>
        </View>

        {/* Footer - Cheers */}
        <View style={styles.cardFooter}>
          <Animated.View style={cheerButtonStyle}>
            <TouchableOpacity
              style={[styles.cheerButton, cheered && styles.cheerButtonActive]}
              onPress={handleCheer}
              disabled={cheered}
            >
              <Text style={styles.cheerEmoji}>🙌</Text>
              <Text
                style={[styles.cheerText, cheered && styles.cheerTextActive]}
              >
                {cheered ? 'Cheered!' : 'Send Cheer'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.cheerCount}>
            <Text style={styles.cheerCountNumber}>{item.cheersCount}</Text>
            <Text style={styles.cheerCountLabel}>cheers</Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

export default function HypeFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { feedItems, cheerItem, addToFeed } = useHypeFeed();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newWinText, setNewWinText] = useState('');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const handlePostWin = () => {
    if (!newWinText.trim()) return;

    addToFeed({
      avatarEmoji: '✨', // Default emoji for manual entry
      dreamCategory: 'General',
      winType: 'action',
      winTitle: 'Shared a value win!',
      winDescription: newWinText,
      streakCount: 0,
      actionCount: 0,
    });

    setNewWinText('');
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCheer = useCallback((id: string) => {
    cheerItem(id);
    // In a real app, this would send to backend
    console.log('Cheered item:', id);
  }, [cheerItem]);

  const renderItem = useCallback(
    ({ item, index }: { item: HypeFeedItem; index: number }) => (
      <HypeFeedCard item={item} onCheer={handleCheer} index={index} />
    ),
    [handleCheer]
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hype Feed</Text>
          <Text style={styles.headerSubtitle}>Community Wins</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Introduction Card */}
      <Animated.View entering={FadeIn} style={styles.introContainer}>
        <LinearGradient
          colors={[colors.vibrantTeal, colors.tealDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.introCard}
        >
          <Text style={styles.introEmoji}>✨</Text>
          <Text style={styles.introTitle}>Witness the Bold Moves</Text>
          <Text style={styles.introText}>
            Anonymous wins from women around the world. Send cheers to lift each
            other up!
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Feed */}
      <FlatList
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.feedContent,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.boldTerracotta}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyText}>No wins yet today</Text>
            <Text style={styles.emptySubtext}>
              Be the first to share your bold move!
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + spacing.xl }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.boldTerracotta, colors.terracottaDark]}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Win Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Celebrate a Win 🎉</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>What did you accomplish today?</Text>

            <TextInput
              style={styles.input}
              placeholder="I just completed my..."
              placeholderTextColor={colors.gray400}
              multiline
              maxLength={140}
              value={newWinText}
              onChangeText={setNewWinText}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.postButton, !newWinText.trim() && styles.postButtonDisabled]}
              onPress={handlePostWin}
              disabled={!newWinText.trim()}
            >
              <Text style={styles.postButtonText}>Post to Hype Feed</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: colors.midnightNavy,
    fontWeight: '300',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  headerRight: {
    width: 40,
  },
  introContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  introCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  introEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  introTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  introText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  feedContent: {
    paddingHorizontal: spacing.lg,
  },
  feedCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  headerInfo: {
    flex: 1,
  },
  anonymousLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  categoryLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  timeAgo: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
  },
  winContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
  },
  winIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldLight + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  winIcon: {
    fontSize: 18,
  },
  winTextContainer: {
    flex: 1,
  },
  winTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
  },
  winDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  cheerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmCream,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  cheerButtonActive: {
    backgroundColor: colors.vibrantTeal + '20',
  },
  cheerEmoji: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  cheerText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
  },
  cheerTextActive: {
    color: colors.vibrantTeal,
  },
  cheerCount: {
    alignItems: 'flex-end',
  },
  cheerCountNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.champagneGold,
  },
  cheerCountLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    ...shadows.lg,
    zIndex: 100,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: colors.white,
    marginTop: -2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.parchmentWhite,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
    ...shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
  },
  closeIcon: {
    fontSize: 20,
    color: colors.gray500,
    padding: spacing.xs,
  },
  modalSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  postButton: {
    backgroundColor: colors.boldTerracotta,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  postButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
});
