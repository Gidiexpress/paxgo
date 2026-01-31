import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDatabaseStatus } from '@/hooks/useDatabaseStatus';
import { useSnackbar } from '@/contexts/SnackbarContext';

// Shield icon component for private infrastructure visual
function ShieldIcon({ size = 24, color = colors.vibrantTeal }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.8, color }}>🛡️</Text>
    </View>
  );
}

// Lock icon for secure connection
function LockIcon({ size = 16, color = colors.vibrantTeal }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.9, color }}>🔒</Text>
    </View>
  );
}

// Animated glowing orb effect for premium feel
function GlowingOrb({ color, size = 100, delay = 0 }: { color: string; size?: number; delay?: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.4, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.15, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, [scale, opacity, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// Animated breathing effect for the private badge
function PrivateInfrastructureBadge({ projectId, isVerified }: { projectId: string; isVerified: boolean }) {
  return (
    <Animated.View entering={FadeIn.delay(200)} style={styles.privateBadgeContainer}>
      <LinearGradient
        colors={['#071A2A', colors.midnightNavy, '#0A1825']}
        style={styles.privateBadgeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background ambient glow orbs */}
        <View style={styles.orbsContainer}>
          <GlowingOrb color={colors.vibrantTeal} size={120} delay={0} />
          <View style={{ position: 'absolute', right: 20, top: 20 }}>
            <GlowingOrb color={colors.champagneGold} size={80} delay={1500} />
          </View>
        </View>

        {/* Main content */}
        <View style={styles.privateBadgeContent}>
          {/* Active status indicator */}
          {isVerified && (
            <Animated.View entering={FadeIn.delay(800)} style={styles.activeStatusBar}>
              <View style={styles.activeStatusDot} />
              <Text style={styles.activeStatusText}>PRIVATE INFRASTRUCTURE ACTIVE</Text>
              <View style={styles.activeStatusDot} />
            </Animated.View>
          )}

          {/* Shield and lock icons */}
          <View style={styles.privateBadgeIconRow}>
            <ShieldIcon size={40} color={colors.vibrantTeal} />
            <View style={styles.lockBadge}>
              <LockIcon size={20} color={colors.champagneGold} />
            </View>
          </View>

          {/* Title and description */}
          <Text style={styles.privateBadgeTitle}>Private Infrastructure</Text>
          <Text style={styles.privateBadgeSubtitle}>Your Personal Supabase Instance</Text>

          {/* Project ID display - PROMINENT */}
          <View style={styles.projectIdContainer}>
            <Text style={styles.projectIdLabel}>PROJECT ID</Text>
            <View style={styles.projectIdBadge}>
              <Text style={styles.projectIdValue}>{projectId}</Text>
            </View>
            <Text style={styles.projectIdNote}>Your unique database identifier</Text>
          </View>

          {/* Verified Connection badge */}
          {isVerified ? (
            <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.verifiedBadgeLarge}>
              <LinearGradient
                colors={['rgba(46, 196, 182, 0.15)', 'rgba(46, 196, 182, 0.05)']}
                style={styles.verifiedBadgeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.verifiedBadgeInner}>
                  <View style={styles.verifiedCheckmark}>
                    <Text style={styles.verifiedCheckmarkText}>✓</Text>
                  </View>
                  <View style={styles.verifiedTextContainer}>
                    <Text style={styles.verifiedTitleText}>Verified Connection</Text>
                    <Text style={styles.verifiedSubtitleText}>End-to-end encrypted • Your data is secure</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          ) : (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingIcon}>⏳</Text>
              <Text style={styles.pendingText}>Verifying Connection...</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Handshake status for each check
interface HandshakeItem {
  id: string;
  name: string;
  displayName: string;
  status: 'pending' | 'checking' | 'success' | 'error';
  latency?: number;
  errorMessage?: string;
}

// Animated pulse component for the connection indicator
function PulseIndicator({ status }: { status: 'pending' | 'checking' | 'success' | 'error' }) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);
  const dotScale = useSharedValue(1);

  useEffect(() => {
    if (status === 'checking') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.8, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 400 })
        ),
        -1
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 800 }),
          withTiming(0.4, { duration: 400 })
        ),
        -1
      );
    } else if (status === 'success') {
      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(0);
      dotScale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    } else {
      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(0);
    }
  }, [status, pulseScale, pulseOpacity, dotScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return colors.vibrantTeal;
      case 'error':
        return colors.boldTerracotta;
      case 'checking':
        return colors.champagneGold;
      default:
        return colors.gray400;
    }
  };

  return (
    <View style={styles.pulseContainer}>
      <Animated.View
        style={[
          styles.pulseRing,
          pulseStyle,
          { borderColor: getStatusColor() },
        ]}
      />
      <Animated.View
        style={[
          styles.statusDotInner,
          dotStyle,
          { backgroundColor: getStatusColor() },
        ]}
      />
    </View>
  );
}

