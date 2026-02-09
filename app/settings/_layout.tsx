import { Stack } from 'expo-router';
import { colors, typography } from '@/constants/theme';

export default function SettingsLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.parchmentWhite,
                },
                headerTitleStyle: {
                    fontFamily: typography.fontFamily.heading,
                    color: colors.midnightNavy,
                    fontSize: typography.fontSize.lg,
                },
                headerTintColor: colors.boldTerracotta,
                headerShadowVisible: false,
                contentStyle: {
                    backgroundColor: colors.parchmentWhite,
                },
            }}
        >
            <Stack.Screen
                name="appearance"
                options={{ title: 'Appearance' }}
            />
            <Stack.Screen
                name="privacy"
                options={{ title: 'Privacy & Security' }}
            />
            <Stack.Screen
                name="help"
                options={{ title: 'Help & Support' }}
            />
        </Stack>
    );
}
