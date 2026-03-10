import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../src/utils/constants';
import { useProjectTasks } from '../../src/hooks/useTasks';

const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();
const getStatusColor = (s) => ({ TODO: '#E3F2FD', IN_PROGRESS: '#E8F5E9', BLOCKED: '#FFEBEE', COMPLETED: '#F3E5F5' }[s] || '#F5F5F5');
const getPriorityColor = (p) => ({ LOW: '#E8F5E9', NORMAL: '#E3F2FD', HIGH: '#FFF3E0', URGENT: '#FFEBEE' }[p] || '#F5F5F5');

export default function ManagerTasksList() {
  const router = useRouter();
  const { projectId, id } = useLocalSearchParams();
  const resolvedProjectId = projectId || id;
  const [filter, setFilter] = useState('ALL');

  const { data: tasks = [], isLoading, isRefetching, refetch, isError } = useProjectTasks(resolvedProjectId);

  const getFilteredTasks = () =>
    filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => router.push(`/(manager)/projects/[id]/tasks/${item.id}`)}
    >
      <View style={styles.taskHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.taskTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.projectName} numberOfLines={1}>📁 {item.project?.name || 'Projet'}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{TASK_PRIORITY_LABELS[item.priority] || 'Normal'}</Text>
        </View>
      </View>

      <Text style={styles.taskDescription} numberOfLines={2}>{item.description || 'Aucune description'}</Text>

      <View style={styles.taskFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{TASK_STATUS_LABELS[item.status] || 'À faire'}</Text>
        </View>

        {item.assignee && (
          <View style={styles.assigneeContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.assignee.firstName?.[0]}{item.assignee.lastName?.[0]}
              </Text>
            </View>
            <Text style={styles.assigneeName} numberOfLines={1}>
              {item.assignee.firstName} {item.assignee.lastName}
            </Text>
          </View>
        )}

        {item.dueDate && (
          <View style={styles.dueDateContainer}>
            <Ionicons name="calendar-outline" size={14} color={isOverdue(item.dueDate) ? colors.error : colors.textMuted} />
            <Text style={[styles.dueDateText, isOverdue(item.dueDate) && styles.overdueText]}>
              {new Date(item.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'].map((status) => (
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
        </ScrollView>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tâches du projet</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push({ pathname: `/(manager)/projects/${resolvedProjectId}/tasks/create`, params: { projectId: resolvedProjectId } })}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={getFilteredTasks()}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkbox-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyText}>{isError ? 'Erreur de chargement' : 'Aucune tâche'}</Text>
              {isError && (
                <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                  <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  filterContainer: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', marginRight: 8 },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 14, color: colors.textDark, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.textDark },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  taskCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: colors.textDark, marginBottom: 4 },
  projectName: { fontSize: 12, color: colors.textMuted },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8, height: 24, justifyContent: 'center' },
  priorityText: { fontSize: 10, fontWeight: '600', color: colors.textDark },
  taskDescription: { fontSize: 14, color: colors.textMuted, marginBottom: 12, lineHeight: 20 },
  taskFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.textDark },
  assigneeContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  avatarText: { fontSize: 10, fontWeight: 'bold', color: colors.primary },
  assigneeName: { fontSize: 12, color: colors.textMuted, flex: 1 },
  dueDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueDateText: { fontSize: 12, color: colors.textMuted },
  overdueText: { color: colors.error, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textMuted, fontSize: 16, marginTop: 16 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});