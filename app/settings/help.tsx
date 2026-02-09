import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function HelpScreen() {
    const handleContact = () => {
        Linking.openURL('mailto:support@theboldmove.com?subject=Support Request');
    };

    const faqs = [
        {
            q: 'How do I add a new dream?',
            a: 'Go to your Profile tab and tap the "+ New" button near your Dreams section.'
        },
        {
            q: 'Can I edit my actions?',
            a: 'Yes! Tap the "Refine" button on any action card to use AI to improve it, or swipe left to edit.'
        },
        {
            q: 'What are Hype Squads?',
            a: 'Hype Squads are groups of like-minded dreamers who cheer each other on. Join one to boost your motivation!'
        }
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

                {faqs.map((faq, index) => (
                    <View key={index} style={styles.faqItem}>
                        <Text style={styles.question}>{faq.q}</Text>
                        <Text style={styles.answer}>{faq.a}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Us</Text>
                <Text style={styles.contactText}>
                    Need more help? Our team is here to support your journey.
                </Text>
                <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
                    <Text style={styles.contactButtonText}>Email Support</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.versionText}>The Bold Move v1.0.0</Text>
                <Text style={styles.copyrightText}>© 2024 Paxgo Inc.</Text>
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
    faqItem: {
        marginBottom: spacing.lg,
    },
    question: {
        fontFamily: typography.fontFamily.bodySemiBold,
        fontSize: typography.fontSize.base,
        color: colors.midnightNavy,
        marginBottom: spacing.xs,
    },
    answer: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        color: colors.gray600,
        lineHeight: 20,
    },
    contactText: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.base,
        color: colors.midnightNavy,
        marginBottom: spacing.lg,
    },
    contactButton: {
        backgroundColor: colors.boldTerracotta,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    contactButtonText: {
        fontFamily: typography.fontFamily.bodySemiBold,
        fontSize: typography.fontSize.base,
        color: colors.white,
    },
    footer: {
        alignItems: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing['2xl'],
    },
    versionText: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        color: colors.gray500,
    },
    copyrightText: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.xs,
        color: colors.gray400,
        marginTop: 4,
    },
});
