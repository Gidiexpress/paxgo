import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DreamSwitcher } from '@/components/DreamSwitcher';
import { NotificationPrePrompt } from '@/components/NotificationPrePrompt';
import { useUser, useOnboarding, useDreamProgress } from '@/hooks/useStorage';
import { useSubscription } from '@/hooks/useSubscription';
import { useDreams } from '@/hooks/useDreams';
import { useBoostStore } from '@/hooks/useBoostStore';
import { useNotifications } from '@/hooks/useNotifications';
import { stuckPoints } from '@/constants/stuckPoints';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user } = useUser();
  const { resetOnboarding } = useOnboarding();
  const { progress } = useDreamProgress();
  const { subscription, isPremium } = useSubscription();
  const { dreams, activeDreamId, switchDream } = useDreams();
  const { unreadCount } = useBoostStore();

  // Notification hook
  const {
    preferences: notificationPrefs,
    shouldShowPrePrompt,
    requestPermission,
    markPrePromptShown,
  } = useNotifications(progress?.currentStreak || 0);

  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  const stuckPoint = stuckPoints.find((s) => s.id === user?.stuckPoint);

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Profile',
      'This will clear your data and restart the onboarding. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await resetOnboarding();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const handleNewDream = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/new-dream');
  }, [router]);

  const handleSwitchDream = useCallback(
    async (dreamId: string) => {
      await switchDream(dreamId);
    },
    [switchDream]
  );

  const handleNotificationPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // If we should show the pre-prompt and haven't shown it yet, show it
    if (shouldShowPrePrompt) {
      setShowNotificationPrompt(true);
    } else {
      // Otherwise go directly to settings
      router.push('/notification-settings');
    }
  }, [shouldShowPrePrompt, router]);

  const handleNotificationEnable = useCallback(async () => {
    await markPrePromptShown();
    await requestPermission();
    setShowNotificationPrompt(false);
    // Navigate to settings regardless of permission result
    router.push('/notification-settings');
  }, [markPrePromptShown, requestPermission, router]);

  const handleNotificationDismiss = useCallback(async () => {
    await markPrePromptShown();
    setShowNotificationPrompt(false);
    // Still navigate to settings so they can configure later
    router.push('/notification-settings');
  }, [markPrePromptShown, router]);

  const menuItems = [
    {
      icon: '✨',
      title: 'Boldness Boosts',
      subtitle: 'Premium guides & roadmaps',
      onPress: () => router.push('/boost-store'),
      badge: unreadCount > 0 ? `${unreadCount} new` : undefined,
      isGold: true,
    },
    {
      icon: '📚',
      title: 'My Library',
      subtitle: 'Your purchased content',
      onPress: () => router.push('/library'),
    },
    {
      icon: '🗂️',
      title: 'The Archive',
      subtitle: isPremium ? 'Browse your full history' : '🔒 Premium',
      onPress: () => router.push('/archive'),
      isPremium: !isPremium,
    },
    {
      icon: '👯‍♀️',
      title: 'Hype Squads',
      subtitle: isPremium ? 'Your private cheer squad' : '🔒 Premium',
      onPress: () => router.push('/hype-squads'),
      isPremium: !isPremium,
    },
    {
      icon: '🌍',
      title: 'Hype Feed',
      subtitle: 'Community wins & cheers',
      onPress: () => router.push('/hype-feed'),
    },
    {
      icon: '🏅',
      title: 'All Achievements',
      subtitle: `${progress?.completedActions || 0} actions completed`,
      onPress: () => {},
    },
  ];

  const settingsItems = [
    {
      icon: '🔔',
      title: 'Notifications',
      subtitle: notificationPrefs.permissionStatus === 'granted'
        ? (notificationPrefs.enabled ? 'Enabled' : 'Disabled')
        : 'Tap to enable',
      onPress: handleNotificationPress,
    },
    {
      icon: '🎨',
      title: 'Appearance',
      onPress: () => {},
    },
    {
      icon: '🔒',
      title: 'Privacy',
      onPress: () => {},
    },
    {
      icon: '❓',
      title: 'Help & Support',
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View entering={FadeInDown} style={styles.headerCard}>
          <LinearGradient
            colors={[colors.midnightNavy, colors.navyLight]}
            style={styles.headerGradient}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.[0]?.toUpperCase() || '✨'}
                </Text>
              </View>
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>👑</Text>
                </View>
              )}
            </View>
            <Text style={styles.userName}>{user?.name || 'Bold Explorer'}</Text>
            <Badge
              label={isPremium ? 'Bold Adventurer' : 'The Seeker'}
              variant={isPremium ? 'gold' : 'default'}
              style={styles.tierBadge}
            />
          </LinearGradient>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{dreams.length}</Text>
              <Text style={styles.statLabel}>Dreams</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{progress?.completedActions || 0}</Text>
              <Text style={styles.statLabel}>Actions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{progress?.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </Animated.View>

        {/* Multi-Dream Management */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.dreamsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Dreams</Text>
            <TouchableOpacity onPress={handleNewDream} style={styles.addDreamButton}>
              <LinearGradient
                colors={[colors.champagneGold, colors.goldDark]}
                style={styles.addDreamGradient}
              >
                <Text style={styles.addDreamText}>+ New</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <DreamSwitcher
            dreams={dreams}
            activeDreamId={activeDreamId}
            onSwitchDream={handleSwitchDream}
            onNewDream={handleNewDream}
          />
        </Animated.View>

        {/* Upgrade Banner (for free users) */}
        {!isPremium && (
          <Animated.View entering={FadeInDown.delay(150)}>
            <TouchableOpacity
              onPress={() => router.push('/paywall')}
              activeOpacity={0.9}
            >
              <Card variant="premium" style={styles.upgradeCard}>
                <View style={styles.upgradeContent}>
                  <View style={styles.upgradeTextContainer}>
                    <Text style={styles.upgradeTitle}>Unlock Your Full Potential</Text>
                    <Text style={styles.upgradeSubtitle}>
                      Get unlimited AI coaching, 25% off boosts & more
                    </Text>
                  </View>
                  <View style={styles.upgradeArrow}>
                    <Text style={styles.upgradeArrowText}>→</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Menu Items */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.menuItem,
                item.isPremium && styles.menuItemPremium,
                item.isGold && styles.menuItemGold,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text
                    style={[
                      styles.menuSubtitle,
                      item.isPremium && styles.menuSubtitlePremium,
                      item.isGold && styles.menuSubtitleGold,
                    ]}
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                )}
              </View>
              {item.badge && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {settingsItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                )}
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Subscription Info */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.subscriptionSection}>
          <Card style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionTitle}>Subscription</Text>
              <Badge
                label={subscription.tier === 'seeker' ? 'Free' : 'Premium'}
                variant={subscription.tier === 'seeker' ? 'default' : 'gold'}
              />
            </View>
            <Text style={styles.subscriptionPlan}>
              {subscription.tier === 'seeker'
                ? 'The Seeker (Free)'
                : subscription.tier === 'bold-adventurer'
                ? 'The Bold Adventurer'
                : 'The 7-Day Sprint'}
            </Text>
            {subscription.expiresAt && (
              <Text style={styles.subscriptionExpiry}>
                Renews: {new Date(subscription.expiresAt).toLocaleDateString()}
              </Text>
            )}
            {isPremium ? (
              <TouchableOpacity style={styles.manageButton}>
                <Text style={styles.manageButtonText}>Manage Subscription</Text>
              </TouchableOpacity>
            ) : (
              <Button
                title="Upgrade Now"
                onPress={() => router.push('/paywall')}
                variant="primary"
                size="sm"
                style={styles.upgradeButton}
              />
            )}
          </Card>
        </Animated.View>

        {/* Reset & Logout */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.dangerZone}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetOnboarding}
          >
            <Text style={styles.resetButtonText}>Reset Profile & Start Over</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.appInfo}>
          <Text style={styles.appName}>The Bold Move</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>Make Your Move ✨</Text>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Notification Pre-Prompt Modal */}
      <NotificationPrePrompt
        visible={showNotificationPrompt}
        onAllow={handleNotificationEnable}
        onNotNow={handleNotificationDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  headerGradient: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.parchmentWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.midnightNavy,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.champagneGold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.midnightNavy,
  },
  premiumBadgeText: {
    fontSize: 14,
  },
  userName: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.white,
    marginBottom: spacing.sm,
  },
  tierBadge: {
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.boldTerracotta,
  },
  statLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.xs,
  },
  dreamsSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addDreamButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  addDreamGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addDreamText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  upgradeCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.warmCream,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeTextContainer: {
    flex: 1,
  },
  upgradeTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: 2,
  },
  upgradeSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  upgradeArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.champagneGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeArrowText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 18,
    color: colors.midnightNavy,
  },
  menuSection: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.lg,
    letterSpacing: -0.2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg + 2,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  menuItemPremium: {
    borderWidth: 1,
    borderColor: colors.champagneGold + '50',
    backgroundColor: colors.warmCream,
  },
  menuItemGold: {
    borderWidth: 1,
    borderColor: colors.champagneGold,
    backgroundColor: colors.champagneGold + '10',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  menuSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  menuSubtitlePremium: {
    color: colors.champagneGold,
  },
  menuSubtitleGold: {
    color: colors.goldDark,
  },
  menuBadge: {
    backgroundColor: colors.boldTerracotta,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  menuBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.white,
  },
  menuArrow: {
    fontFamily: typography.fontFamily.body,
    fontSize: 20,
    color: colors.gray400,
  },
  subscriptionSection: {
    marginBottom: spacing.xl,
  },
  subscriptionCard: {
    padding: spacing.lg,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subscriptionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  subscriptionPlan: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  subscriptionExpiry: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginBottom: spacing.md,
  },
  manageButton: {
    marginTop: spacing.sm,
  },
  manageButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
  },
  upgradeButton: {
    marginTop: spacing.sm,
  },
  dangerZone: {
    marginBottom: spacing.xl,
  },
  resetButton: {
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  resetButtonText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  appName: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
  },
  appVersion: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  appTagline: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
    marginTop: spacing.xs,
  },
});
