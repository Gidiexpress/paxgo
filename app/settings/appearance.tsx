import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function AppearanceScreen() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLargeText, setIsLargeText] = useState(false);
    const [useSystemTheme, setUseSystemTheme] = useState(true);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Theme</Text>

                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>System Default</Text>
                        <Text style={styles.rowSubtitle}>Match device appearance</Text>
                    </View>
                    <Switch
                        value={useSystemTheme}
                        onValueChange={setUseSystemTheme}
                        trackColor={{ false: colors.gray300, true: colors.vibrantTeal }}
                        thumbColor={colors.white}
                    />
                </View>

                {!useSystemTheme && (
                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={styles.rowTitle}>Dark Mode</Text>
                            <Text style={styles.rowSubtitle}>Use a darker color palette</Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={setIsDarkMode}
                            trackColor={{ false: colors.gray300, true: colors.vibrantTeal }}
                            thumbColor={colors.white}
                        />
                    </View>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Display</Text>

                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>Large Text</Text>
                        <Text style={styles.rowSubtitle}>Increase font size for readability</Text>
                    </View>
                    <Switch
                        value={isLargeText}
                        onValueChange={setIsLargeText}
                        trackColor={{ false: colors.gray300, true: colors.vibrantTeal }}
                        thumbColor={colors.white}
                    />
                </View>
            </View>

            <View style={styles.noteContainer}>
                <Text style={styles.noteText}>
                    Note: These settings are currently for demonstration. The app uses a system-aware theme by default.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.parchmentWhite,
    },
    content: {
        padding: spacing.xl,
    },
    section: {
        marginBottom: spacing['2xl'],
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray100,
    },
    sectionTitle: {
        fontFamily: typography.fontFamily.bodySemiBold,
        fontSize: typography.fontSize.sm,
        color: colors.gray500,
        marginBottom: spacing.lg,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    rowText: {
        flex: 1,
        marginRight: spacing.md,
    },
    rowTitle: {
        fontFamily: typography.fontFamily.bodyMedium,
        fontSize: typography.fontSize.base,
        color: colors.midnightNavy,
        marginBottom: 4,
    },
    rowSubtitle: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        color: colors.gray500,
    },
    noteContainer: {
        padding: spacing.lg,
        backgroundColor: colors.warmCream,
        borderRadius: borderRadius.lg,
    },
    noteText: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        color: colors.gray600,
        textAlign: 'center',
    },
});
