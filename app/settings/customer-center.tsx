import React from 'react';
import { View, StyleSheet } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';

export default function CustomerCenterScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <RevenueCatUI.CustomerCenterView
                onRestoreCompleted={(customerInfo) => {
                    console.log('Restore completed', customerInfo);
                }}
                onDismiss={() => router.back()}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.parchmentWhite,
    },
});
