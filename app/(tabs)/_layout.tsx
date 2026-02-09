import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '@/constants/theme';
import { Target, Trophy, User } from 'lucide-react-native';

interface TabIconProps {
  icon: React.ElementType;
  label: string;
  focused: boolean;
  color: string;
}

function TabIcon({ icon: Icon, label, focused, color }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
        <Icon size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
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
      {/* Today tab - THE main action (one thing at a time) */}
      <Tabs.Screen
        name="action"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={Target} label="Today" focused={focused} color={color} />
          ),
          tabBarLabel: () => null,
        }}
      />
      {/* Wins tab - Completed actions and celebrations */}
      <Tabs.Screen
        name="wins"
        options={{
          title: 'Wins',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={Trophy} label="Wins" focused={focused} color={color} />
          ),
          tabBarLabel: () => null,
        }}
      />
      {/* You tab - Profile, Dreams, Settings, Chat access */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={User} label="You" focused={focused} color={color} />
          ),
          tabBarLabel: () => null,
        }}
      />
      {/* Hidden tabs - keep files but hide from tab bar */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="dreams" options={{ href: null }} />
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
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0,
    textAlign: 'center',
    lineHeight: 14,
    includeFontPadding: false,
  },
});
