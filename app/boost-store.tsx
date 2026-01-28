import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { useBoostStore } from '@/hooks/useBoostStore';
import {
  BoostProduct,
  BoostCategory,
  getBoostTypeLabel,
  getBoostCategoryIcon,
} from '@/types/boosts';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.xl * 2 - spacing.md) / 2;

const CATEGORIES: { id: BoostCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'career', label: 'Career', icon: '🚀' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'wellness', label: 'Wellness', icon: '🧘' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
];

interface BoostCardProps {
  boost: BoostProduct;
  isPremium: boolean;
  onPress: () => void;
  index: number;
}

function BoostCard({ boost, isPremium, onPress, index }: BoostCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const displayPrice = isPremium ? boost.premiumPrice : boost.basePrice;
  const savings = isPremium ? Math.round((1 - boost.premiumPrice / boost.basePrice) * 100) : 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={[styles.cardWrapper, animatedStyle]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.cardTouchable}
      >
        {/* Organic texture background */}
        <View style={styles.cardBackground}>
          <LinearGradient
            colors={[colors.parchmentWhite, colors.warmCream]}
            style={StyleSheet.absoluteFill}
          />
          {/* Subtle texture overlay */}
          <View style={styles.textureOverlay} />
        </View>

        {/* Premium badge for subscribers */}
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>-{savings}%</Text>
          </View>
        )}

        {/* Purchased indicator */}
        {boost.isPurchased && (
          <View style={styles.purchasedBadge}>
            <Text style={styles.purchasedBadgeText}>✓</Text>
          </View>
        )}

        {/* Icon area */}
        <View style={styles.iconContainer}>
          <Text style={styles.boostIcon}>{boost.icon}</Text>
        </View>

        {/* Type label */}
        <View style={styles.typeContainer}>
          <LinearGradient
            colors={[colors.champagneGold, colors.goldDark]}
            style={styles.typeBadge}
          >
            <Text style={styles.typeText}>{getBoostTypeLabel(boost.type)}</Text>
          </LinearGradient>
        </View>

        {/* Content */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {boost.title}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {boost.subtitle}
        </Text>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {boost.tags.slice(0, 2).map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          {isPremium && (
            <Text style={styles.originalPrice}>${boost.basePrice.toFixed(2)}</Text>
          )}
          <Text style={[styles.price, boost.isPurchased && styles.priceOwned]}>
            {boost.isPurchased ? 'Owned' : `$${displayPrice.toFixed(2)}`}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function BoostStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading, isPremium, getAvailableBoosts, unreadCount } = useBoostStore();

  const [selectedCategory, setSelectedCategory] = useState<BoostCategory | 'all'>('all');

  const boosts = getAvailableBoosts();
  const filteredBoosts =
    selectedCategory === 'all'
      ? boosts
      : boosts.filter((b) => b.category === selectedCategory);

  const handleCategorySelect = useCallback((category: BoostCategory | 'all') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  }, []);

  const handleBoostPress = useCallback(
    (boost: BoostProduct) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({
        pathname: '/boost-detail',
        params: { boostId: boost.id },
      });
    },
    [router]
  );

  const handleLibraryPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/library');
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
          <Text style={styles.headerTitle}>Boldness Boosts</Text>
          <View style={styles.headerBadge}>
            <LinearGradient
              colors={[colors.champagneGold, colors.goldDark]}
              style={styles.headerBadgeGradient}
            >
              <Text style={styles.headerBadgeText}>✨ Premium Content</Text>
            </LinearGradient>
          </View>
        </View>

        <TouchableOpacity onPress={handleLibraryPress} style={styles.libraryButton}>
          <Text style={styles.libraryIcon}>📚</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Premium subscriber banner */}
      {isPremium && (
        <Animated.View entering={FadeIn} style={styles.premiumBanner}>
          <LinearGradient
            colors={[colors.champagneGold + '20', colors.goldLight + '10']}
            style={styles.premiumBannerGradient}
          >
            <Text style={styles.premiumBannerIcon}>👑</Text>
            <View style={styles.premiumBannerText}>
              <Text style={styles.premiumBannerTitle}>Bold Adventurer Discount</Text>
              <Text style={styles.premiumBannerSubtitle}>
                You get 25% off all boosts!
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categoriesScroll}
      >
        {CATEGORIES.map((category, index) => (
          <Animated.View key={category.id} entering={FadeInRight.delay(index * 50)}>
            <TouchableOpacity
              onPress={() => handleCategorySelect(category.id)}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
              ]}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.id && styles.categoryLabelActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Boost Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all'
              ? 'All Boosts'
              : `${getBoostCategoryIcon(selectedCategory)} ${CATEGORIES.find((c) => c.id === selectedCategory)?.label} Boosts`}
          </Text>
          <Text style={styles.sectionCount}>{filteredBoosts.length} available</Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {filteredBoosts.map((boost, index) => (
            <BoostCard
              key={boost.id}
              boost={boost}
              isPremium={isPremium}
              onPress={() => handleBoostPress(boost)}
              index={index}
            />
          ))}
        </View>

        {/* Bottom padding */}
        <View style={{ height: insets.bottom + spacing['4xl'] }} />
      </ScrollView>
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
    paddingBottom: spacing.md,
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
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
  },
  headerBadge: {
    marginTop: spacing.xs,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  headerBadgeGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.white,
  },
  libraryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  libraryIcon: {
    fontSize: 18,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.boldTerracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.white,
  },
  premiumBanner: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.champagneGold + '40',
  },
  premiumBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  premiumBannerIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  premiumBannerText: {
    flex: 1,
  },
  premiumBannerTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.goldDark,
  },
  premiumBannerSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    marginTop: 2,
  },
  categoriesScroll: {
    maxHeight: 60,
    marginTop: spacing.md,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: colors.midnightNavy,
    borderColor: colors.midnightNavy,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  categoryLabelActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
    marginTop: spacing.md,
  },
  gridContainer: {
    paddingHorizontal: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
  },
  sectionCount: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  cardTouchable: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.white,
    ...shadows.md,
  },
  cardBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.warmCream,
    opacity: 0.3,
  },
  premiumBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.champagneGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    zIndex: 1,
  },
  premiumBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.white,
  },
  purchasedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.vibrantTeal,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  purchasedBadgeText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
  },
  iconContainer: {
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
  },
  boostIcon: {
    fontSize: 48,
  },
  typeContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  typeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  typeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  cardSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  tag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontFamily: typography.fontFamily.body,
    fontSize: 10,
    color: colors.gray600,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  originalPrice: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    textDecorationLine: 'line-through',
  },
  price: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.champagneGold,
  },
  priceOwned: {
    color: colors.vibrantTeal,
  },
});
