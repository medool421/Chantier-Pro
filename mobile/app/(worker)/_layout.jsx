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
      {/* Dashboard */}
      <Stack.Screen
        name="index"
        options={{
          title: 'Tableau de bord',
          headerShown:false,
        }}
      />

      {/* Project tasks */}
      <Stack.Screen
        name="tasks/[id]"
        options={{
          title: 'Details de Tache',
        }}
      />


      {/* Profile */}
      <Stack.Screen
        name="profile"
        options={{
          title: 'Mon Profil',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
