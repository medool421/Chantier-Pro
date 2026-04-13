import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.backgroundLight },
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register-boss" />
      <Stack.Screen name="invite-register" />
    </Stack>
  );
}
