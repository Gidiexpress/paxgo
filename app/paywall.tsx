import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';

export default function PaywallScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 
        RevenueCat Native Paywall
        - Automatically fetches current offering
        - Handles purchase logic internally
        - adapting UI based on RC dashboard configuration
      */}
      <RevenueCatUI.Paywall
        onPurchaseCompleted={(customerInfo) => {
          console.log('Purchase completed', customerInfo);
          router.back();
        }}
        onRestoreCompleted={(customerInfo) => {
          console.log('Restore completed', customerInfo);
          router.back();
        }}
        onDismiss={() => router.back()}
        options={{
          displayCloseButton: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
