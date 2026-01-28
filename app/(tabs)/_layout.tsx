import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '@/constants/theme';

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
  color: string;
}

function TabIcon({ icon, label, focused, color }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
        <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>{icon}</Text>
      </View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: focused ? colors.boldTerracotta : colors.gray500,
            fontFamily: focused ? typography.fontFamily.bodySemiBold : typography.fontFamily.body,
          },
        ]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.boldTerracotta,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          backgroundColor: colors.parchmentWhite,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.gray200,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: tabBarHeight,
          paddingTop: 8,
          elevation: 0,
          shadowColor: colors.midnightNavy,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.bodyMedium,
          fontSize: 11,
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
    minWidth: 60,
    paddingHorizontal: 4,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginBottom: 2,
  },
  iconWrapperFocused: {
    backgroundColor: `${colors.boldTerracotta}10`,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0,
    textAlign: 'center',
    lineHeight: 14,
    includeFontPadding: false,
  },
});
