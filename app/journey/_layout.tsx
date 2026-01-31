import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function JourneyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.parchmentWhite },
      }}
    >
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="stuck-point" />
      <Stack.Screen name="dream-input" />
      <Stack.Screen name="create-account" />
      <Stack.Screen name="first-dialogue" />
      <Stack.Screen name="permission-slip" />
      <Stack.Screen name="first-action" />
      <Stack.Screen name="celebration" />
    </Stack>
  );
}