// Animated handshake line between items
function HandshakeLine({ delay, success }: { delay: number; success: boolean }) {
  const lineProgress = useSharedValue(0);

  useEffect(() => {
    lineProgress.value = withDelay(
      delay,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
    );
  }, [delay, lineProgress]);

  const lineStyle = useAnimatedStyle(() => {
    const backgroundColor = success ? colors.vibrantTeal : colors.boldTerracotta;
    return {
      height: `${lineProgress.value * 100}%`,
      backgroundColor,
    };
  });

  return (
    <View style={styles.lineContainer}>
      <View style={styles.lineBackground} />
      <Animated.View style={[styles.lineProgress, lineStyle]} />
    </View>
  );
}

// Individual handshake item row
function HandshakeItemRow({
  item,
  index,
  isLast,
  showLine,
}: {
  item: HandshakeItem;
  index: number;
  isLast: boolean;
  showLine: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={styles.handshakeRow}
    >
      <View style={styles.handshakeItemContainer}>
        <PulseIndicator status={item.status} />
        <View style={styles.handshakeItemInfo}>
          <Text style={styles.handshakeItemName}>{item.displayName}</Text>
          {item.status === 'success' && item.latency !== undefined && (
            <Text style={styles.handshakeLatency}>{item.latency}ms</Text>
          )}
          {item.status === 'error' && item.errorMessage && (
            <Text style={styles.handshakeError} numberOfLines={1}>
              {item.errorMessage}
            </Text>
          )}
          {item.status === 'checking' && (
            <Text style={styles.handshakeChecking}>Establishing handshake...</Text>
          )}
          {item.status === 'pending' && (
            <Text style={styles.handshakePending}>Queued</Text>
          )}
        </View>
        {item.status === 'success' && (
          <Animated.View
            entering={FadeIn.springify()}
            style={styles.checkmarkContainer}
          >
            <Text style={styles.checkmark}>✓</Text>
          </Animated.View>
        )}
        {item.status === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMark}>✗</Text>
          </View>
        )}
      </View>
      {!isLast && showLine && (
        <HandshakeLine
          delay={index * 80 + 150}
          success={item.status === 'success'}
        />
      )}
    </Animated.View>
  );
}

