import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import api from '../../src/api/axios';

export default function ManagerTeam() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await api.get('/users', { params: { role: 'WORKER' } });
      setWorkers(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderWorker = ({ item }) => (
    <View style={styles.workerCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.firstName?.[0]}{item.lastName?.[0]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.workerName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.workerEmail}>{item.email}</Text>
      </View>
      {item.phone && (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
          <Ionicons name="call-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Équipe ({workers.length})</Text>
      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        renderItem={renderWorker}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun membre d'équipe</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight, padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.textDark, marginBottom: 20 },
  listContent: { paddingBottom: 24 },
  workerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  workerName: { fontSize: 16, fontWeight: '600', color: colors.textDark },
  workerEmail: { fontSize: 12, color: colors.textMuted },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textMuted, fontSize: 16, marginTop: 16 },
});

