import React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Linking, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../../src/theme/colors';
import { useProjectTeam } from '../../../../../src/hooks/useProjects';

export default function ManagerTeam() {
  const { id: projectId } = useLocalSearchParams();
  const { data: teamData, isLoading, isError, refetch } = useProjectTeam(projectId);

  const teamObj = Array.isArray(teamData) ? teamData[0] : teamData;
  const workers = teamObj?.members || [];

  const renderWorker = ({ item }) => {
    const user = item.user;
    if (!user) return null;

    return (
      <View style={styles.workerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.firstName?.[0]}{user.lastName?.[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.workerName}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.workerEmail}>{user.email}</Text>
          <Text style={styles.roleBadge}>{item.roleInTeam}</Text>
        </View>
        {user.phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${user.phone}`)}>
            <Ionicons name="call-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !teamObj) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="people-outline" size={48} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, marginTop: 12 }}>Impossible de charger l'équipe</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        renderItem={renderWorker}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun membre dans l'équipe</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight, padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 24 },
  workerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  workerName: { fontSize: 16, fontWeight: '600', color: colors.textDark },
  workerEmail: { fontSize: 12, color: colors.textMuted },
  roleBadge: { fontSize: 10, color: colors.primary, backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textMuted, fontSize: 16, marginTop: 16 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});