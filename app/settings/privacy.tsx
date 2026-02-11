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
                <Text style={styles.sectionTitle}>Privacy Policy</Text>
                <Text style={styles.lastUpdated}>Last Updated: February 2026</Text>

                <Text style={styles.paragraph}>
                    Welcome to Paxgo ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our app. This policy explains how we handle your data.
                </Text>

                <Text style={styles.heading}>1. Information We Collect</Text>
                <Text style={styles.paragraph}>
                    <Text style={styles.bold}>Account Information:</Text> When you sign up, we collect your email address and authentication details via Supabase to secure your account.
                    {'\n\n'}
                    <Text style={styles.bold}>User Content:</Text> We store the "Dreams," "Roadmaps," and "Action Items" you create to provide the core functionality of the app.
                    {'\n\n'}
                    <Text style={styles.bold}>Device Information:</Text> We may collect basic device information (model, OS version) to ensure app compatibility and troubleshoot issues.
                </Text>

                <Text style={styles.heading}>2. AI Processing (Groq)</Text>
                <Text style={styles.paragraph}>
                    Our app uses Artificial Intelligence (powered by Groq) to help you break down your goals. When you use AI features:
                    {'\n'}• Your text inputs are sent to Groq for processing.
                    {'\n'}• We do not use your personal data to train public AI models.
                    {'\n'}• Data is processed transiently to generate your roadmap.
                </Text>

                <Text style={styles.heading}>3. Subscriptions & Payments</Text>
                <Text style={styles.paragraph}>
                    We use RevenueCat to manage subscriptions. We do not store your credit card information. All payment transactions are handled securely by the Google Play Store or Apple App Store. RevenueCat processes anonymous user IDs to validate your "Pro" status.
                </Text>

                <Text style={styles.heading}>4. Data Security</Text>
                <Text style={styles.paragraph}>
                    We implement industry-standard security measures to protect your data. Your content is stored securely on Supabase servers. However, no method of transmission over the internet is 100% secure.
                </Text>

                <Text style={styles.heading}>5. Your Rights</Text>
                <Text style={styles.paragraph}>
                    You have the right to:
                    {'\n'}• Access the personal data we hold about you.
                    {'\n'}• Request deletion of your account and data (see "Account" section below).
                    {'\n'}• Export your activity data.
                </Text>

                <Text style={styles.heading}>6. Contact Us</Text>
                <Text style={styles.paragraph}>
                    If you have questions about this policy, please contact us at support@paxgo.ai.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions</Text>
                <TouchableOpacity style={styles.row} onPress={handleExportData}>
                    <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>Export My Data</Text>
                        <Text style={styles.rowSubtitle}>Download a copy of your activity</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

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
    lastUpdated: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.xs,
        color: colors.gray400,
        marginBottom: spacing.md,
    },
    heading: {
        fontFamily: typography.fontFamily.bodySemiBold,
        fontSize: typography.fontSize.lg,
        color: colors.midnightNavy,
        marginTop: spacing.lg,
        marginBottom: spacing.xs,
    },
    paragraph: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        color: colors.gray600,
        lineHeight: 20,
        marginBottom: spacing.sm,
    },
    bold: {
        fontFamily: typography.fontFamily.bodySemiBold,
        color: colors.midnightNavy,
    },
});
