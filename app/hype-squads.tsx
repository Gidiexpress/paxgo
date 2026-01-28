import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSubscription } from '@/hooks/useSubscription';
import { HypeSquad, HypeSquadMember, HypeSquadActivity, CHEER_EMOJIS } from '@/types/community';

// Mock data
const MOCK_SQUAD: HypeSquad = {
  id: '1',
  name: 'Bold Besties',
  emoji: '💫',
  createdBy: 'user1',
  members: [
    {
      id: '1',
      name: 'You',
      avatarEmoji: '🦋',
      joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalActions: 23,
      currentStreak: 5,
      recentWin: 'Booked flight to Japan!',
    },
    {
      id: '2',
      name: 'Sarah',
      avatarEmoji: '🌸',
      joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      totalActions: 15,
      currentStreak: 3,
      recentWin: 'Updated resume',
    },
    {
      id: '3',
      name: 'Emily',
      avatarEmoji: '✨',
      joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      totalActions: 8,
      currentStreak: 2,
      recentWin: 'Started painting',
    },
  ],
  inviteCode: 'BOLD2024',
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
};

const MOCK_ACTIVITY: HypeSquadActivity[] = [
  {
    id: '1',
    squadId: '1',
    memberId: '2',
    memberName: 'Sarah',
    activityType: 'action_completed',
    description: 'completed "Update LinkedIn profile"',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    squadId: '1',
    memberId: '3',
    memberName: 'Emily',
    activityType: 'cheer_sent',
    description: 'sent you a cheer! 🙌',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    squadId: '1',
    memberId: '2',
    memberName: 'Sarah',
    activityType: 'streak_extended',
    description: 'reached a 3-day streak! 🔥',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

// Member Card Component
function MemberCard({ member, onCheer }: { member: HypeSquadMember; onCheer: () => void }) {
  return (
    <Card style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarEmoji}>{member.avatarEmoji}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          {member.currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {member.currentStreak} day streak</Text>
            </View>
          )}
        </View>
        <View style={styles.memberStats}>
          <Text style={styles.memberStatNumber}>{member.totalActions}</Text>
          <Text style={styles.memberStatLabel}>actions</Text>
        </View>
      </View>

      {member.recentWin && (
        <View style={styles.recentWin}>
          <Text style={styles.recentWinLabel}>Recent win:</Text>
          <Text style={styles.recentWinText}>{member.recentWin}</Text>
        </View>
      )}

      {member.id !== '1' && (
        <TouchableOpacity style={styles.cheerMemberButton} onPress={onCheer}>
          <Text style={styles.cheerMemberText}>Send Cheer 🙌</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

// Activity Item Component
function ActivityItem({ activity }: { activity: HypeSquadActivity }) {
  const getTimeAgo = () => {
    const diff = Date.now() - new Date(activity.createdAt).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getIcon = () => {
    switch (activity.activityType) {
      case 'action_completed':
        return '✅';
      case 'milestone_reached':
        return '🏆';
      case 'streak_extended':
        return '🔥';
      case 'cheer_sent':
        return '🙌';
      default:
        return '📣';
    }
  };

  return (
    <View style={styles.activityItem}>
      <Text style={styles.activityIcon}>{getIcon()}</Text>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.activityMember}>{activity.memberName}</Text>{' '}
          {activity.description}
        </Text>
        <Text style={styles.activityTime}>{getTimeAgo()}</Text>
      </View>
    </View>
  );
}

export default function HypeSquadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium } = useSubscription();

  const [squad, setSquad] = useState<HypeSquad | null>(MOCK_SQUAD);
  const [activity, setActivity] = useState(MOCK_ACTIVITY);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');

  // If not premium, show upgrade prompt
  if (!isPremium) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.midnightNavy, '#0A2540']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.premiumPrompt, { paddingTop: insets.top + spacing['3xl'] }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.premiumEmoji}>👯‍♀️</Text>
          <Text style={styles.premiumTitle}>Private Hype Squads</Text>
          <Text style={styles.premiumSubtitle}>
            Create a private group with your friends to cheer each other on and
            track progress together.
          </Text>

          <View style={styles.premiumFeatures}>
            <View style={styles.premiumFeature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Invite up to 5 friends</Text>
            </View>
            <View style={styles.premiumFeature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>See each other&apos;s progress</Text>
            </View>
            <View style={styles.premiumFeature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Send virtual cheers</Text>
            </View>
            <View style={styles.premiumFeature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Shared activity feed</Text>
            </View>
          </View>

          <Button
            title="Unlock with Bold Adventurer"
            onPress={() => router.push('/paywall')}
            variant="gold"
            size="lg"
            style={styles.upgradeButton}
          />
        </View>
      </View>
    );
  }

  const handleInvite = async () => {
    if (!squad) return;

    try {
      await Share.share({
        message: `Join my Hype Squad "${squad.name}" on Paxgo! Use invite code: ${squad.inviteCode}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSendCheer = (memberName: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      '🙌 Cheer Sent!',
      `${memberName} will be notified of your support!`,
      [{ text: 'OK' }]
    );
  };

  const handleCreateSquad = () => {
    if (!newSquadName.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In real app, this would create a squad in backend
    setShowCreateModal(false);
    setNewSquadName('');
    Alert.alert('Squad Created!', 'Share your invite code with friends.');
  };

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
          <Text style={styles.headerTitle}>Hype Squads</Text>
          <Badge variant="premium" label="Premium" />
        </View>
        <TouchableOpacity onPress={handleInvite} style={styles.inviteButton}>
          <Text style={styles.inviteIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {squad ? (
          <>
            {/* Squad Header */}
            <Animated.View entering={FadeIn}>
              <Card variant="premium" style={styles.squadHeader}>
                <View style={styles.squadInfo}>
                  <Text style={styles.squadEmoji}>{squad.emoji}</Text>
                  <View>
                    <Text style={styles.squadName}>{squad.name}</Text>
                    <Text style={styles.squadMembers}>
                      {squad.members.length} members
                    </Text>
                  </View>
                </View>

                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCodeLabel}>Invite Code</Text>
                  <TouchableOpacity
                    style={styles.inviteCodeBadge}
                    onPress={handleInvite}
                  >
                    <Text style={styles.inviteCode}>{squad.inviteCode}</Text>
                    <Text style={styles.copyIcon}>📋</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </Animated.View>

            {/* Squad Activity */}
            <Animated.View entering={FadeInDown.delay(100)}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Card style={styles.activityCard}>
                {activity.map((item, index) => (
                  <ActivityItem key={item.id} activity={item} />
                ))}
              </Card>
            </Animated.View>

            {/* Squad Members */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <Text style={styles.sectionTitle}>Squad Members</Text>
              {squad.members.map((member, index) => (
                <Animated.View key={member.id} entering={FadeInDown.delay(250 + index * 50)}>
                  <MemberCard
                    member={member}
                    onCheer={() => handleSendCheer(member.name)}
                  />
                </Animated.View>
              ))}
            </Animated.View>
          </>
        ) : (
          /* No Squad - Create One */
          <Animated.View entering={FadeIn} style={styles.noSquadContainer}>
            <Text style={styles.noSquadEmoji}>👯‍♀️</Text>
            <Text style={styles.noSquadTitle}>Create Your Hype Squad</Text>
            <Text style={styles.noSquadText}>
              Invite your friends to cheer each other on and celebrate wins
              together!
            </Text>

            <TextInput
              style={styles.squadNameInput}
              placeholder="Squad Name (e.g., Bold Besties)"
              placeholderTextColor={colors.gray400}
              value={newSquadName}
              onChangeText={setNewSquadName}
            />

            <Button
              title="Create Squad"
              onPress={handleCreateSquad}
              variant="primary"
              size="lg"
              style={styles.createButton}
              disabled={!newSquadName.trim()}
            />

            <Text style={styles.orText}>— or —</Text>

            <Button
              title="Join with Invite Code"
              onPress={() => Alert.alert('Enter Code', 'Feature coming soon!')}
              variant="outline"
              size="md"
            />
          </Animated.View>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
  },
  inviteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.boldTerracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteIcon: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '300',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  squadHeader: {
    marginBottom: spacing.xl,
  },
  squadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  squadEmoji: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  squadName: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
  },
  squadMembers: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  inviteCodeContainer: {
    backgroundColor: colors.warmCream,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  inviteCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inviteCode: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.champagneGold,
    letterSpacing: 2,
  },
  copyIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.md,
  },
  activityCard: {
    marginBottom: spacing.xl,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  activityIcon: {
    fontSize: 18,
    marginRight: spacing.md,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
  },
  activityMember: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.midnightNavy,
  },
  activityTime: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    marginTop: 2,
  },
  memberCard: {
    marginBottom: spacing.md,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  memberAvatarEmoji: {
    fontSize: 24,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  streakBadge: {
    backgroundColor: colors.boldTerracotta + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  streakText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.boldTerracotta,
  },
  memberStats: {
    alignItems: 'flex-end',
  },
  memberStatNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.champagneGold,
  },
  memberStatLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  recentWin: {
    backgroundColor: colors.warmCream,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  recentWinLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginBottom: 2,
  },
  recentWinText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
  },
  cheerMemberButton: {
    backgroundColor: colors.vibrantTeal + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cheerMemberText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.vibrantTeal,
  },
  // No squad state
  noSquadContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  noSquadEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  noSquadTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    marginBottom: spacing.sm,
  },
  noSquadText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  squadNameInput: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  createButton: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  orText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginBottom: spacing.lg,
  },
  // Premium prompt styles
  premiumPrompt: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.white,
    fontSize: 16,
  },
  premiumEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
    marginTop: spacing['4xl'],
  },
  premiumTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  premiumSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  premiumFeatures: {
    width: '100%',
    marginBottom: spacing['2xl'],
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.vibrantTeal,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: spacing.md,
    fontWeight: 'bold',
    fontSize: 14,
  },
  featureText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  upgradeButton: {
    width: '100%',
  },
});
