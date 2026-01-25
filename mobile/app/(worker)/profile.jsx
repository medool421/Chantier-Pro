// ============================================
// app/(worker)/profile.jsx - PROFIL WORKER
// ============================================
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/theme/colors';

export default function WorkerProfile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
        </View>
        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.userRole}>Ouvrier 👷</Text>
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
    </ScrollView>
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
});