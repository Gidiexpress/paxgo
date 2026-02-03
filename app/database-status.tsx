import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { DatabaseSchemaStatus } from '@/components/DatabaseSchemaStatus';
import { colors } from '@/constants/theme';

export default function DatabaseStatusScreen() {

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Database Status',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.parchmentWhite,
          },
          headerTintColor: colors.midnightNavy,
          headerShadowVisible: false,
        }}
      />

      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      <DatabaseSchemaStatus />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
