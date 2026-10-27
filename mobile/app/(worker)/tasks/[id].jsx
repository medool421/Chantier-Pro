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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../src/theme/colors';
import ThemedTextInput from '../../../src/components/ThemedTextInput';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../../src/utils/constants';
import { useTask, useUpdateTaskStatus } from '../../../src/hooks/useTasks';
import { useCreateTaskUpdate, useTaskUpdates } from '../../../src/hooks/useTaskUpdates';

const getImageMimeType = (uri) => {
  const extension = uri.split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic' || extension === 'heif') return 'image/heic';
  return 'image/jpeg';
};

const getInitials = (worker) => `${worker?.firstName?.[0] || ''}${worker?.lastName?.[0] || ''}`.toUpperCase();
const getWorkerName = (worker) => [worker?.firstName, worker?.lastName].filter(Boolean).join(' ');

export default function WorkerTaskDetail() {
  const { id } = useLocalSearchParams();
  const taskId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [updateType, setUpdateType] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [defaultUpdateMessage, setDefaultUpdateMessage] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [message, setMessage] = useState('');
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  // ─── Query ────────────────────────────────────────────────────────────────
  const { data: task, isLoading, isError, refetch } = useTask(taskId);
  const { data: updates = [], isLoading: updatesLoading } = useTaskUpdates(task?.id);

  // ─── Mutation ─────────────────────────────────────────────────────────────
  const updateStatusMutation = useUpdateTaskStatus(taskId);
  const createTaskUpdateMutation = useCreateTaskUpdate();
  const assignedWorkers = task?.assignees?.length ? task.assignees : (task?.assignee ? [task.assignee] : []);

  const isSubmittingUpdate = createTaskUpdateMutation.isPending;

  const sortedUpdates = useMemo(
    () => [...(Array.isArray(updates) && updates.length ? updates : task?.updates || [])]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [updates, task?.updates]
  );

  const askSource = (type) =>
    new Promise((resolve) => {
      const actions = [
        { text: 'Caméra', onPress: () => resolve('camera') },
        { text: 'Galerie', onPress: () => resolve('gallery') },
      ];
      if (type === 'DONE') actions.push({ text: 'Continuer sans photo', onPress: () => resolve('skip') });
      actions.push({ text: 'Annuler', style: 'cancel', onPress: () => resolve(null) });
      Alert.alert('Ajouter une photo', 'Choisissez une source', actions);
    });

  const pickImage = async (type) => {
    const source = await askSource(type);
    if (!source) {
      resetUpdateForm();
      return;
    }
    if (source === 'skip') {
      setSelectedImageUri('');
      setUpdateModalVisible(true);
      return;
    }

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission refusée', 'Autorisez la caméra pour continuer.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
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
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedImageUri(result.assets[0].uri);
      setUpdateModalVisible(true);
    }
  };

  const openQuickUpdate = async (type, newStatus, updateMessage) => {
    setUpdateType(type);
    setPendingStatus(newStatus);
    setDefaultUpdateMessage(updateMessage || '');
    setMessage('');
    setSelectedImageUri('');
    await pickImage(type);
  };

  const resetUpdateForm = () => {
    setUpdateModalVisible(false);
    setSelectedImageUri('');
    setMessage('');
    setUpdateType(null);
    setPendingStatus(null);
    setDefaultUpdateMessage('');
  };

  const submitTaskUpdate = async () => {
    if (!updateType || (updateType === 'BLOCKED' && !selectedImageUri)) {
      Alert.alert('Photo requise', 'Ajoutez une photo avant de continuer.');
      return;
    }

    const fileName = selectedImageUri.split('/').pop() || `task-update-${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append('type', updateType);
    formData.append('message', message?.trim() || defaultUpdateMessage);
    formData.append('taskId', taskId);
    if (selectedImageUri) {
      formData.append('image', {
        uri: selectedImageUri,
        name: fileName,
        type: getImageMimeType(fileName),
      });
    }

    const saveUpdate = () => createTaskUpdateMutation.mutate(
      { taskId, formData },
      {
        onSuccess: () => {
          Alert.alert('Succès', 'Mise à jour envoyée.');
          resetUpdateForm();
        },
        onError: (error) => {
          Alert.alert('Erreur', error.response?.data?.message || "Impossible d'envoyer la mise à jour.");
        },
      }
    );

    if (!pendingStatus) {
      saveUpdate();
      return;
    }

    if (pendingStatus === 'BLOCKED') {
      saveUpdate();
      return;
    }

    updateStatusMutation.mutate(pendingStatus, {
      onSuccess: saveUpdate,
      onError: () => Alert.alert('Erreur', 'Impossible de mettre à jour le statut'),
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !task) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
        <Text style={styles.errorTitle}>Tâche introuvable ou accès non autorisé</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.errorButton, styles.retryErrorButton]} onPress={() => refetch()}>
            <Text style={styles.errorButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.card}>
          <Text style={styles.taskTitle}>{task?.title || task?.name || 'Tâche'}</Text>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Text style={styles.statusText}>{TASK_STATUS_LABELS[task.status]}</Text>
            </View>
          </View>

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

          <View style={styles.assigneesSection}>
            <Text style={styles.assigneesTitle}>Ouvriers assignés</Text>
            <View style={styles.assigneeList}>
              {assignedWorkers.length ? assignedWorkers.map((worker) => (
                <View key={worker.id} style={styles.assigneeBadge}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(worker)}</Text>
                  </View>
                  <Text style={styles.assigneeName} numberOfLines={1}>{getWorkerName(worker)}</Text>
                </View>
              )) : <Text style={styles.emptyAssignees}>Aucun ouvrier assigné</Text>}
            </View>
          </View>
        </View>

        {/* Quick actions — only show relevant next step */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>

          <View style={styles.actionButtons}>
            {task.status === 'TODO' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => openQuickUpdate('DONE', 'IN_PROGRESS', 'a demarre la tache')}
                disabled={isSubmittingUpdate || updateStatusMutation.isPending}
              >
                <Ionicons name="play-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {updateStatusMutation.isPending ? 'Mise à jour...' : 'Commencer la tâche'}
                </Text>
              </TouchableOpacity>
            )}

            {task.status !== 'COMPLETED' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success || '#388E3C' }]}
                onPress={() => openQuickUpdate('DONE', 'COMPLETED', 'a marque la tache comme terminee')}
                disabled={isSubmittingUpdate || updateStatusMutation.isPending}
              >
                <Ionicons name="checkmark-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {updateStatusMutation.isPending ? 'Mise à jour...' : 'Terminer la tâche'}
                </Text>
              </TouchableOpacity>
            )}

            {task.status !== 'COMPLETED' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.blockedButton]}
                onPress={() => openQuickUpdate('BLOCKED', 'BLOCKED', 'a signale un blocage')}
                disabled={isSubmittingUpdate || updateStatusMutation.isPending}
              >
                <Text style={styles.actionButtonText}>{'⚠️ Signaler un problème'}</Text>
              </TouchableOpacity>
            )}

            {task.status === 'BLOCKED' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => openQuickUpdate('DONE', 'IN_PROGRESS', 'a repris la tache')}
                disabled={isSubmittingUpdate || updateStatusMutation.isPending}
              >
                <Ionicons name="play-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Reprendre la tâche</Text>
              </TouchableOpacity>
            )}
          </View>
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
                {!!update.user && (
                  <Text style={styles.updateAuthor}>
                    {update.user.firstName} {update.user.lastName}
                    {update.message ? ` ${update.message}` : update.type === 'BLOCKED' ? ' a signalé un blocage' : ' a mis à jour la tâche'}
                  </Text>
                )}
                {!!update.imageUrl && (
                  <Image source={{ uri: update.imageUrl }} style={styles.updateImage} />
                )}
              </View>
            ))
          )}
        </View>

      </ScrollView>

      <Modal visible={updateModalVisible} transparent animationType="slide" onRequestClose={resetUpdateForm}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboard}>
            <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {updateType === 'DONE' ? 'Mark as Done' : 'Report Problem'}
            </Text>

            {!!selectedImageUri && (
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
            )}

            <ThemedTextInput
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
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const getStatusColor = (s) => ({ TODO: '#E3F2FD', IN_PROGRESS: '#E8F5E9', COMPLETED: '#F3E5F5' }[s] || '#F5F5F5');
const getPriorityColor = (p) => ({ LOW: '#E8F5E9', NORMAL: '#E3F2FD', HIGH: '#FFF3E0', URGENT: '#FFEBEE' }[p] || '#F5F5F5');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  errorContainer: { flex: 1, backgroundColor: colors.backgroundLight, alignItems: 'center', justifyContent: 'center', padding: 28 },
  errorTitle: { color: colors.textDark, fontSize: 17, fontWeight: '600', textAlign: 'center', marginTop: 16 },
  errorActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  errorButton: { backgroundColor: colors.textMuted, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  retryErrorButton: { backgroundColor: colors.primary },
  errorButtonText: { color: '#fff', fontWeight: '600' },
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
  assigneesSection: { marginTop: 12 },
  assigneesTitle: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  assigneeList: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  assigneeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingRight: 8, borderRadius: 16, maxWidth: '100%' },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  avatarText: { fontSize: 10, fontWeight: 'bold', color: colors.primary },
  assigneeName: { fontSize: 12, color: colors.textMuted },
  emptyAssignees: { color: colors.textMuted, fontStyle: 'italic', marginTop: 8 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark, marginBottom: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  actionButtons: { gap: 12 },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  blockedButton: { backgroundColor: '#D84315' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKeyboard: { width: '100%', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark, marginBottom: 20 },
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
  updateAuthor: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  updateImage: { width: '100%', height: 160, borderRadius: 10, backgroundColor: '#F2F2F2', marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted },
});
