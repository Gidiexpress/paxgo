import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { useAuth } from '@fastshot/auth';

export default function PrivacyScreen() {
    const router = useRouter();
    const { signOut } = useAuth();

    const handleExportData = () => {
        Alert.alert('Export Data', 'Your data export request has been received. You will receive an email shortly.');
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to permanently delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        // Logic would go here
                        await signOut();
                        router.replace('/');
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data & Personalization</Text>

                <TouchableOpacity style={styles.row} onPress={handleExportData}>
                    <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>Export My Data</Text>
                        <Text style={styles.rowSubtitle}>Download a copy of your activity</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.row}>
                    <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>Privacy Policy</Text>
                        <Text style={styles.rowSubtitle}>Read our privacy commitment</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                    <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>
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
        paddingVertical: spacing.sm,
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
    chevron: {
        fontSize: 20,
        color: colors.gray400,
        fontFamily: typography.fontFamily.body,
    },
    divider: {
        height: 1,
        backgroundColor: colors.gray100,
        marginVertical: spacing.md,
    },
    deleteButton: {
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontFamily: typography.fontFamily.bodySemiBold,
        fontSize: typography.fontSize.base,
        color: '#FF3B30', // System red
    },
});
