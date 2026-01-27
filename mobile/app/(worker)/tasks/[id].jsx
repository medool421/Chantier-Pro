import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/theme/colors';
import { TASK_STATUS, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../../src/utils/constants';
import api from '../../../src/api/axios';

export default function WorkerTaskDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const response = await api.get(`/tasks/tasks/${id}`);
      setTask(response.data.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger la tâche');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await api.patch(`/tasks/tasks/${id}/status`, { status: newStatus });
      setTask({ ...task, status: newStatus });
      setStatusModalVisible(false);
      Alert.alert('Succès', 'Statut mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!task) return null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
          <Text style={styles.taskTitle}>{task.title}</Text>

          <TouchableOpacity 
            style={styles.statusContainer}
            onPress={() => setStatusModalVisible(true)}
          >
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Text style={styles.statusText}>{TASK_STATUS_LABELS[task.status]}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            <Text style={styles.statusHint}>Toucher pour changer</Text>
          </TouchableOpacity>

          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>
              Priorité: {TASK_PRIORITY_LABELS[task.priority]}
            </Text>
          </View>

          {task.description && (
            <Text style={styles.description}>{task.description}</Text>
          )}

          {task.dueDate && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
              <Text style={styles.infoText}>
                Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}

          {task.project && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={18} color={colors.textMuted} />
              <Text style={styles.infoText}>
                Projet: {task.project.name}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          
          {task.status === 'TODO' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleUpdateStatus('IN_PROGRESS')}
            >
              <Ionicons name="play-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Commencer la tâche</Text>
            </TouchableOpacity>
          )}

          {task.status === 'IN_PROGRESS' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={() => handleUpdateStatus('COMPLETED')}
            >
              <Ionicons name="checkmark-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Marquer comme terminée</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      <Modal visible={statusModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer le statut</Text>
            {Object.entries(TASK_STATUS).filter(([k, v]) => v !== 'BLOCKED').map(([key, value]) => (
              <TouchableOpacity
                key={value}
                style={[styles.statusOption, task.status === value && styles.selectedOption]}
                onPress={() => handleUpdateStatus(value)}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(value) }]} />
                <Text style={styles.statusOptionText}>{TASK_STATUS_LABELS[value]}</Text>
                {task.status === value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setStatusModalVisible(false)}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStatusColor = (status) => ({
  TODO: '#E3F2FD',
  IN_PROGRESS: '#E8F5E9',
  COMPLETED: '#F3E5F5',
}[status]);

const getPriorityColor = (priority) => ({
  LOW: '#E8F5E9',
  NORMAL: '#E3F2FD',
  HIGH: '#FFF3E0',
  URGENT: '#FFEBEE',
}[priority]);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24 },
  taskTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginBottom: 12 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '600', color: colors.textDark },
  statusHint: { fontSize: 12, color: colors.textMuted, marginLeft: 'auto' },
  priorityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 16 },
  priorityText: { fontSize: 12, fontWeight: '600', color: colors.textDark },
  description: { fontSize: 14, color: colors.textDark, lineHeight: 20, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { marginLeft: 8, color: colors.textMuted, fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark, marginBottom: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark, marginBottom: 20 },
  statusOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8, backgroundColor: '#F5F5F5' },
  selectedOption: { backgroundColor: colors.primaryLight },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  statusOptionText: { flex: 1, fontSize: 16, color: colors.textDark },
  modalCancelButton: { padding: 16, alignItems: 'center', marginTop: 12 },
  modalCancelText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
});