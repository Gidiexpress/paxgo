import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { useBoostStore } from '@/hooks/useBoostStore';
import { getBoostTypeLabel, PurchasedBoost, BoostProduct } from '@/types/boosts';

type LibraryItem = PurchasedBoost & { product: BoostProduct };

interface LibraryCardProps {
  item: LibraryItem;
  onPress: () => void;
  index: number;
}

function LibraryCard({ item, onPress, index }: LibraryCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const purchaseDate = new Date(item.purchasedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.cardTouchable}
      >
        <View style={styles.cardContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.cardIcon}>{item.product.icon}</Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            {/* Type badge */}
            <View style={styles.typeBadge}>
              <LinearGradient
                colors={[colors.champagneGold, colors.goldDark]}
                style={styles.typeBadgeGradient}
              >
                <Text style={styles.typeText}>{getBoostTypeLabel(item.product.type)}</Text>
              </LinearGradient>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.product.title}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {item.product.subtitle}
            </Text>

            {/* Meta */}
            <View style={styles.cardMeta}>
              <Text style={styles.metaText}>Purchased {purchaseDate}</Text>
              {!item.isRead && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
          </View>

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </View>

        {/* Progress indicator */}
        {item.content.actionItems && item.content.actionItems.length > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(item.content.actionItems.filter((a) => a.isCompleted).length / item.content.actionItems.length) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {item.content.actionItems.filter((a) => a.isCompleted).length}/
              {item.content.actionItems.length} actions completed
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading, getLibrary } = useBoostStore();

  const library = getLibrary();

  const handleCardPress = useCallback(
    (item: LibraryItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: '/library-reader',
        params: { boostId: item.boostId },
      });
    },
    [router]
  );

  const handleBrowseStore = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/boost-store');
  }, [router]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.champagneGold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Library</Text>
          <Text style={styles.headerSubtitle}>
            {library.length} {library.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <TouchableOpacity onPress={handleBrowseStore} style={styles.storeButton}>
          <Text style={styles.storeIcon}>🛍️</Text>
        </TouchableOpacity>
      </View>

      {library.length === 0 ? (
        // Empty state
        <Animated.View entering={FadeIn} style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>Your Library is Empty</Text>
          <Text style={styles.emptyText}>
            Purchase Boldness Boosts to add guides, itineraries, and roadmaps to your collection.
          </Text>
          <TouchableOpacity onPress={handleBrowseStore} style={styles.browseButton}>
            <LinearGradient
              colors={[colors.champagneGold, colors.goldDark]}
              style={styles.browseGradient}
            >
              <Text style={styles.browseText}>✨ Browse Boosts</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: insets.bottom + spacing['2xl'] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick stats */}
          <Animated.View entering={FadeInDown} style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{library.length}</Text>
              <Text style={styles.statLabel}>Total Guides</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {library.filter((l) => !l.isRead).length}
              </Text>
              <Text style={styles.statLabel}>Unread</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {library.reduce(
                  (acc, l) =>
                    acc +
                    (l.content.actionItems?.filter((a) => a.isCompleted).length || 0),
                  0
                )}
              </Text>
              <Text style={styles.statLabel}>Actions Done</Text>
            </View>
          </Animated.View>

          {/* Library items */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Guides</Text>
          </View>

          {library.map((item, index) => (
            <LibraryCard
              key={item.id}
              item={item}
              onPress={() => handleCardPress(item)}
              index={index}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.parchmentWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  backIcon: {
    fontSize: 20,
    color: colors.midnightNavy,
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
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  storeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  storeIcon: {
    fontSize: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing['2xl'],
  },
  browseButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.glow,
  },
  browseGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['3xl'],
  },
  browseText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.xs,
  },
  statValue: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.champagneGold,
  },
  statLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
  },
  cardTouchable: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardInfo: {
    flex: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  typeBadgeGradient: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  typeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.white,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  metaText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
  },
  newBadge: {
    backgroundColor: colors.boldTerracotta,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 9,
    color: colors.white,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  arrow: {
    fontSize: 16,
    color: colors.gray600,
  },
  progressSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray100,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.vibrantTeal,
    borderRadius: 2,
  },
  progressText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
});