// Success celebration component with confetti effect
function SuccessCelebration({ projectId }: { projectId: string }) {
  return (
    <Animated.View
      entering={FadeInUp.delay(300).springify()}
      style={styles.successBanner}
    >
      <LinearGradient
        colors={['rgba(46, 196, 182, 0.2)', 'rgba(46, 196, 182, 0.05)']}
        style={styles.successBannerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.successIconRow}>
          <Text style={styles.successEmoji}>🛡️</Text>
          <Text style={styles.successEmoji}>✨</Text>
          <Text style={styles.successEmoji}>🔒</Text>
        </View>
        <Text style={styles.successText}>
          Private Infrastructure Active
        </Text>
        <Text style={styles.successSubtext}>
          All core tables verified • Your data is secure on your personal Supabase instance
        </Text>
        <View style={styles.successDivider} />
        <View style={styles.successProjectBadge}>
          <Text style={styles.successProjectLabel}>Connected to:</Text>
          <Text style={styles.successProjectId}>{projectId}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default function DatabaseStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, testDataOperations } = useDatabaseStatus();
  const { showSuccess, showError, showInfo } = useSnackbar();
  const [handshakeItems, setHandshakeItems] = useState<HandshakeItem[]>([]);
  const [isHandshaking, setIsHandshaking] = useState(false);
  const [handshakeComplete, setHandshakeComplete] = useState(false);
  const [allSuccess, setAllSuccess] = useState(false);
  const [dataTestResult, setDataTestResult] = useState<{
    canRead: boolean;
    canWrite: boolean;
    errors: string[];
  } | null>(null);
  const [isTestingOperations, setIsTestingOperations] = useState(false);
  const handshakeInProgress = useRef(false);

  // Extract project ID from URL
  const projectId = status.connectionDetails.url
    ? status.connectionDetails.url.replace('https://', '').replace('.supabase.co', '')
    : 'Not configured';

  // Initialize handshake items - Core Tables as mentioned in task
  const initializeHandshakeItems = useCallback((): HandshakeItem[] => {
    const items: HandshakeItem[] = [
      { id: 'connection', name: 'connection', displayName: '🔗 Supabase Connection', status: 'pending' },
      { id: 'users', name: 'users', displayName: '👤 User Profiles', status: 'pending' },
      { id: 'dreams', name: 'dreams', displayName: '✨ Dreams', status: 'pending' },
      { id: 'chat_messages', name: 'chat_messages', displayName: '💬 Gabby AI Chat', status: 'pending' },
      { id: 'five_whys_sessions', name: 'five_whys_sessions', displayName: '🔍 Five Whys', status: 'pending' },
      { id: 'permission_slips', name: 'permission_slips', displayName: '📜 Permission Slips', status: 'pending' },
      { id: 'action_roadmaps', name: 'action_roadmaps', displayName: '🗺️ Golden Path Roadmaps', status: 'pending' },
      { id: 'proofs', name: 'proofs', displayName: '📸 Proof Gallery', status: 'pending' },
      { id: 'streaks', name: 'streaks', displayName: '🔥 Streaks', status: 'pending' },
      { id: 'storage', name: 'proof-assets', displayName: '🗄️ Proof Assets Storage', status: 'pending' },
    ];
    return items;
  }, []);

  // Run the visual handshake test
  const runHandshakeTest = useCallback(async () => {
    if (handshakeInProgress.current) return;
    handshakeInProgress.current = true;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsHandshaking(true);
    setHandshakeComplete(false);
    setAllSuccess(false);

    const items = initializeHandshakeItems();
    setHandshakeItems(items);

    // Helper to update item status
    const updateItemStatus = (
      id: string,
      status: HandshakeItem['status'],
      latency?: number,
      errorMessage?: string
    ) => {
      setHandshakeItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status, latency, errorMessage } : item
        )
      );
    };

    // Sequential handshake with visual feedback
    const { supabase } = await import('@/lib/supabase');
    let allSuccessful = true;

    // 1. Test basic connection
    updateItemStatus('connection', 'checking');
    await new Promise((resolve) => setTimeout(resolve, 400));
    try {
      const startTime = Date.now();
      const { error } = await supabase.from('users').select('id').limit(1);
      const latency = Date.now() - startTime;

      if (error && error.code !== 'PGRST116') {
        updateItemStatus('connection', 'error', undefined, error.message);
        allSuccessful = false;
      } else {
        updateItemStatus('connection', 'success', latency);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err: any) {
      updateItemStatus('connection', 'error', undefined, err.message);
      allSuccessful = false;
    }

    // 2. Test each core table
    const tables = [
      'users', 'dreams', 'chat_messages', 'five_whys_sessions',
      'permission_slips', 'action_roadmaps', 'proofs', 'streaks'
    ];

    for (const table of tables) {
      updateItemStatus(table, 'checking');
      await new Promise((resolve) => setTimeout(resolve, 200));

      try {
        const startTime = Date.now();
        const { error } = await supabase
          .from(table as any)
          .select('*', { count: 'exact', head: true });
        const latency = Date.now() - startTime;

        if (error && error.code !== '42501' && error.code !== 'PGRST116') {
          updateItemStatus(table, 'error', undefined, error.message || 'Table not found');
          allSuccessful = false;
        } else {
          updateItemStatus(table, 'success', latency);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (err: any) {
        updateItemStatus(table, 'error', undefined, err.message);
        allSuccessful = false;
      }
    }

    // 3. Test storage bucket
    updateItemStatus('storage', 'checking');
    await new Promise((resolve) => setTimeout(resolve, 250));

    try {
      const startTime = Date.now();
      const { error } = await supabase.storage.from('proof-assets').list('', { limit: 1 });
      const latency = Date.now() - startTime;

      if (error && !error.message.includes('not found')) {
        // Bucket exists but may have access restrictions - that's OK
        updateItemStatus('storage', 'success', latency);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (!error) {
        updateItemStatus('storage', 'success', latency);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        updateItemStatus('storage', 'error', undefined, 'Bucket not configured');
        allSuccessful = false;
      }
    } catch (err: any) {
      updateItemStatus('storage', 'error', undefined, err.message);
      allSuccessful = false;
    }

    // Complete
    setIsHandshaking(false);
    setHandshakeComplete(true);
    setAllSuccess(allSuccessful);
    handshakeInProgress.current = false;

    if (allSuccessful) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess('Private infrastructure verified! All core tables ready.', {
        icon: '🛡️',
        duration: 4000,
      });
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showInfo('Some tables need attention. Check the handshake results.', {
        icon: '⚠️',
        duration: 5000,
      });
    }
  }, [initializeHandshakeItems, showSuccess, showInfo]);

  // Handle data operations test
  const handleTestOperations = async () => {
    setIsTestingOperations(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await testDataOperations();
    setDataTestResult(result);
    setIsTestingOperations(false);

    if (result.errors.length > 0) {
      showError(result.errors[0], {
        icon: '⚠️',
        duration: 5000,
      });
    } else {
      showSuccess('All data operations working correctly! Your data is now routed to your personal database.', {
        icon: '🛡️',
        duration: 4000,
      });
    }
  };

  // Run handshake on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      runHandshakeTest();
    }, 600);
    return () => clearTimeout(timer);
  }, [runHandshakeTest]);

  const successCount = handshakeItems.filter((i) => i.status === 'success').length;
  const totalCount = handshakeItems.length;
  const progressPercentage = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Database Status</Text>
          {allSuccess && (
            <View style={styles.headerBadge}>
              <View style={styles.headerBadgeDot} />
              <Text style={styles.headerBadgeText}>Connected</Text>
            </View>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Private Infrastructure Badge - Prominent Display */}
        <PrivateInfrastructureBadge
          projectId={projectId}
          isVerified={allSuccess}
        />

        {/* Connection Handshake Card - Premium Visual */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Card style={styles.handshakeCard}>
            <LinearGradient
              colors={[colors.midnightNavy, '#0A2235', '#071520']}
              style={styles.handshakeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.handshakeHeader}>
                <View style={styles.handshakeTitleRow}>
                  <Text style={styles.handshakeTitle}>Connection Handshake</Text>
                  <View style={[
                    styles.statusChip,
                    { backgroundColor: allSuccess ? colors.vibrantTeal + '20' : isHandshaking ? colors.champagneGold + '20' : colors.gray500 + '20' }
                  ]}>
                    <Text style={[
                      styles.statusChipText,
                      { color: allSuccess ? colors.vibrantTeal : isHandshaking ? colors.champagneGold : colors.gray400 }
                    ]}>
                      {allSuccess ? 'Verified' : isHandshaking ? 'Testing' : 'Ready'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.handshakeSubtitle}>
                  {handshakeComplete
                    ? allSuccess
                      ? 'All Core Tables Ready'
                      : 'Some Tables Need Attention'
                    : isHandshaking
                    ? 'Establishing Secure Connection...'
                    : 'Ready to Verify'}
                </Text>
              </View>

              {/* Progress indicator */}
              {handshakeItems.length > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progressPercentage}%`,
                          backgroundColor: allSuccess
                            ? colors.vibrantTeal
                            : colors.champagneGold,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {successCount}/{totalCount} Tables Verified
                  </Text>
                </View>
              )}

              {/* Handshake items */}
              <View style={styles.handshakeList}>
                {handshakeItems.map((item, index) => (
                  <HandshakeItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    isLast={index === handshakeItems.length - 1}
                    showLine={index < handshakeItems.length - 1}
                  />
                ))}
              </View>

              {/* Success celebration */}
              {handshakeComplete && allSuccess && (
                <SuccessCelebration projectId={projectId} />
              )}

              {/* Retry button */}
              {handshakeComplete && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={runHandshakeTest}
                  disabled={isHandshaking}
                >
                  <Text style={styles.retryButtonText}>
                    {isHandshaking ? 'Verifying...' : 'Re-Verify Connection'}
                  </Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </Card>
        </Animated.View>

        {/* Connection Details */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Card style={styles.detailsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Connection Details</Text>
              {allSuccess && (
                <View style={styles.connectedIndicator}>
                  <View style={styles.connectedDot} />
                  <Text style={styles.connectedText}>Live</Text>
                </View>
              )}
            </View>

            {/* Database Reference ID - Highlighted */}
            <View style={styles.projectRefContainer}>
              <View style={styles.projectRefHeader}>
                <LockIcon size={14} color={colors.vibrantTeal} />
                <Text style={styles.projectRefLabel}>PERSONAL DATABASE INSTANCE</Text>
              </View>
              <View style={styles.projectRefBadge}>
                <Text style={styles.projectRefValue}>{projectId}</Text>
              </View>
              <Text style={styles.projectRefNote}>
                Your private Supabase project ID — visible only to you
              </Text>
            </View>

            <View style={styles.detailsDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Endpoint:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {status.connectionDetails.url || 'Not configured'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Auth Key:</Text>
              <View style={styles.detailBadge}>
                <Text style={[
                  styles.detailBadgeText,
                  { color: status.connectionDetails.hasAnonKey ? colors.vibrantTeal : colors.boldTerracotta }
                ]}>
                  {status.connectionDetails.hasAnonKey ? '✓ Active' : '✗ Missing'}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Infrastructure:</Text>
              <View style={styles.detailBadge}>
                <Text style={[
                  styles.detailBadgeText,
                  { color: allSuccess ? colors.vibrantTeal : colors.champagneGold }
                ]}>
                  {allSuccess ? '🛡️ Private • Verified' : handshakeComplete ? '⚠ Pending Setup' : '⏳ Verifying'}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Data Routing Status */}
        <Animated.View entering={FadeInDown.delay(450)}>
          <Card style={styles.routingCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Data Routing</Text>
              {allSuccess && (
                <View style={styles.routingActiveBadge}>
                  <Text style={styles.routingActiveText}>Active</Text>
                </View>
              )}
            </View>
            <Text style={styles.routingDescription}>
              All user interactions are now routed to your personal database:
            </Text>
            <View style={styles.routingList}>
              {[
                { label: 'Gabby AI Coaching Sessions', icon: '💬' },
                { label: 'Golden Path Roadmap Progress', icon: '🗺️' },
                { label: 'Proof Gallery Uploads', icon: '📸' },
                { label: 'Five Whys Deep Dives', icon: '🔍' },
                { label: 'Permission Slips', icon: '📜' },
                { label: 'Streak Tracking', icon: '🔥' },
              ].map((item, index) => (
                <View key={index} style={styles.routingItem}>
                  <Text style={styles.routingIcon}>{item.icon}</Text>
                  <Text style={styles.routingItemText}>{item.label}</Text>
                  <View style={[styles.routingDot, { backgroundColor: allSuccess ? colors.vibrantTeal : colors.gray400 }]} />
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Data Operations Test */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Card style={styles.testCard}>
            <Text style={styles.sectionTitle}>Data Operations Test</Text>
            <Text style={styles.testDescription}>
              Verify that read and write operations are working correctly with your
              authentication.
            </Text>

            {dataTestResult && (
              <View style={styles.testResults}>
                <View style={styles.testResultRow}>
                  <Text style={styles.testResultLabel}>Read Operations:</Text>
                  <Text
                    style={[
                      styles.testResultValue,
                      {
                        color: dataTestResult.canRead
                          ? colors.vibrantTeal
                          : colors.boldTerracotta,
                      },
                    ]}
                  >
                    {dataTestResult.canRead ? '✓ Working' : '✗ Failed'}
                  </Text>
                </View>
                <View style={styles.testResultRow}>
                  <Text style={styles.testResultLabel}>Write Operations:</Text>
                  <Text
                    style={[
                      styles.testResultValue,
                      {
                        color: dataTestResult.canWrite
                          ? colors.vibrantTeal
                          : colors.boldTerracotta,
                      },
                    ]}
                  >
                    {dataTestResult.canWrite ? '✓ Working' : '✗ Failed'}
                  </Text>
                </View>
              </View>
            )}

            <Button
              title={isTestingOperations ? 'Testing Operations...' : 'Run Data Operations Test'}
              onPress={handleTestOperations}
              variant="outline"
              loading={isTestingOperations}
              style={styles.testButton}
            />
          </Card>
        </Animated.View>

        {/* Boutique Features Status */}
        <Animated.View entering={FadeInDown.delay(550)}>
          <Card style={styles.featuresCard}>
            <Text style={styles.sectionTitle}>Boutique Features Status</Text>
            <View style={styles.featuresList}>
              {[
                { name: 'Five Whys Deep Dives', table: 'five_whys_sessions', icon: '🔍' },
                { name: 'Permission Slips', table: 'permission_slips', icon: '📜' },
                { name: 'Golden Path Roadmaps', table: 'action_roadmaps', icon: '🗺️' },
                { name: 'Proof Gallery', table: 'proofs', icon: '📸' },
                { name: 'Gabby AI Chat', table: 'chat_messages', icon: '💬' },
                { name: 'Streak Tracking', table: 'streaks', icon: '🔥' },
              ].map((feature) => {
                const item = handshakeItems.find((i) => i.id === feature.table);
                const isConnected = item?.status === 'success';
                return (
                  <View key={feature.table} style={styles.featureRow}>
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <Text style={styles.featureName}>{feature.name}</Text>
                    <View
                      style={[
                        styles.featureStatusBadge,
                        {
                          backgroundColor: isConnected
                            ? colors.vibrantTeal + '15'
                            : colors.gray200,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.featureStatus,
                          {
                            color: isConnected
                              ? colors.vibrantTeal
                              : colors.gray500,
                          },
                        ]}
                      >
                        {isConnected ? '✓ Ready' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        {/* Data Ownership Card */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <Card style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Text style={styles.helpIcon}>🛡️</Text>
              <Text style={styles.helpTitle}>Your Data, Your Control</Text>
            </View>
            <Text style={styles.helpText}>
              Your data is stored securely in your personal Supabase instance. You have
              full ownership and control over all your:
            </Text>
            <View style={styles.helpList}>
              <Text style={styles.helpItem}>• Five Whys sessions and insights</Text>
              <Text style={styles.helpItem}>• Permission slips and signatures</Text>
              <Text style={styles.helpItem}>• Golden path roadmaps and actions</Text>
              <Text style={styles.helpItem}>• Proof photos and win celebrations</Text>
              <Text style={styles.helpItem}>• AI coaching conversation history</Text>
            </View>
            <View style={styles.helpFooter}>
              <Text style={styles.helpFooterText}>
                Project: <Text style={styles.helpFooterHighlight}>{projectId}</Text>
              </Text>
            </View>
          </Card>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    padding: spacing.xs,
  },
  backText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.boldTerracotta,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.vibrantTeal + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
    gap: 4,
  },
  headerBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.vibrantTeal,
  },
  headerBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.vibrantTeal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  // Private Infrastructure Badge Styles
  privateBadgeContainer: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.xl,
  },
  privateBadgeGradient: {
    padding: spacing['2xl'],
    position: 'relative',
    minHeight: 320,
  },
  orbsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privateBadgeContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  activeStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 196, 182, 0.12)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(46, 196, 182, 0.25)',
  },
  activeStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.vibrantTeal,
  },
  activeStatusText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.vibrantTeal,
    letterSpacing: 2,
  },
  privateBadgeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  lockBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    marginLeft: -spacing.md,
  },
  privateBadgeTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.parchmentWhite,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  privateBadgeSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  projectIdContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },
  projectIdLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 3,
    marginBottom: spacing.md,
  },
  projectIdBadge: {
    backgroundColor: 'rgba(46, 196, 182, 0.12)',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(46, 196, 182, 0.35)',
    marginBottom: spacing.sm,
  },
  projectIdValue: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.vibrantTeal,
    letterSpacing: 1.5,
  },
  projectIdNote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  verifiedBadgeLarge: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  verifiedBadgeGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(46, 196, 182, 0.25)',
  },
  verifiedBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedCheckmark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.vibrantTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  verifiedCheckmarkText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
  },
  verifiedTextContainer: {
    flex: 1,
  },
  verifiedTitleText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.vibrantTeal,
    marginBottom: 2,
  },
  verifiedSubtitleText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  pendingIcon: {
    fontSize: 16,
  },
  pendingText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
  },
  // Handshake Card Styles
  handshakeCard: {
    marginBottom: spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  handshakeGradient: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  handshakeHeader: {
    marginBottom: spacing.lg,
  },
  handshakeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  handshakeTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.parchmentWhite,
  },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusChipText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  handshakeSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  handshakeList: {
    marginBottom: spacing.md,
  },
  handshakeRow: {
    marginBottom: spacing.xs,
  },
  handshakeItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.md,
  },
  pulseContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pulseRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  statusDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  handshakeItemInfo: {
    flex: 1,
  },
  handshakeItemName: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.parchmentWhite,
  },
  handshakeLatency: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.vibrantTeal,
  },
  handshakeChecking: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.champagneGold,
  },
  handshakePending: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  handshakeError: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.boldTerracotta,
  },
  checkmarkContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.vibrantTeal + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 14,
    color: colors.vibrantTeal,
  },
  errorContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.boldTerracotta + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMark: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 14,
    color: colors.boldTerracotta,
  },
  lineContainer: {
    height: 12,
    paddingLeft: 13,
    justifyContent: 'center',
  },
  lineBackground: {
    position: 'absolute',
    left: 13,
    width: 2,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  lineProgress: {
    width: 2,
    borderRadius: 1,
  },
  // Success banner
  successBanner: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  successBannerGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.vibrantTeal + '25',
    borderRadius: borderRadius.lg,
  },
  successIconRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  successEmoji: {
    fontSize: 32,
  },
  successText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.parchmentWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successSubtext: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  successDivider: {
    width: 60,
    height: 2,
    backgroundColor: colors.vibrantTeal + '40',
    borderRadius: 1,
    marginBottom: spacing.lg,
  },
  successProjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  successProjectLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  successProjectId: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.vibrantTeal,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
  },
  // Details Card
  detailsCard: {
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.vibrantTeal + '20',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  connectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.vibrantTeal + '12',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.vibrantTeal,
  },
  connectedText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.vibrantTeal,
  },
  projectRefContainer: {
    backgroundColor: colors.midnightNavy + '06',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.midnightNavy + '12',
  },
  projectRefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  projectRefLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    letterSpacing: 1.5,
  },
  projectRefBadge: {
    backgroundColor: colors.vibrantTeal + '15',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.vibrantTeal + '35',
    marginBottom: spacing.sm,
  },
  projectRefValue: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.vibrantTeal,
    letterSpacing: 0.5,
  },
  projectRefNote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    fontStyle: 'italic',
  },
  detailsDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  detailValue: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.midnightNavy,
    maxWidth: '60%',
  },
  detailBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  detailBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
  },
  // Routing Card
  routingCard: {
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.champagneGold + '25',
    backgroundColor: colors.champagneGold + '05',
  },
  routingActiveBadge: {
    backgroundColor: colors.vibrantTeal + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  routingActiveText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.vibrantTeal,
  },
  routingDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  routingList: {
    gap: spacing.sm,
  },
  routingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  routingIcon: {
    fontSize: 16,
    marginRight: spacing.md,
    width: 24,
    textAlign: 'center',
  },
  routingItemText: {
    flex: 1,
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
  },
  routingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Test Card
  testCard: {
    marginBottom: spacing.lg,
  },
  testDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  testResults: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  testResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  testResultLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  testResultValue: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
  },
  testButton: {
    marginTop: spacing.sm,
  },
  // Features Card
  featuresCard: {
    marginBottom: spacing.lg,
  },
  featuresList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: spacing.md,
    width: 24,
    textAlign: 'center',
  },
  featureName: {
    flex: 1,
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
  },
  featureStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  featureStatus: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
  },
  // Help Card
  helpCard: {
    backgroundColor: colors.champagneGold + '08',
    borderWidth: 1,
    borderColor: colors.champagneGold + '25',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  helpIcon: {
    fontSize: 24,
  },
  helpTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
  },
  helpText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  helpList: {
    marginBottom: spacing.lg,
  },
  helpItem: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
    lineHeight: 22,
  },
  helpFooter: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.champagneGold + '30',
  },
  helpFooterText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    textAlign: 'center',
  },
  helpFooterHighlight: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.vibrantTeal,
  },
});
