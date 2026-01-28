import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_COUNT = 4;
const TAB_WIDTH = SCREEN_WIDTH / TAB_COUNT;

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
  color: string;
}

function TabIcon({ icon, label, focused, color }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.7 }]}>{icon}</Text>
      <Text
        style={[
          styles.tabLabel,
          {
            color,
            fontFamily: focused ? typography.fontFamily.bodySemiBold : typography.fontFamily.body,
          },
        ]}
        numberOfLines={1}
        ellipsizeMode="clip"
        adjustsFontSizeToFit={false}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.boldTerracotta,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          backgroundColor: colors.parchmentWhite,
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.xs,
          height: 56 + (insets.bottom > 0 ? insets.bottom : spacing.xs),
          paddingTop: spacing.xs,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.bodyMedium,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="🏠" label="Home" focused={focused} color={color} />
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="action"
        options={{
          title: 'Action',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="⚡" label="Action" focused={focused} color={color} />
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="wins"
        options={{
          title: 'Wins',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="🏆" label="Wins" focused={focused} color={color} />
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="👤" label="Profile" focused={focused} color={color} />
          ),
          tabBarLabel: () => null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: TAB_WIDTH - 8,
    maxWidth: 80,
    paddingHorizontal: 2,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.3,
    textAlign: 'center',
    lineHeight: 12,
  },
});
