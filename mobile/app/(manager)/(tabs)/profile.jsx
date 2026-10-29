// ============================================
// app/(manager)/profile.jsx - PROFIL MANAGER
// ============================================
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';
import { colors } from '../../../src/theme/colors';
import api from '../../../src/api/axios';

export default function ManagerProfile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const canDelete = deleteConfirmation.trim().toUpperCase() === 'SUPPRIMER';

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
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
    <>
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
        </View>
        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.userRole}>Chef de Chantier 👷‍♂️</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.infoCard}>
          <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
          <Text style={styles.infoText}>{user?.email}</Text>
        </View>
        {user?.phone && (
          <View style={styles.infoCard}>
            <Ionicons name="call-outline" size={20} color={colors.textMuted} />
            <Text style={styles.infoText}>{user?.phone}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Zone de danger</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => setDeleteModalVisible(true)}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  header: { alignItems: 'center', padding: 40, backgroundColor: '#fff' },
  avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarLargeText: { fontSize: 36, fontWeight: 'bold', color: colors.primary },
  userName: { fontSize: 24, fontWeight: 'bold', color: colors.textDark },
  userRole: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark, marginBottom: 12 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  infoText: { marginLeft: 12, fontSize: 16, color: colors.textDark },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 20, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.error },
  logoutText: { color: colors.error, fontWeight: '600', marginLeft: 8 },
  dangerZone: { marginHorizontal: 20, marginBottom: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#FEE2E2' },
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
