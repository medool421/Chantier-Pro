import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function WorkerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.backgroundLight,
        },
        headerTintColor: colors.textDark,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: colors.backgroundLight,
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="tasks/[id]"
        options={{
          title: 'Détails de la Tâche'
        }}
      />
    </Stack>
  );
}
