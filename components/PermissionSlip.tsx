import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, borderRadius, shadows, spacing } from '@/constants/theme';
import { PermissionSlip as PermissionSlipType } from '@/types';

interface PermissionSlipProps {
  slip: PermissionSlipType;
}

export function PermissionSlip({ slip }: PermissionSlipProps) {
  return (
    <View style={styles.container}>
      {/* Paper texture background */}
      <LinearGradient
        colors={['#FDF8ED', '#F5EDD6', '#FDF8ED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.paper}
      >
        {/* Decorative border */}
        <View style={styles.borderDecor}>
          <View style={styles.innerBorder}>
            {/* Header */}
            <Text style={styles.headerText}>Digital Permission Slip</Text>

            {/* Decorative line */}
            <View style={styles.decorativeLine}>
              <View style={styles.lineSegment} />
              <Text style={styles.flourish}>✦</Text>
              <View style={styles.lineSegment} />
            </View>

            {/* Permission content */}
            <View style={styles.contentSection}>
              <Text style={styles.permissionLabel}>This certifies that</Text>
              <Text style={styles.permissionText}>{slip.permission}</Text>
            </View>

            {/* Signature section */}
            <View style={styles.signatureSection}>
              <Text style={styles.signedText}>Signed:</Text>
              <Text style={styles.signatureName}>{slip.signedBy}</Text>
              <Text style={styles.signedBy}>by the community</Text>
            </View>

            {/* Wax seal */}
            <View style={styles.waxSeal}>
              <View style={styles.sealInner}>
                <Text style={styles.sealText}>P</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
    ...shadows.lg,
  },
  paper: {
    borderRadius: borderRadius.lg,
    padding: 3,
  },
  borderDecor: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg - 2,
    borderWidth: 1,
    borderColor: '#D4C4A8',
    padding: 8,
  },
  innerBorder: {
    backgroundColor: 'rgba(253, 248, 237, 0.9)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5D9C3',
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
  },
  headerText: {
    fontFamily: typography.fontFamily.headingItalic,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  decorativeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '80%',
  },
  lineSegment: {
    flex: 1,
    height: 1,
    backgroundColor: colors.champagneGold,
  },
  flourish: {
    marginHorizontal: spacing.md,
    color: colors.champagneGold,
    fontSize: 16,
  },
  contentSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  permissionLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: spacing.md,
  },
  signatureSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  signedText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  signatureName: {
    fontFamily: typography.fontFamily.headingItalic,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    marginVertical: spacing.xs,
  },
  signedBy: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    fontStyle: 'italic',
  },
  waxSeal: {
    position: 'absolute',
    bottom: -20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.boldTerracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  sealInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.terracottaDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sealText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.white,
  },
});
