import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Profile() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert(
            "Déconnexion",
            "Êtes-vous sûr de vouloir vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Oui",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login'); // Or simply let the auth state change trigger navigation if setup in root layout
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {(user?.firstName?.[0] || 'U').toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
                <Text style={styles.role}>Ouvrier</Text>
            </View>

            <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                    <Ionicons name="mail-outline" size={24} color={colors.textMuted} />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user?.email}</Text>
                    </View>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons name="call-outline" size={24} color={colors.textMuted} />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Téléphone</Text>
                        <Text style={styles.infoValue}>{user?.phone || 'Non renseigné'}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
                <Text style={styles.logoutText}>Se Déconnecter</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.primary,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textDark,
        marginBottom: 4,
    },
    role: {
        fontSize: 14,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoSection: {
        marginBottom: 40,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    infoTextContainer: {
        marginLeft: 16,
    },
    infoLabel: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: colors.textDark,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFEBEE',
        padding: 16,
        borderRadius: 12,
    },
    logoutText: {
        color: '#D32F2F',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});
