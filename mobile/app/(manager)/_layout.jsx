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

      {/* Project overview */}
      <Stack.Screen
        name="project/index"
        options={{
          title: 'Mon Chantier',
        }}
      />

      {/* Project tasks */}
      <Stack.Screen
        name="project/tasks"
        options={{
          title: 'Tâches du Chantier',
        }}
      />

      {/* Project files */}
      <Stack.Screen
        name="project/files"
        options={{
          title: 'Fichiers du Chantier',
        }}
      />

      {/* Project reports */}
      <Stack.Screen
        name="project/reports"
        options={{
          title: 'Rapports',
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
