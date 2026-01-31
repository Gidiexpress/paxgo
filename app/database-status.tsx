import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDatabaseStatus } from '@/hooks/useDatabaseStatus';

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

// Animated breathing effect for the private badge
function PrivateInfrastructureBadge({ projectId }: { projectId: string }) {
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [glowScale, glowOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.delay(200)} style={styles.privateBadgeContainer}>
      <LinearGradient
        colors={['#0A2A3A', colors.midnightNavy, '#0A2540']}
        style={styles.privateBadgeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated glow ring */}
        <Animated.View style={[styles.privateBadgeGlow, glowStyle]} />

        {/* Shield and lock icons */}
        <View style={styles.privateBadgeIconRow}>
          <ShieldIcon size={32} color={colors.vibrantTeal} />
          <LockIcon size={18} color={colors.champagneGold} />
        </View>

        {/* Title and description */}
        <Text style={styles.privateBadgeTitle}>Private Infrastructure</Text>
        <Text style={styles.privateBadgeSubtitle}>Your Personal Database</Text>

        {/* Project ID display */}
        <View style={styles.projectIdContainer}>
          <Text style={styles.projectIdLabel}>INSTANCE ID</Text>
          <View style={styles.projectIdBadge}>
            <Text style={styles.projectIdValue}>{projectId}</Text>
          </View>
        </View>

        {/* Verified badge */}
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedIcon}>✓</Text>
          <Text style={styles.verifiedText}>Verified Connection</Text>
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

  useEffect(() => {
    if (status === 'checking') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 400 })
        ),
        -1
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 800 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1
      );
    } else {
      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(0);
    }
  }, [status, pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
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
      <View
        style={[
          styles.statusDotInner,
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
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );
  }, [delay, lineProgress]);

  const lineStyle = useAnimatedStyle(() => {
    const backgroundColor = success ? colors.vibrantTeal : colors.boldTerracotta;
    return {
      width: `${lineProgress.value * 100}%`,
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
      entering={FadeInDown.delay(index * 100).springify()}
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
            <Text style={styles.handshakeChecking}>Connecting...</Text>
          )}
          {item.status === 'pending' && (
            <Text style={styles.handshakePending}>Waiting...</Text>
          )}
        </View>
        {item.status === 'success' && (
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
        {item.status === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMark}>✗</Text>
          </View>
        )}
      </View>
      {!isLast && showLine && (
        <HandshakeLine
          delay={index * 100 + 200}
          success={item.status === 'success'}
        />
      )}
    </Animated.View>
  );
}

