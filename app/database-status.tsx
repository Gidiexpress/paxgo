import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDatabaseStatus } from '@/hooks/useDatabaseStatus';

export default function DatabaseStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, runFullCheck, testDataOperations } = useDatabaseStatus();
  const [dataTestResult, setDataTestResult] = useState<{
    canRead: boolean;
    canWrite: boolean;
    errors: string[];
  } | null>(null);
  const [isTestingOperations, setIsTestingOperations] = useState(false);

  useEffect(() => {
    runFullCheck();
  }, [runFullCheck]);

  const handleRunCheck = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await runFullCheck();
  };

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

  const getStatusColor = (status: boolean | undefined) => {
    if (status === undefined) return colors.gray400;
    return status ? colors.vibrantTeal : colors.boldTerracotta;
  };

  const missingTables = status.tables.filter(t => !t.exists);
  const existingTables = status.tables.filter(t => t.exists);

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
        {/* Connection Status Card */}
        <Animated.View entering={FadeInDown}>
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusIconContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(status.isConnected) },
                  ]}
                />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Connection Status</Text>
                <Text style={styles.statusValue}>
                  {status.isChecking
                    ? 'Checking...'
                    : status.isConnected
                    ? 'Connected'
                    : 'Disconnected'}
                </Text>
              </View>
              {status.isChecking && (
                <ActivityIndicator size="small" color={colors.boldTerracotta} />
              )}
            </View>

            {status.lastChecked && (
              <Text style={styles.lastChecked}>
                Last checked: {status.lastChecked.toLocaleTimeString()}
              </Text>
            )}

            {status.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error:</Text>
                <Text style={styles.errorText}>{status.error}</Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Connection Details */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Connection Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Supabase URL:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {status.connectionDetails.url
                  ? `${status.connectionDetails.url.substring(0, 40)}...`
                  : 'Not configured'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Anon Key:</Text>
              <Text style={styles.detailValue}>
                {status.connectionDetails.hasAnonKey ? '✓ Configured' : '✗ Missing'}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Storage Status */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={styles.storageCard}>
            <Text style={styles.sectionTitle}>Storage Bucket</Text>
            <View style={styles.storageRow}>
              <Text style={styles.storageName}>proof-assets</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: status.storageStatus.proofAssetsExists
                      ? colors.vibrantTeal + '20'
                      : colors.boldTerracotta + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: status.storageStatus.proofAssetsExists
                        ? colors.tealDark
                        : colors.terracottaDark,
                    },
                  ]}
                >
                  {status.storageStatus.proofAssetsExists ? 'Available' : 'Not Found'}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Tables Status */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Card style={styles.tablesCard}>
            <Text style={styles.sectionTitle}>Database Tables</Text>
            <Text style={styles.tablesSummary}>
              {existingTables.length} of {status.tables.length} tables found
            </Text>

            {missingTables.length > 0 && (
              <View style={styles.missingTablesContainer}>
                <Text style={styles.missingTablesTitle}>Missing Tables:</Text>
                {missingTables.map((table) => (
                  <View key={table.name} style={styles.tableRow}>
                    <View style={[styles.tableDot, styles.tableDotError]} />
                    <Text style={styles.tableName}>{table.name}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.existingTablesContainer}>
              <Text style={styles.existingTablesTitle}>Existing Tables:</Text>
              {existingTables.map((table) => (
                <View key={table.name} style={styles.tableRow}>
                  <View style={[styles.tableDot, styles.tableDotSuccess]} />
                  <Text style={styles.tableName}>{table.name}</Text>
                  {table.rlsEnabled && (
                    <View style={styles.rlsBadge}>
                      <Text style={styles.rlsBadgeText}>RLS</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Data Operations Test */}
        <Animated.View entering={FadeInDown.delay(400)}>
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

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.actions}>
          <Button
            title="Refresh Status"
            onPress={handleRunCheck}
            variant="primary"
            loading={status.isChecking}
            style={styles.actionButton}
          />
        </Animated.View>

        {/* Help Section */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <Card style={styles.helpCard}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              If you&apos;re having connection issues:
            </Text>
            <View style={styles.helpList}>
              <Text style={styles.helpItem}>
                • Verify your Supabase URL and Anon Key in .env
              </Text>
              <Text style={styles.helpItem}>
                • Run the SQL schema in supabase-schema.sql
              </Text>
              <Text style={styles.helpItem}>
                • Ensure RLS policies are properly configured
              </Text>
              <Text style={styles.helpItem}>
                • Check that you&apos;re signed in to the app
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
  statusCard: {
    marginBottom: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    marginRight: spacing.md,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  statusValue: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
  },
  lastChecked: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.sm,
  },
  errorContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.boldTerracotta + '10',
    borderRadius: borderRadius.md,
  },
  errorTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.terracottaDark,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.terracottaDark,
  },
  detailsCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  detailValue: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    maxWidth: '60%',
  },
  storageCard: {
    marginBottom: spacing.lg,
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storageName: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
  },
  tablesCard: {
    marginBottom: spacing.lg,
  },
  tablesSummary: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.md,
  },
  missingTablesContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.boldTerracotta + '10',
    borderRadius: borderRadius.md,
  },
  missingTablesTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.terracottaDark,
    marginBottom: spacing.sm,
  },
  existingTablesContainer: {
    padding: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
  },
  existingTablesTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    marginBottom: spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  tableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  tableDotSuccess: {
    backgroundColor: colors.vibrantTeal,
  },
  tableDotError: {
    backgroundColor: colors.boldTerracotta,
  },
  tableName: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    flex: 1,
  },
  rlsBadge: {
    backgroundColor: colors.champagneGold + '30',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  rlsBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 10,
    color: colors.goldDark,
  },
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
  actions: {
    marginBottom: spacing.lg,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
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
