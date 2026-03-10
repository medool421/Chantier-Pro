import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity, ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../src/theme/colors';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../../../src/utils/constants';
import { useProjectTasks } from '../../../../src/hooks/useTasks';

export default function ProjectTasks() {
  const { id } = useLocalSearchParams();
  const [filter, setFilter] = useState('ALL');

  const { data: tasks = [], isLoading, isRefetching, refetch } = useProjectTasks(id);

  const getFilteredTasks = () =>
    filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  const getTaskCounts = () => ({
    todo: tasks.filter((t) => t.status === 'TODO').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
  });

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

  const getStatusColor = (status) => ({
    TODO: '#E3F2FD', IN_PROGRESS: '#E8F5E9', BLOCKED: '#FFEBEE', COMPLETED: '#F3E5F5',
  }[status] || '#F5F5F5');

  const getPriorityColor = (priority) => ({
    LOW: '#E8F5E9', NORMAL: '#E3F2FD', HIGH: '#FFF3E0', URGENT: '#FFEBEE',
  }[priority] || '#F5F5F5');

  const counts = getTaskCounts();

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
          {item.project && (
            <Text style={styles.projectName} numberOfLines={1}>📁 {item.project.name}</Text>
          )}
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{TASK_PRIORITY_LABELS[item.priority] || item.priority}</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.taskDescription} numberOfLines={2}>{item.description}</Text>
      )}

      <View style={styles.taskFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{TASK_STATUS_LABELS[item.status] || item.status}</Text>
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
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsContainer}>
        {[
          { value: counts.todo, label: 'À faire' },
          { value: counts.inProgress, label: 'En cours' },
          { value: counts.completed, label: 'Terminées' },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Filters */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
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

      {/* Tasks List */}
      <FlatList
        data={getFilteredTasks()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkbox-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aucune tâche</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'ALL' ? "Ce projet n'a pas encore de tâches" : `Aucune tâche avec le statut "${TASK_STATUS_LABELS[filter]}"`}
              </Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  statsContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 20, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  filterWrapper: { backgroundColor: colors.backgroundLight, marginBottom: 16 },
  filterContainer: { paddingHorizontal: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', marginRight: 8 },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 14, color: colors.textDark, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  taskCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 12 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: colors.textDark, marginBottom: 4 },
  projectName: { fontSize: 12, color: colors.textMuted },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, height: 24, justifyContent: 'center' },
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
  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyText: { color: colors.textDark, fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySubtext: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});