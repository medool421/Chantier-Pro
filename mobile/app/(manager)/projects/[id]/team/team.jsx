import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Linking, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../../src/theme/colors';
import api from '../../../../../src/api/axios';

export default function ManagerTeam() {
  const { id: projectId } = useLocalSearchParams();
  const [team, setTeam] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Project Team
      const teamRes = await api.get(`/projects/${projectId}/team`);
      console.log('Team Response:', teamRes.data);
      const teamData = Array.isArray(teamRes.data?.data) ? teamRes.data?.data[0] : teamRes.data?.data;

      setTeam(teamData);
      setWorkers(teamData?.members || []);
      
    } catch (error) {
      console.error('Error fetching team data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données de l\'équipe');
    } finally {
      setLoading(false);
    }
  };

  const renderWorker = ({ item }) => {
  const user = item.user;

  if (!user) return null;

  return (
    <View style={styles.workerCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.firstName?.[0]}{user.lastName?.[0]}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.workerName}>
          {user.firstName} {user.lastName}
        </Text>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight, padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.textDark },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 4 },
  listContent: { paddingBottom: 24 },
  workerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  workerName: { fontSize: 16, fontWeight: '600', color: colors.textDark },
  workerEmail: { fontSize: 12, color: colors.textMuted },
  roleBadge: { fontSize: 10, color: colors.primary, backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textMuted, fontSize: 16, marginTop: 16 },
});

