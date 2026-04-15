import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../src/theme/colors';
import { TASK_STATUS, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../../src/utils/constants';
import { useTask, useUpdateTaskStatus } from '../../../src/hooks/useTasks';
import { useCreateTaskUpdate, useTaskUpdates } from '../../../src/hooks/useTaskUpdates';

export default function WorkerTaskDetail() {
  const { id } = useLocalSearchParams();
  const taskId = Array.isArray(id) ? id[0] : id;
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [updateType, setUpdateType] = useState(null);
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [message, setMessage] = useState('');
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  // ─── Query ────────────────────────────────────────────────────────────────
  const { data: task, isLoading } = useTask(taskId);
  const { data: updates = [], isLoading: updatesLoading } = useTaskUpdates(taskId);

  // ─── Mutation ─────────────────────────────────────────────────────────────
  const updateStatusMutation = useUpdateTaskStatus(taskId);
  const createTaskUpdateMutation = useCreateTaskUpdate();

  const isSubmittingUpdate = createTaskUpdateMutation.isPending;

  const sortedUpdates = useMemo(
    () => [...updates].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [updates]
  );

  const handleUpdateStatus = (newStatus) => {
    updateStatusMutation.mutate(newStatus, {
      onSuccess: () => {
        setStatusModalVisible(false);
        Alert.alert('Succès', 'Statut mis à jour');
      },
      onError: () => Alert.alert('Erreur', 'Impossible de mettre à jour le statut'),
    });
  };

  const askSource = () =>
    new Promise((resolve) => {
      Alert.alert('Ajouter une photo', 'Choisissez une source', [
        { text: 'Caméra', onPress: () => resolve('camera') },
        { text: 'Galerie', onPress: () => resolve('gallery') },
        { text: 'Annuler', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });

  const pickImage = async () => {
    const source = await askSource();
    if (!source) return;

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission refusée', 'Autorisez la caméra pour continuer.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setSelectedImageUri(result.assets[0].uri);
        setUpdateModalVisible(true);
      }
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', 'Autorisez la galerie pour continuer.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedImageUri(result.assets[0].uri);
      setUpdateModalVisible(true);
    }
  };

  const openQuickUpdate = async (type) => {
    setUpdateType(type);
    setMessage('');
    setSelectedImageUri('');
    await pickImage();
  };

  const resetUpdateForm = () => {
    setUpdateModalVisible(false);
    setSelectedImageUri('');
    setMessage('');
    setUpdateType(null);
  };

  const submitTaskUpdate = () => {
    if (!updateType || !selectedImageUri) {
      Alert.alert('Photo requise', 'Ajoutez une photo avant de continuer.');
      return;
    }

    createTaskUpdateMutation.mutate(
      {
        taskId,
        type: updateType,
        message: message?.trim() || null,
        imageUrl: selectedImageUri, // local URI for now
      },
      {
        onSuccess: () => {
          Alert.alert('Succès', 'Mise à jour envoyée.');
          resetUpdateForm();
        },
        onError: () => {
          Alert.alert('Erreur', "Impossible d'envoyer la mise à jour.");
        },
      }
    );
  };

  if (isLoading) {
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

          <TouchableOpacity style={styles.statusContainer} onPress={() => setStatusModalVisible(true)}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Text style={styles.statusText}>{TASK_STATUS_LABELS[task.status]}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            <Text style={styles.statusHint}>Toucher pour changer</Text>
          </TouchableOpacity>

          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>Priorité: {TASK_PRIORITY_LABELS[task.priority]}</Text>
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
              <Text style={styles.infoText}>Projet: {task.project.name}</Text>
            </View>
          )}
        </View>

        {/* Quick actions — only show relevant next step */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>

          {task.status === 'TODO' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleUpdateStatus('IN_PROGRESS')}
              disabled={updateStatusMutation.isPending}
            >
              <Ionicons name="play-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {updateStatusMutation.isPending ? 'Mise à jour...' : 'Commencer la tâche'}
              </Text>
            </TouchableOpacity>
          )}

          {task.status === 'IN_PROGRESS' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success || '#388E3C' }]}
              onPress={() => handleUpdateStatus('COMPLETED')}
              disabled={updateStatusMutation.isPending}
            >
              <Ionicons name="checkmark-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {updateStatusMutation.isPending ? 'Mise à jour...' : 'Marquer comme terminée'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.doneButton]}
            onPress={() => openQuickUpdate('DONE')}
            disabled={isSubmittingUpdate}
          >
            <Text style={styles.actionButtonText}>✅ Mark as Done</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.blockedButton]}
            onPress={() => openQuickUpdate('BLOCKED')}
            disabled={isSubmittingUpdate}
          >
            <Text style={styles.actionButtonText}>⚠️ Report Problem</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des mises à jour</Text>
          {updatesLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : sortedUpdates.length === 0 ? (
            <Text style={styles.emptyText}>Aucune mise à jour pour cette tâche.</Text>
          ) : (
            sortedUpdates.map((update) => (
              <View key={update.id} style={styles.updateCard}>
                <View style={styles.updateHeader}>
                  <Text style={[styles.updateType, update.type === 'DONE' ? styles.doneType : styles.blockedType]}>
                    {update.type === 'DONE' ? 'DONE' : 'BLOCKED'}
                  </Text>
                  <Text style={styles.updateDate}>
                    {new Date(update.createdAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                {!!update.imageUrl && (
                  <Image source={{ uri: update.imageUrl }} style={styles.updateImage} />
                )}
                {!!update.message && <Text style={styles.updateMessage}>{update.message}</Text>}
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* STATUS MODAL */}
      <Modal visible={statusModalVisible} transparent animationType="slide" onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer le statut</Text>
            {Object.entries(TASK_STATUS)
              .filter(([, v]) => v !== 'BLOCKED')
              .map(([, value]) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.statusOption, task.status === value && styles.selectedOption]}
                  onPress={() => handleUpdateStatus(value)}
                  disabled={updateStatusMutation.isPending}
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

      <Modal visible={updateModalVisible} transparent animationType="slide" onRequestClose={resetUpdateForm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {updateType === 'DONE' ? 'Mark as Done' : 'Report Problem'}
            </Text>

            {!!selectedImageUri && (
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
            )}

            <TextInput
              style={styles.messageInput}
              placeholder="Message (optionnel)"
              multiline
              value={message}
              onChangeText={setMessage}
            />

            <TouchableOpacity
              style={[styles.submitUpdateButton, isSubmittingUpdate && styles.buttonDisabled]}
              onPress={submitTaskUpdate}
              disabled={isSubmittingUpdate}
            >
              <Text style={styles.submitUpdateText}>
                {isSubmittingUpdate ? 'Envoi...' : 'Envoyer'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelButton} onPress={resetUpdateForm} disabled={isSubmittingUpdate}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStatusColor = (s) => ({ TODO: '#E3F2FD', IN_PROGRESS: '#E8F5E9', COMPLETED: '#F3E5F5' }[s] || '#F5F5F5');
const getPriorityColor = (p) => ({ LOW: '#E8F5E9', NORMAL: '#E3F2FD', HIGH: '#FFF3E0', URGENT: '#FFEBEE' }[p] || '#F5F5F5');

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
  doneButton: { backgroundColor: '#2E7D32', marginTop: 12 },
  blockedButton: { backgroundColor: '#D84315', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark, marginBottom: 20 },
  statusOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8, backgroundColor: '#F5F5F5' },
  selectedOption: { backgroundColor: colors.primaryLight },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  statusOptionText: { flex: 1, fontSize: 16, color: colors.textDark },
  modalCancelButton: { padding: 16, alignItems: 'center', marginTop: 12 },
  modalCancelText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  previewImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 12, backgroundColor: '#F2F2F2' },
  messageInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
    marginBottom: 12,
    color: colors.textDark,
    backgroundColor: '#fff',
  },
  submitUpdateButton: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitUpdateText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.65 },
  updateCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
  updateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  updateType: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, overflow: 'hidden' },
  doneType: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  blockedType: { backgroundColor: '#FFEBEE', color: '#C62828' },
  updateDate: { fontSize: 12, color: colors.textMuted },
  updateImage: { width: '100%', height: 160, borderRadius: 10, backgroundColor: '#F2F2F2', marginBottom: 8 },
  updateMessage: { fontSize: 14, color: colors.textDark },
  emptyText: { fontSize: 14, color: colors.textMuted },
});