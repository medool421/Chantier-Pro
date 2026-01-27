import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function BossLayout() {
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
                name="index"
                options={{
                    headerShown: false,
                    title: 'Dashboard'
                }}
            />
            <Stack.Screen
                name="projects/create"
                options={{
                    title: 'Nouveau Chantier',
                    presentation: 'modal' // Optional: nice effect for creation
                }}
            />
            <Stack.Screen
                name="projects/[id]"
                options={{
                    title: 'Détails du Chantier'
                }}
            />
            <Stack.Screen
                name="projects/[id]/tasks"
                options={{
                    title: 'Taches du Chantier'
                }}
            />
            <Stack.Screen
                name="projects/[id]/team"
                options={{
                    title: 'Equipe du Chantier'
                }}
            />
            <Stack.Screen
                name="projects/assign-manager"
                options={{
                    title: 'Assigner un Chef d\'équipe'
                }}
            />
            <Stack.Screen
                name="reports/[projectId]"
                options={{
                    title: 'Rapports du Chantier'
                }}
            />
            <Stack.Screen
                name="profile"
                options={{
                    title: 'Mon Profil',
                    presentation: 'modal'
                }}
            />
        </Stack>
    );
}
