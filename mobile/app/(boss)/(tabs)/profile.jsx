import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useAuthStore } from '../../../src/store/auth.store';
import { colors } from '../../../src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../../src/api/axios';
import { useKeyboardAwareModal } from '../../../src/hooks/useKeyboardAwareModal';

const DANGER_COLOR = '#D32F2F';

export default function Profile() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const router = useRouter();
    const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
    const [isDeleting, setIsDeleting] = React.useState(false);
    const canDelete = deleteConfirmation.trim().toUpperCase() === 'SUPPRIMER';

    const deleteModalKeyboard = useKeyboardAwareModal({
        isVisible: deleteModalVisible,
    });

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
                        router.replace('/(auth)/login');
                    }
                }
            ]
        );
    };

    const closeDeleteModal = () => {
        if (isDeleting) return;
        deleteModalKeyboard.dismissAndReset(() => {
            setDeleteModalVisible(false);
            setDeleteConfirmation('');
        });
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
            Alert.alert(
                'Suppression impossible',
                error.response?.data?.message || 'Une erreur est survenue. Réessayez.'
            );
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
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

            {/* Logout button */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Se Déconnecter"
            >
                <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
                <Text style={styles.logoutText}>Se Déconnecter</Text>
            </TouchableOpacity>

            {/* Danger Zone */}
            <View style={styles.dangerZone}>
                <Text style={styles.dangerTitle}>Zone de danger</Text>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setDeleteModalVisible(true)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Supprimer mon compte"
                >
                    <Ionicons name="trash-outline" size={24} color={DANGER_COLOR} />
                    <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
                </TouchableOpacity>
            </View>

            {/* Delete Account Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeDeleteModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={[styles.modalBackdrop, deleteModalKeyboard.modalKeyboardStyle]}
                >
                    <View style={styles.modalCard}>
                        {/* Top-Right Close Button */}
                        <TouchableOpacity
                            style={styles.closeIconButton}
                            onPress={closeDeleteModal}
                            disabled={isDeleting}
                            hitSlop={10}
                        >
                            <Ionicons name="close" size={20} color="#64748B" />
                        </TouchableOpacity>

                        {/* Header Warning Icon */}
                        <View style={styles.modalIconWrapper}>
                            <Ionicons name="trash-outline" size={28} color={DANGER_COLOR} />
                        </View>

                        {/* Title & Subtitle */}
                        <Text style={styles.modalTitle}>Supprimer le compte ?</Text>
                        <Text style={styles.modalSubtitle}>
                            Cette action est irréversible.
                        </Text>

                        {/* Scannable Consequence Callout Box */}
                        <View style={styles.warningCallout}>
                            <View style={styles.bulletRow}>
                                <View style={styles.bulletDot} />
                                <Text style={styles.bulletText}>Vos chantiers et projets</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bulletDot} />
                                <Text style={styles.bulletText}>Vos accès et partages</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bulletDot} />
                                <Text style={styles.bulletText}>Vos informations personnelles</Text>
                            </View>
                        </View>

                        {/* Inline Instruction Label + Left-Aligned Input */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>
                                Saisissez{' '}
                                <Text style={styles.inlineKeyword}>SUPPRIMER</Text>{' '}
                                pour confirmer
                            </Text>

                            <View
                                style={[
                                    styles.inputWrapper,
                                    canDelete && styles.confirmationInputValid,
                                ]}
                            >
                                <TextInput
                                    style={styles.confirmationInput}
                                    value={deleteConfirmation}
                                    onChangeText={setDeleteConfirmation}
                                    placeholder="SUPPRIMER"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    editable={!isDeleting}
                                />
                                {canDelete && (
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={20}
                                        color={DANGER_COLOR}
                                    />
                                )}
                            </View>
                        </View>

                        {/* Action Buttons Row */}
                        <View style={styles.buttonRow}>
                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={styles.cancelDeleteButton}
                                onPress={closeDeleteModal}
                                disabled={isDeleting}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelDeleteText}>Annuler</Text>
                            </TouchableOpacity>

                            {/* Confirm Delete Button */}
                            <TouchableOpacity
                                style={[
                                    styles.confirmDeleteButton,
                                    (!canDelete || isDeleting) && styles.disabledButton,
                                ]}
                                onPress={handleDeleteAccount}
                                disabled={!canDelete || isDeleting}
                                activeOpacity={0.8}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="trash-outline"
                                            size={18}
                                            color="#FFFFFF"
                                            style={styles.buttonIcon}
                                        />
                                        <Text style={styles.confirmDeleteText}>
                                            Supprimer
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 120,
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
    dangerZone: {
        marginTop: 28,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#FEE2E2',
    },
    dangerTitle: {
        color: DANGER_COLOR,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 16,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFEBEE',
        padding: 16,
        borderRadius: 12,
    },
    deleteButtonText: {
        color: DANGER_COLOR,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },

    // --- UPDATED MODAL STYLES ---
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 22,
        paddingTop: 24,
        paddingBottom: 22,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    closeIconButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    modalIconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
        marginBottom: 18,
    },

    // Red Consequence Callout Box
    warningCallout: {
        width: '100%',
        backgroundColor: '#FFF5F5',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: DANGER_COLOR,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 18,
        gap: 6,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bulletDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: DANGER_COLOR,
        marginRight: 10,
    },
    bulletText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#450A0A',
    },

    // Input Section
    inputSection: {
        width: '100%',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13.5,
        color: colors.textDark,
        marginBottom: 8,
        fontWeight: '500',
    },
    inlineKeyword: {
        fontWeight: '700',
        color: DANGER_COLOR,
        letterSpacing: 0.4,
    },
    inputWrapper: {
        width: '100%',
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    confirmationInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: colors.textDark,
        letterSpacing: 0.5,
        paddingVertical: 0,
    },
    confirmationInputValid: {
        borderColor: DANGER_COLOR,
        backgroundColor: '#FFFBFB',
    },

    // Side-by-Side Action Buttons
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    cancelDeleteButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelDeleteText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#475569',
    },
    confirmDeleteButton: {
        flex: 1.15,
        height: 48,
        borderRadius: 12,
        backgroundColor: DANGER_COLOR,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: DANGER_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    disabledButton: {
        opacity: 0.5,
        elevation: 0,
        shadowOpacity: 0,
    },
    buttonIcon: {
        marginRight: 6,
    },
    confirmDeleteText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
