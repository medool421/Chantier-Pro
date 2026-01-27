import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Modal, TextInput 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../src/theme/colors';
import { TASK_STATUS, TASK_STATUS_LABELS, TASK_PRIORITY, TASK_PRIORITY_LABELS } from '../../../../../src/utils/constants';
import api from '../../../../../src/api/axios';

export default function ManagerTaskDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [assignees, setAssignees] = useState([]);


  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const response = await api.get(`tasks/tasks/${id}`);
      setTask(response.data.data);
      setEditForm(response.data.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger la tâche');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignees = async () => {
  try {
    const res = await api.get(`/projects/${task.projectId}/team`);
    const team = res.data.data;
    setAssignees(team.members || []);
  } catch (e) {
    console.log('failed to load assignees');
  }
};

useEffect(() => {
  if (task?.projectId) {
    fetchAssignees();
  }
}, [task?.projectId]);



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

  const handleUpdateTask = async () => {
    try {
      const response = await api.put(`/tasks/tasks/${id}`, {
  title: editForm.title,
  description: editForm.description,
  priority: editForm.priority,
  dueDate: editForm.dueDate,
  assigneeId: editForm.assigneeId,
      });
      setTask(response.data.data);
      setEditModalVisible(false);
      Alert.alert('Succès', 'Tâche mise à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour la tâche');
    }
  };

  const handleDeleteTask = () => {
    Alert.alert(
      'Confirmer la suppression',
      `Voulez-vous vraiment supprimer la tâche "${task.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/tasks/${id}`);
              Alert.alert('Succès', 'Tâche supprimée');
              router.back();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la tâche');
            }
          },
        },
      ]
    );
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
        
        {/* Header */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(true)}>
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.statusContainer}
            onPress={() => setStatusModalVisible(true)}
          >
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Text style={styles.statusText}>{TASK_STATUS_LABELS[task.status]}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
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

          {task.assignee && (
            <View style={styles.assigneeCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {task.assignee.firstName?.[0]}{task.assignee.lastName?.[0]}
                </Text>
              </View>
              <View>
                <Text style={styles.assigneeName}>
                  {task.assignee.firstName} {task.assignee.lastName}
                </Text>
                <Text style={styles.assigneeRole}>Assigné à</Text>
              </View>
            </View>
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTask}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={styles.deleteButtonText}>Supprimer la tâche</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* STATUS MODAL */}
      <Modal visible={statusModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer le statut</Text>
            {Object.entries(TASK_STATUS).map(([key, value]) => (
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

      {/* EDIT MODAL */}
      {/* EDIT MODAL */}
<Modal visible={editModalVisible} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <ScrollView>
        <Text style={styles.modalTitle}>Modifier la tâche</Text>

        {/* TITLE */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Titre</Text>
          <TextInput
            style={styles.input}
            value={editForm.title}
            onChangeText={(t) => setEditForm({ ...editForm, title: t })}
          />
        </View>

        {/* DESCRIPTION */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={editForm.description}
            onChangeText={(t) => setEditForm({ ...editForm, description: t })}
            multiline
          />
        </View>

        {/* DUE DATE */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date d’échéance (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-02-01"
            // value={
            //   editForm.dueDate
            //     ? editForm.dueDate.slice(0, 10)
            //     : ''
            // }
            // onChangeText={(d) =>
            //   setEditForm({
            //     ...editForm,
            //     dueDate: d ? new Date(d).toISOString() : null,
            //   })
            // }
          />
        </View>

       {/* PRIORITY */}
<View style={styles.formGroup}>
  <Text style={styles.label}>Priorité</Text>

  <View style={styles.priorityRow}>
    {Object.values(TASK_PRIORITY).map((p) => (
      <TouchableOpacity
        key={p}
        style={[
          styles.priorityOption,
          editForm.priority === p && styles.prioritySelected,
        ]}
        onPress={() => setEditForm({ ...editForm, priority: p })}
      >
        <Text
          style={[
            styles.priorityOptionText,
            editForm.priority === p && styles.prioritySelectedText,
          ]}
        >
          {TASK_PRIORITY_LABELS[p]}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
{/* ASSIGNEE */}
<View style={styles.formGroup}>
  <Text style={styles.label}>Assigné à</Text>

  {assignees.map((m) => {
    const u = m.user;

    return (
      <TouchableOpacity
        key={m.userId}
        style={[
          styles.assigneeOption,
          editForm.assigneeId === m.userId && styles.assigneeSelected,
        ]}
        onPress={() =>
          setEditForm({ ...editForm, assigneeId: m.userId })
        }
      >
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>
            {u.firstName?.[0]}{u.lastName?.[0]}
          </Text>
        </View>

        <Text style={styles.assigneeOptionText}>
          {u.firstName} {u.lastName}
        </Text>

        {editForm.assigneeId === m.userId && (
          <Ionicons name="checkmark" size={18} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  })}
</View>



        {/* ACTIONS */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setEditModalVisible(false)}
          >
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleUpdateTask}
          >
            <Text style={styles.modalSaveText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </View>
</Modal>

    </View>
  );
}

const getStatusColor = (status) => ({
  TODO: '#E3F2FD',
  IN_PROGRESS: '#E8F5E9',
  BLOCKED: '#FFEBEE',
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  taskTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, flex: 1 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '600', color: colors.textDark },
  priorityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 16 },
  priorityText: { fontSize: 12, fontWeight: '600', color: colors.textDark },
  description: { fontSize: 14, color: colors.textDark, lineHeight: 20, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { marginLeft: 8, color: colors.textMuted, fontSize: 14 },
  assigneeCard: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 12, backgroundColor: colors.backgroundLight, borderRadius: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  assigneeName: { fontSize: 16, fontWeight: '600', color: colors.textDark },
  assigneeRole: { fontSize: 12, color: colors.textMuted },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.error },
  deleteButtonText: { color: colors.error, fontWeight: '600', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark, marginBottom: 20 },
  statusOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8, backgroundColor: '#F5F5F5' },
  selectedOption: { backgroundColor: colors.primaryLight },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  statusOptionText: { flex: 1, fontSize: 16, color: colors.textDark },
  modalCancelButton: { padding: 6, alignItems: 'center', marginTop: 12 },
  modalCancelText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textDark, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  modalSaveButton: { flex: 1, backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  priorityRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
},

priorityOption: {
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 20,
  backgroundColor: '#F0F0F0',
},

prioritySelected: {
  backgroundColor: colors.primary,
},

priorityOptionText: {
  fontSize: 14,
  color: colors.textDark,
  fontWeight: '600',
},

prioritySelectedText: {
  color: '#fff',
},
assigneeOption: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
  borderRadius: 12,
  backgroundColor: '#F5F5F5',
  marginBottom: 8,
},

assigneeSelected: {
  backgroundColor: colors.primaryLight,
},

assigneeOptionText: {
  flex: 1,
  fontSize: 14,
  color: colors.textDark,
  fontWeight: '600',
},

avatarSmall: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.primaryLight,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},

avatarSmallText: {
  fontSize: 12,
  fontWeight: 'bold',
  color: colors.primary,
},


});