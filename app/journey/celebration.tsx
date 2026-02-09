import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, useSharedValue, withRepeat, withTiming, useAnimatedStyle, withSequence } from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function CelebrationScreen() {
    const router = useRouter();
    const scale = useSharedValue(1);

    useEffect(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        scale.value = withRepeat(withSequence(withTiming(1.1, { duration: 500 }), withTiming(1, { duration: 500 })), -1, true);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.replace('/(tabs)');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.parchmentWhite, colors.warmCream]}
                style={StyleSheet.absoluteFill}
            />

            <Animated.View entering={FadeIn.duration(1000)} style={styles.content}>
                <Animated.View style={[styles.iconContainer, animatedStyle]}>
                    <LinearGradient
                        colors={[colors.champagneGold, colors.goldDark]}
                        style={styles.iconGradient}
                    >
                        <Text style={styles.icon}>✨</Text>
                    </LinearGradient>
                </Animated.View>

                <Animated.Text entering={FadeInDown.delay(300)} style={styles.title}>
                    Momentum Unlocked
                </Animated.Text>

                <Animated.Text entering={FadeInDown.delay(500)} style={styles.message}>
                    You've taken the first bold step. This is just the beginning of your journey.
                </Animated.Text>

                <Animated.View entering={FadeInDown.delay(800)} style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={handleContinue}>
                        <Text style={styles.buttonText}>Continue Journey</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        padding: spacing.xl,
        width: '100%',
    },
    iconContainer: {
        marginBottom: spacing.xl,
        ...Platform.select({
            ios: {
                shadowColor: colors.champagneGold,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    iconGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 48,
    },
    title: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize['3xl'],
        color: colors.midnightNavy,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    message: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.lg,
        color: colors.gray600,
        textAlign: 'center',
        marginBottom: spacing['2xl'],
        lineHeight: 28,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        backgroundColor: colors.boldTerracotta,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing['2xl'],
        borderRadius: borderRadius.full,
        width: '80%',
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: typography.fontFamily.bodySemiBold,
        fontSize: typography.fontSize.lg,
        color: colors.white,
    },
});
