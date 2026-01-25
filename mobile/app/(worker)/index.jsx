// ============================================
// app/(worker)/index.jsx - DASHBOARD WORKER (MES TÂCHES)
// ============================================
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/theme/colors';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../src/utils/constants';
import api from '../../src/api/axios';

export default function WorkerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useFocusEffect(
    useCallback(() => {
      fetchMyTasks();
    }, [])
  );

  const fetchMyTasks = async () => {
    try {
      const response = await api.get('/tasks/my');
      setTasks(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyTasks();
  };

  const getFilteredTasks = () => {
    if (filter === 'ALL') return tasks;
    return tasks.filter(t => t.status === filter);
  };

  const getTaskCounts = () => {
    return {
      all: tasks.length,
      todo: tasks.filter(t => t.status === 'TODO').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
    };
  };

  const counts = getTaskCounts();

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => router.push(`/(worker)/tasks/${item.id}`)}
    >
      <View style={styles.taskHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.projectName} numberOfLines={1}>
            📁 {item.project?.name || 'Projet'}
          </Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>
            {TASK_PRIORITY_LABELS[item.priority]}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.taskDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.taskFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {TASK_STATUS_LABELS[item.status]}
          </Text>
        </View>

        {item.dueDate && (
          <View style={styles.dueDateContainer}>
            <Ionicons 
              name="calendar-outline" 
              size={14} 
              color={isOverdue(item.dueDate) ? colors.error : colors.textMuted} 
            />
            <Text style={[
              styles.dueDateText,
              isOverdue(item.dueDate) && styles.overdueText
            ]}>
              {new Date(item.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.username}>{user?.firstName || 'Worker'} 👷</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/(worker)/profile')}
        >
          <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{counts.todo}</Text>
          <Text style={styles.statLabel}>À faire</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{counts.inProgress}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{counts.completed}</Text>
          <Text style={styles.statLabel}>Terminées</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, filter === status && styles.filterChipActive]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
              {status === 'ALL' ? 'Toutes' : TASK_STATUS_LABELS[status]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tasks List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={getFilteredTasks()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkbox-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aucune tâche</Text>
              <Text style={styles.emptySubtext}>
                Votre chef de chantier vous assignera des tâches
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const isOverdue = (dueDate) => new Date(dueDate) < new Date();
const getStatusColor = (status) => ({
  TODO: '#E3F2FD',
  IN_PROGRESS: '#E8F5E9',
  BLOCKED: '#FFEBEE',
  COMPLETED: '#F3E5F5',
}[status] || '#F5F5F5');
const getPriorityColor = (priority) => ({
  LOW: '#E8F5E9',
  NORMAL: '#E3F2FD',
  HIGH: '#FFF3E0',
  URGENT: '#FFEBEE',
}[priority] || '#F5F5F5');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  greeting: { fontSize: 16, color: colors.textMuted },
  username: { fontSize: 24, fontWeight: 'bold', color: colors.textDark },
  profileButton: {},
  statsContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  filterContainer: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5' },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 14, color: colors.textDark, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  taskCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: colors.textDark, marginBottom: 4 },
  projectName: { fontSize: 12, color: colors.textMuted },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  priorityText: { fontSize: 10, fontWeight: '600', color: colors.textDark },
  taskDescription: { fontSize: 14, color: colors.textMuted, marginBottom: 12, lineHeight: 20 },
  taskFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.textDark },
  dueDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueDateText: { fontSize: 12, color: colors.textMuted },
  overdueText: { color: colors.error, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textDark, fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySubtext: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});

