import React from 'react';
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
import { useUser, useOnboarding, useDreamProgress } from '@/hooks/useStorage';
import { useSubscription } from '@/hooks/useSubscription';
import { stuckPoints } from '@/constants/stuckPoints';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user } = useUser();
  const { resetOnboarding } = useOnboarding();
  const { progress } = useDreamProgress();
  const { subscription, isPremium } = useSubscription();

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

  const menuItems = [
    {
      icon: '🎯',
      title: 'My Dream',
      subtitle: user?.dream || 'Not set',
      onPress: () => {},
    },
    {
      icon: '💫',
      title: 'Stuck Point',
      subtitle: stuckPoint?.title || 'Not set',
      onPress: () => {},
    },
    {
      icon: '📜',
      title: 'Permission Slips',
      subtitle: 'View your collection',
      onPress: () => {},
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
      onPress: () => {},
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
              <Text style={styles.statNumber}>{progress?.completedActions || 0}</Text>
              <Text style={styles.statLabel}>Actions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{progress?.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{progress?.longestStreak || 0}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>
        </Animated.View>

        {/* Upgrade Banner (for free users) */}
        {!isPremium && (
          <Animated.View entering={FadeInDown.delay(100)}>
            <TouchableOpacity
              onPress={() => router.push('/paywall')}
              activeOpacity={0.9}
            >
              <Card variant="premium" style={styles.upgradeCard}>
                <View style={styles.upgradeContent}>
                  <View style={styles.upgradeTextContainer}>
                    <Text style={styles.upgradeTitle}>Unlock Your Full Potential</Text>
                    <Text style={styles.upgradeSubtitle}>
                      Get unlimited AI coaching and premium features
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
          {menuItems.map((item, index) => (
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
                  <Text style={styles.menuSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
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
          <Text style={styles.appName}>Paxgo</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>From Dreaming to Doing ✨</Text>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingHorizontal: spacing.lg,
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
    paddingHorizontal: spacing.lg,
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
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    ...shadows.sm,
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
