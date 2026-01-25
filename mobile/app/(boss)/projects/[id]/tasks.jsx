import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../../src/api/axios';
import { colors } from '../../../../src/theme/colors';

export default function ProjectTasks() {
  const { id } = useLocalSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) fetchTasks();
  }, [id]);

  const fetchTasks = async () => {
    try {
      const res = await api.get(`tasks/projects/${id}/tasks`);
      setTasks(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchTasks} />
      }
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <Text style={styles.empty}>Aucune tâche pour ce projet</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Ionicons name="checkbox-outline" size={22} color={colors.primary} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>Statut : {item.status}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: { fontWeight: '600', fontSize: 16 },
  subtitle: { fontSize: 12, color: colors.textMuted },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
