// ============================================
// app/(worker)/projects.jsx - MES PROJETS
// ============================================
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { PROJECT_STATUS_LABELS } from '../../src/utils/constants';
import api from '../../src/api/axios';

export default function WorkerProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderProject = ({ item }) => (
    <View style={styles.projectCard}>
      <Text style={styles.projectTitle}>{item.name}</Text>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{PROJECT_STATUS_LABELS[item.status]}</Text>
      </View>
      {item.address && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <Text style={styles.infoText}>{item.address}</Text>
        </View>
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
      <Text style={styles.title}>Mes Projets ({projects.length})</Text>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun projet</Text>
          </View>
        }
      />
    </View>
  );
}

const getStatusColor = (status) => ({
  PLANNED: '#E3F2FD',
  IN_PROGRESS: '#C8E6C9',
  ON_HOLD: '#FFF3E0',
  COMPLETED: '#F3E5F5',
}[status] || '#F5F5F5');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight, padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.textDark, marginBottom: 20 },
  listContent: { paddingBottom: 24 },
  projectCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  projectTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8 },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.textDark },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { marginLeft: 8, color: colors.textMuted, fontSize: 14 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textMuted, fontSize: 16, marginTop: 16 },
});

