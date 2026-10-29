import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Modal, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useAuthStore } from '../../../src/store/auth.store';
import { colors } from '../../../src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../../src/api/axios';

export default function Profile() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const router = useRouter();
    const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
    const [isDeleting, setIsDeleting] = React.useState(false);
    const canDelete = deleteConfirmation.trim().toUpperCase() === 'SUPPRIMER';

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

    const handleDeleteAccount = async () => {
        if (!canDelete || isDeleting) return;
        setIsDeleting(true);
        try {
            await api.delete('/users/me');
            setDeleteModalVisible(false);
            setDeleteConfirmation('');
            await logout();
            router.replace('/(auth)/login');
            Alert.alert('Compte supprimé', 'Votre compte a été supprimé.');
        } catch (error) {
            setIsDeleting(false);
            Alert.alert('Suppression impossible', error.response?.data?.message || 'Une erreur est survenue. Réessayez.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {(user?.firstName?.[0] || 'U').toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
                <Text style={styles.role}>Administrateur / Boss</Text>
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

            <View style={styles.dangerZone}>
                <Text style={styles.dangerTitle}>Zone de danger</Text>
                <TouchableOpacity style={styles.deleteButton} onPress={() => setDeleteModalVisible(true)}>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => !isDeleting && setDeleteModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Ionicons name="warning-outline" size={32} color={colors.error} />
                        <Text style={styles.modalTitle}>Supprimer définitivement votre compte ?</Text>
                        <Text style={styles.modalDescription}>Cette action est irréversible. Vos accès et informations personnelles seront définitivement supprimés.</Text>
                        <TextInput
                            style={styles.confirmationInput}
                            value={deleteConfirmation}
                            onChangeText={setDeleteConfirmation}
                            placeholder="Tapez SUPPRIMER pour confirmer"
                            autoCapitalize="characters"
                            autoCorrect={false}
                            editable={!isDeleting}
                        />
                        <TouchableOpacity style={[styles.confirmDeleteButton, (!canDelete || isDeleting) && styles.disabledButton]} onPress={handleDeleteAccount} disabled={!canDelete || isDeleting}>
                            {isDeleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmDeleteText}>Supprimer définitivement mon compte</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelDeleteButton} onPress={() => { setDeleteModalVisible(false); setDeleteConfirmation(''); }} disabled={isDeleting}>
                            <Text style={styles.cancelDeleteText}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
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
    dangerZone: { marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#FEE2E2' },
    dangerTitle: { color: colors.error, fontSize: 14, fontWeight: '700', marginBottom: 12 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error, padding: 15, borderRadius: 12 },
    deleteButtonText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 8 },
    modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.55)' },
    modalCard: { backgroundColor: '#fff', borderRadius: 18, padding: 24, alignItems: 'center' },
    modalTitle: { color: colors.textDark, fontSize: 20, lineHeight: 27, fontWeight: '700', textAlign: 'center', marginTop: 12 },
    modalDescription: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, marginBottom: 18 },
    confirmationInput: { width: '100%', minHeight: 50, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, color: colors.textDark, marginBottom: 14 },
    confirmDeleteButton: { width: '100%', minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
    disabledButton: { opacity: 0.45 },
    confirmDeleteText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
    cancelDeleteButton: { padding: 14, marginTop: 4 },
    cancelDeleteText: { color: colors.textMuted, fontWeight: '600' },
});
