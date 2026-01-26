import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function ManagerLayout() {
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
        }}
      />

      {/* Project details */}
      <Stack.Screen
        name="projects/[id]"
        options={{
          title: 'Détails du Projet',
        }}
      />

      {/* Project tasks */}
      <Stack.Screen
        name="projects/[id]/tasks/index"
        options={{
          title: 'Tâches du Projet',
        }}
      />

      {/* Create task */}
      <Stack.Screen
        name="projects/[id]/tasks/create"
        options={{
          title: 'Nouvelle Tâche',
        }}
      />

      {/* Team */}
      <Stack.Screen
        name="projects/[id]/team/team"
        options={{
          title: 'Équipe du Projet',
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
