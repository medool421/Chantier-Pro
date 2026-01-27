import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../../src/api/axios';
import { colors } from '../../../../src/theme/colors';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../../../src/utils/constants';

export default function ProjectTasks() {
  const { id } = useLocalSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useFocusEffect(
    useCallback(() => {
      if (id) fetchTasks();
    }, [id])
  );

  const fetchTasks = async () => {
    try {
      const res = await api.get(`tasks/projects/${id}/tasks`);
      setTasks(res.data.data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
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

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

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

  const counts = getTaskCounts();

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskCard}>
      {/* Task Header */}
      <View style={styles.taskHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.project && (
            <Text style={styles.projectName} numberOfLines={1}>
              📁 {item.project.name}
            </Text>
          )}
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>
            {TASK_PRIORITY_LABELS[item.priority] || item.priority}
          </Text>
        </View>
      </View>

      {/* Task Description */}
      {item.description && (
        <Text style={styles.taskDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {/* Task Footer */}
      <View style={styles.taskFooter}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {TASK_STATUS_LABELS[item.status] || item.status}
          </Text>
        </View>

        {/* Assignee */}
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

        {/* Due Date */}
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
              {new Date(item.dueDate).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short'
              })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des tâches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

      {/* Filters - ✅ CORRECTION ICI */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkbox-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucune tâche</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'ALL'
                ? 'Ce projet n\'a pas encore de tâches'
                : `Aucune tâche avec le statut "${TASK_STATUS_LABELS[filter]}"`}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted
  },

  // Filters - ✅ CORRECTION ICI
  filterWrapper: {
    backgroundColor: colors.backgroundLight, // ✅ Ajout du background
    marginBottom: 16,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 0, // ✅ Enlever le padding vertical si non nécessaire
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary
  },
  filterText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '600'
  },
  filterTextActive: {
    color: '#fff'
  },

  // Tasks List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Task Header
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4
  },
  projectName: {
    fontSize: 12,
    color: colors.textMuted
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    height: 24,
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textDark
  },

  // Task Description
  taskDescription: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 20
  },

  // Task Footer
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textDark
  },

  // Assignee
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
  },
  assigneeName: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },

  // Due Date
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dueDateText: {
    fontSize: 12,
    color: colors.textMuted
  },
  overdueText: {
    color: colors.error,
    fontWeight: '600'
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});