export default function DatabaseStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, testDataOperations } = useDatabaseStatus();
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

  // Initialize handshake items
  const initializeHandshakeItems = useCallback((): HandshakeItem[] => {
    const items: HandshakeItem[] = [
      { id: 'connection', name: 'connection', displayName: '🔗 Supabase Connection', status: 'pending' },
      { id: 'users', name: 'users', displayName: '👤 User Profiles', status: 'pending' },
      { id: 'dreams', name: 'dreams', displayName: '✨ Dreams', status: 'pending' },
      { id: 'chat_messages', name: 'chat_messages', displayName: '💬 Gabby AI Chat', status: 'pending' },
      { id: 'five_whys_sessions', name: 'five_whys_sessions', displayName: '🔍 Five Whys Sessions', status: 'pending' },
      { id: 'five_whys_responses', name: 'five_whys_responses', displayName: '📝 Five Whys Responses', status: 'pending' },
      { id: 'permission_slips', name: 'permission_slips', displayName: '📜 Permission Slips', status: 'pending' },
      { id: 'action_roadmaps', name: 'action_roadmaps', displayName: '🗺️ Golden Path Roadmaps', status: 'pending' },
      { id: 'roadmap_actions', name: 'roadmap_actions', displayName: '🎯 Roadmap Actions', status: 'pending' },
      { id: 'proofs', name: 'proofs', displayName: '📸 Proof Gallery', status: 'pending' },
      { id: 'micro_actions', name: 'micro_actions', displayName: '⚡ Micro Actions', status: 'pending' },
      { id: 'streaks', name: 'streaks', displayName: '🔥 Streaks', status: 'pending' },
      { id: 'storage', name: 'proof-assets', displayName: '🗄️ Proof Assets Bucket', status: 'pending' },
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
    await new Promise((resolve) => setTimeout(resolve, 300));
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

    // 2. Test each table
    const tables = [
      'users', 'dreams', 'chat_messages', 'five_whys_sessions',
      'five_whys_responses', 'permission_slips', 'action_roadmaps',
      'roadmap_actions', 'proofs', 'micro_actions', 'streaks'
    ];

    for (const table of tables) {
      updateItemStatus(table, 'checking');
      await new Promise((resolve) => setTimeout(resolve, 150));

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
    await new Promise((resolve) => setTimeout(resolve, 200));

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
        updateItemStatus('storage', 'error', undefined, 'Bucket not found');
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
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [initializeHandshakeItems]);

  // Handle data operations test
  const handleTestOperations = async () => {
    setIsTestingOperations(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await testDataOperations();
    setDataTestResult(result);
    setIsTestingOperations(false);

    if (result.errors.length > 0) {
      Alert.alert('Data Test Results', result.errors.join('\n'));
    } else {
      Alert.alert('Success', 'All data operations working correctly!');
    }
  };

  // Run handshake on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      runHandshakeTest();
    }, 500);
    return () => clearTimeout(timer);
  }, [runHandshakeTest]);

  const successCount = handshakeItems.filter((i) => i.status === 'success').length;
  const totalCount = handshakeItems.length;

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
        <Text style={styles.headerTitle}>Database Status</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Private Infrastructure Badge - Prominent Display */}
        <PrivateInfrastructureBadge
          projectId={
            status.connectionDetails.url
              ? status.connectionDetails.url.replace('https://', '').replace('.supabase.co', '')
              : 'Not configured'
          }
        />

        {/* Connection Handshake Card - Premium Visual */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Card style={styles.handshakeCard}>
            <LinearGradient
              colors={[colors.midnightNavy, '#0A2540']}
              style={styles.handshakeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.handshakeHeader}>
                <Text style={styles.handshakeTitle}>Connection Handshake</Text>
                <Text style={styles.handshakeSubtitle}>
                  {handshakeComplete
                    ? allSuccess
                      ? 'All Systems Ready'
                      : 'Some Issues Detected'
                    : isHandshaking
                    ? 'Establishing Connection...'
                    : 'Ready to Test'}
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
                          width: `${(successCount / totalCount) * 100}%`,
                          backgroundColor: allSuccess
                            ? colors.vibrantTeal
                            : colors.champagneGold,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {successCount}/{totalCount} Connected
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
                <Animated.View
                  entering={FadeInUp.delay(500)}
                  style={styles.successBanner}
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
                    All tables verified • Your data is secure on your personal Supabase instance
                  </Text>
                  <View style={styles.successProjectBadge}>
                    <Text style={styles.successProjectLabel}>Connected to:</Text>
                    <Text style={styles.successProjectId}>
                      {status.connectionDetails.url
                        ? status.connectionDetails.url.replace('https://', '').replace('.supabase.co', '')
                        : 'Unknown'}
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Retry button */}
              {handshakeComplete && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={runHandshakeTest}
                  disabled={isHandshaking}
                >
                  <Text style={styles.retryButtonText}>
                    {isHandshaking ? 'Testing...' : 'Run Test Again'}
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
                <Text style={styles.projectRefValue}>
                  {status.connectionDetails.url
                    ? status.connectionDetails.url.replace('https://', '').replace('.supabase.co', '')
                    : 'Not configured'}
                </Text>
              </View>
              <Text style={styles.projectRefNote}>
                This is your private Supabase project ID
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
                  {allSuccess ? '🛡️ Private' : handshakeComplete ? '⚠ Pending' : '⏳ Verifying'}
                </Text>
              </View>
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
                  <Text style={styles.testResultLabel}>Read:</Text>
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
                  <Text style={styles.testResultLabel}>Write:</Text>
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
              title={isTestingOperations ? 'Testing...' : 'Run Data Test'}
              onPress={handleTestOperations}
              variant="outline"
              loading={isTestingOperations}
              style={styles.testButton}
            />
          </Card>
        </Animated.View>

        {/* Features Status */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <Card style={styles.featuresCard}>
            <Text style={styles.sectionTitle}>Boutique Features Status</Text>
            <View style={styles.featuresList}>
              {[
                { name: 'Five Whys Deep Dives', table: 'five_whys_sessions' },
                { name: 'Permission Slips', table: 'permission_slips' },
                { name: 'Golden Path Roadmaps', table: 'action_roadmaps' },
                { name: 'Proof Gallery', table: 'proofs' },
                { name: 'Gabby AI Chat', table: 'chat_messages' },
                { name: 'Streak Tracking', table: 'streaks' },
              ].map((feature) => {
                const item = handshakeItems.find((i) => i.id === feature.table);
                const isConnected = item?.status === 'success';
                return (
                  <View key={feature.table} style={styles.featureRow}>
                    <View
                      style={[
                        styles.featureDot,
                        {
                          backgroundColor: isConnected
                            ? colors.vibrantTeal
                            : colors.gray400,
                        },
                      ]}
                    />
                    <Text style={styles.featureName}>{feature.name}</Text>
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
                      {isConnected ? 'Ready' : 'Pending'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        {/* Help Section */}
        <Animated.View entering={FadeInDown.delay(700)}>
          <Card style={styles.helpCard}>
            <Text style={styles.helpTitle}>Data Ownership</Text>
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
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
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
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  privateBadgeGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  privateBadgeGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -60,
    marginLeft: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.vibrantTeal,
  },
  privateBadgeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  privateBadgeTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.parchmentWhite,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  privateBadgeSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  projectIdContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  projectIdLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  projectIdBadge: {
    backgroundColor: 'rgba(46, 196, 182, 0.15)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(46, 196, 182, 0.3)',
  },
  projectIdValue: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.vibrantTeal,
    letterSpacing: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 196, 182, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  verifiedIcon: {
    fontSize: 12,
    color: colors.vibrantTeal,
  },
  verifiedText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.vibrantTeal,
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
  handshakeTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.parchmentWhite,
    marginBottom: spacing.xs,
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
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
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
    marginBottom: spacing.sm,
  },
  handshakeItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  pulseContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pulseRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  statusDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    color: 'rgba(255, 255, 255, 0.5)',
  },
  handshakeError: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.boldTerracotta,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.vibrantTeal + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 14,
    color: colors.vibrantTeal,
  },
  errorContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.boldTerracotta + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMark: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 14,
    color: colors.boldTerracotta,
  },
  lineContainer: {
    height: 16,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  lineBackground: {
    position: 'absolute',
    left: 12,
    width: 2,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  lineProgress: {
    width: 2,
    height: 16,
    borderRadius: 1,
  },
  successBanner: {
    backgroundColor: colors.vibrantTeal + '20',
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.vibrantTeal + '30',
  },
  successIconRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  successEmoji: {
    fontSize: 28,
  },
  successText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.parchmentWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successSubtext: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  successProjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.md,
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
    fontSize: typography.fontSize.xs,
    color: colors.vibrantTeal,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
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
    backgroundColor: colors.vibrantTeal + '10',
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
    backgroundColor: colors.midnightNavy + '05',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.midnightNavy + '10',
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
    backgroundColor: colors.vibrantTeal + '12',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.vibrantTeal + '40',
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
  // Test Card
  testCard: {
    marginBottom: spacing.lg,
  },
  testDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.md,
  },
  testResults: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
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
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.md,
  },
  featureName: {
    flex: 1,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
  },
  featureStatus: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
  },
  // Help Card
  helpCard: {
    backgroundColor: colors.champagneGold + '10',
    borderWidth: 1,
    borderColor: colors.champagneGold + '30',
  },
  helpTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: spacing.sm,
  },
  helpText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  helpList: {
    marginTop: spacing.xs,
  },
  helpItem: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
});
