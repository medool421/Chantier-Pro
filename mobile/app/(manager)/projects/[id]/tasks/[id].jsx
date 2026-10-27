import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../src/theme/colors';
import ThemedTextInput from '../../../../../src/components/ThemedTextInput';
import { TASK_STATUS, TASK_STATUS_LABELS, TASK_PRIORITY, TASK_PRIORITY_LABELS } from '../../../../../src/utils/constants';
import { useTask, useUpdateTask, useUpdateTaskStatus, useDeleteTask } from '../../../../../src/hooks/useTasks';
import { useTaskUpdates } from '../../../../../src/hooks/useTaskUpdates';
import { useProjectTeam } from '../../../../../src/hooks/useProjects';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../../../src/api/axios';
import { filesService } from '../../../../../src/api/files.service';
import ImagePreviewModal from '../../../../../src/components/ImagePreviewModal';

function getMemberUserId(member) {
  return member?.userId ?? member?.user?.id ?? null;
}

function getTaskAssigneeIds(task) {
  const ids = (task?.assignees || []).map((worker) => String(worker.id));
  if (ids.length) return ids;
  const legacyId = task?.assignedTo ?? task?.assigneeId ?? task?.assignee?.id;
  return legacyId == null ? [] : [String(legacyId)];
}

export default function ManagerTaskDetail() {
  const { id } = useLocalSearchParams();
  const taskId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [assigneeModalVisible, setAssigneeModalVisible] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const [editForm, setEditForm] = useState({});

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: task, isLoading } = useTask(taskId);
  const {
    data: updates = [],
    isLoading: updatesLoading,
    isError: updatesError,
    isFetching: updatesFetching,
    refetch: refetchUpdates,
  } = useTaskUpdates(taskId);
  const { data: teamData } = useProjectTeam(task?.projectId);
  const assignees = (teamData?.members || []).filter((member) =>
    member.user?.role === 'WORKER' && member.user.status === 'ACTIVE' && member.user.isActive !== false
  );
  const filteredAssignees = assignees.filter((m) => {
    const u = m.user;
    if (!u) return false;
    if (!assigneeSearchQuery.trim()) return true;
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const q = assigneeSearchQuery.toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  useEffect(() => {
    if (task) setEditForm({ ...task, assigneeIds: getTaskAssigneeIds(task) });
  }, [task?.id, task?.assignedTo, task?.assignee?.id, task?.assignees]);

  useFocusEffect(
    useCallback(() => {
      if (taskId) refetchUpdates();
    }, [taskId, refetchUpdates])
  );

  // ─── Mutations ────────────────────────────────────────────────────────────
  const updateStatusMutation = useUpdateTaskStatus(taskId, task?.projectId);
  const updateTaskMutation = useUpdateTask(taskId, task?.projectId);
  const deleteTaskMutation = useDeleteTask(task?.projectId);

  const handleUpdateStatus = (newStatus) => {
    updateStatusMutation.mutate(newStatus, {
      onSuccess: () => {
        setStatusModalVisible(false);
        Alert.alert('Succès', 'Statut mis à jour');
      },
      onError: () => Alert.alert('Erreur', 'Impossible de mettre à jour le statut'),
    });
  };

  const handleUpdateTask = () => {
    updateTaskMutation.mutate(
      {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        dueDate: editForm.dueDate,
        assigneeIds: editForm.assigneeIds || [],
      },
      {
        onSuccess: () => {
          setEditModalVisible(false);
          Alert.alert('Succès', 'Tâche mise à jour');
        },
        onError: () => Alert.alert('Erreur', 'Impossible de mettre à jour la tâche'),
      }
    );
  };

  const selectedAssigneeIds = editForm.assigneeIds || [];

  const handleDeleteTask = () => {
    Alert.alert(
      'Confirmer la suppression',
      `Voulez-vous vraiment supprimer la tâche "${task.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteTaskMutation.mutate(taskId, {
              onSuccess: () => {
                Alert.alert('Succès', 'Tâche supprimée');
                router.back();
              },
              onError: () => Alert.alert('Erreur', 'Impossible de supprimer la tâche'),
            });
          },
        },
      ]
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

        {/* Header Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(true)}>
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.statusContainer} onPress={() => setStatusModalVisible(true)}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Text style={styles.statusText}>{TASK_STATUS_LABELS[task.status]}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>Priorité: {TASK_PRIORITY_LABELS[task.priority]}</Text>
          </View>

          {task.description && <Text style={styles.description}>{task.description}</Text>}

          {task.dueDate && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
              <Text style={styles.infoText}>Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}</Text>
            </View>
          )}

          {task.project && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={18} color={colors.textMuted} />
              <Text style={styles.infoText}>Projet: {task.project.name}</Text>
            </View>
          )}

          {task.assignees?.length > 0 ? (
            <View style={styles.assigneeCard}>
              <Text style={styles.assigneeRole}>Ouvriers assignés</Text>
              <View style={styles.assigneeChips}>{task.assignees.map((worker) => <WorkerBadge key={worker.id} worker={worker} />)}</View>
            </View>
          ) : task.assignee ? <View style={styles.assigneeCard}><Text style={styles.assigneeRole}>Ouvriers assignés</Text><View style={styles.assigneeChips}><WorkerBadge worker={task.assignee} /></View></View> : <Text style={styles.emptyAssigneeText}>Aucun ouvrier assigné</Text>}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Progression et mises à jour</Text>
            {updatesFetching && !updatesLoading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {updatesLoading ? (
            <View style={styles.updateState}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.stateText}>Chargement des mises à jour...</Text>
            </View>
          ) : updatesError ? (
            <View style={styles.updateState}>
              <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
              <Text style={styles.stateText}>Impossible de charger les mises à jour.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetchUpdates()}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : updates.length === 0 ? (
            <View style={styles.updateState}>
              <Ionicons name="time-outline" size={28} color={colors.textMuted} />
              <Text style={styles.stateText}>Aucune mise à jour pour cette tâche.</Text>
            </View>
          ) : (
            updates.map((update) => <TaskUpdateCard key={update.id} update={update} />)
          )}
        </View>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTask}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={styles.deleteButtonText}>Supprimer la tâche</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* STATUS MODAL */}
      <Modal visible={statusModalVisible} transparent animationType="slide" onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer le statut</Text>
            {Object.entries(TASK_STATUS).map(([key, value]) => (
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

      {/* EDIT MODAL */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboard}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
              <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
              <Text style={styles.modalTitle}>Modifier la tâche</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Titre</Text>
                <ThemedTextInput style={styles.input} value={editForm.title} onChangeText={(t) => setEditForm({ ...editForm, title: t })} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <ThemedTextInput style={[styles.input, styles.textArea]} value={editForm.description} onChangeText={(t) => setEditForm({ ...editForm, description: t })} multiline />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Priorité</Text>
                <View style={styles.priorityRow}>
                  {Object.values(TASK_PRIORITY).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.priorityOption, editForm.priority === p && styles.prioritySelected]}
                      onPress={() => setEditForm({ ...editForm, priority: p })}
                    >
                      <Text style={[styles.priorityOptionText, editForm.priority === p && styles.prioritySelectedText]}>
                        {TASK_PRIORITY_LABELS[p]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Assigné à</Text>
                <TouchableOpacity
                  style={styles.selectorCard}
                  onPress={() => {
                    setAssigneeModalVisible(true);
                    setAssigneeSearchQuery('');
                  }}
                >
                  <View style={styles.selectorInfo}>
                    <View style={styles.avatarSelector}>
                      <Ionicons name="people-outline" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.selectorText}>{selectedAssigneeIds.length ? `${selectedAssigneeIds.length} ouvrier(s) sélectionné(s)` : 'Aucun ouvrier assigné'}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                </TouchableOpacity>
                <View style={styles.assigneeChips}>{selectedAssigneeIds.map((workerId) => {
                  const worker = assignees.find((member) => String(getMemberUserId(member)) === String(workerId))?.user
                    || task.assignees?.find((member) => String(member.id) === String(workerId));
                  return worker ? <WorkerBadge key={workerId} worker={worker} /> : null;
                })}</View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveButton, updateTaskMutation.isPending && { opacity: 0.7 }]}
                  onPress={handleUpdateTask}
                  disabled={updateTaskMutation.isPending}
                >
                  <Text style={styles.modalSaveText}>
                    {updateTaskMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Text>
                </TouchableOpacity>
              </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ASSIGNEE PICKER MODAL - same UX as tasks/create */}
      <Modal
        visible={assigneeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setAssigneeModalVisible(false);
          setAssigneeSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Choisir les ouvriers</Text>
              <TouchableOpacity
                onPress={() => {
                  setAssigneeModalVisible(false);
                  setAssigneeSearchQuery('');
                }}
              >
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <ThemedTextInput
                style={styles.searchInput}
                placeholder="Rechercher..."
                value={assigneeSearchQuery}
                onChangeText={setAssigneeSearchQuery}
              />
              {assigneeSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setAssigneeSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.workerModalItem, selectedAssigneeIds.length === 0 && styles.workerModalItemSelected]}
              onPress={() => setEditForm({ ...editForm, assigneeIds: [] })}
            >
              <View style={styles.avatarSmall}>
                <Ionicons name="person-remove-outline" size={18} color={selectedAssigneeIds.length === 0 ? '#fff' : colors.primary} />
              </View>
              <Text style={[styles.workerName, selectedAssigneeIds.length === 0 && styles.selectedTextColor]}>
                Aucun ouvrier assigné
              </Text>
              {selectedAssigneeIds.length === 0 && <Ionicons name="checkmark-circle" size={24} color="#fff" />}
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 320 }}>
              {filteredAssignees.map((m) => {
                const u = m.user;
                if (!u) return null;
                return (
                  <TouchableOpacity
                    key={m.userId}
                    style={[styles.workerModalItem, selectedAssigneeIds.includes(String(getMemberUserId(m))) && styles.workerModalItemSelected]}
                    onPress={() => {
                      const memberId = String(getMemberUserId(m));
                      const selected = selectedAssigneeIds.includes(memberId);
                      setEditForm({ ...editForm, assigneeIds: selected ? selectedAssigneeIds.filter((id) => id !== memberId) : [...selectedAssigneeIds, memberId] });
                    }}
                  >
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>{u.firstName?.[0]}{u.lastName?.[0]}</Text>
                    </View>
                    <Text style={[styles.workerName, selectedAssigneeIds.includes(String(getMemberUserId(m))) && styles.selectedTextColor]}>
                      {u.firstName} {u.lastName}
                    </Text>
                    {selectedAssigneeIds.includes(String(getMemberUserId(m))) && <Ionicons name="checkmark-circle" size={24} color="#fff" />}
                  </TouchableOpacity>
                );
              })}

              {filteredAssignees.length === 0 && (
                <View style={styles.emptyAssigneeContainer}>
                  <Ionicons name="people-outline" size={36} color={colors.textMuted} />
                  <Text style={styles.emptyAssigneeText}>
                    {assigneeSearchQuery ? 'Aucun resultat trouve' : 'Aucun ouvrier disponible'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TaskUpdateCard({ update }) {
  const author = update.user
    ? `${update.user.firstName || ''} ${update.user.lastName || ''}`.trim()
    : 'Utilisateur inconnu';
  const timestamp = update.createdAt ? new Date(update.createdAt) : null;
  const hasValidTimestamp = timestamp && !Number.isNaN(timestamp.getTime());
  const statusLabel = update.type === 'DONE' ? 'Terminé' : update.type === 'BLOCKED' ? 'Bloqué' : update.type || 'Mise à jour';
  const message = update.message || update.description;

  return (
    <View style={styles.updateCard}>
      <View style={styles.updateHeader}>
        <View style={[styles.updateType, update.type === 'BLOCKED' ? styles.blockedType : styles.doneType]}>
          <Text style={styles.updateTypeText}>{statusLabel}</Text>
        </View>
        <Text style={styles.updateDate}>
          {hasValidTimestamp ? timestamp.toLocaleString('fr-FR') : 'Date inconnue'}
        </Text>
      </View>

      <View style={styles.authorRow}>
        <Ionicons name="person-circle-outline" size={18} color={colors.textMuted} />
        <Text style={styles.authorText}>{author}</Text>
      </View>

      {!!message && <Text style={styles.updateMessage}>{message}</Text>}
      {!!update.imageUrl && <TaskUpdateImage update={update} />}
    </View>
  );
}

function WorkerBadge({ worker }) {
  const initials = `${worker.firstName?.[0] || ''}${worker.lastName?.[0] || ''}`.toUpperCase();
  return (
    <View style={styles.assigneeBadge}>
      <View style={styles.assigneeAvatar}><Text style={styles.assigneeAvatarText}>{initials}</Text></View>
      <Text style={styles.assigneeName}>{worker.firstName} {worker.lastName}</Text>
    </View>
  );
}

function TaskUpdateImage({ update }) {
  const { imageUrl: uri, id } = update;
  const [imageFailed, setImageFailed] = useState(false);
  const [displayUri, setDisplayUri] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const isLocalPhoto = uri.startsWith('/uploads/');
  const mimeType = /\.png$/i.test(uri) ? 'image/png' : 'image/jpeg';
  const downloadUrl = isLocalPhoto
    ? api.getUri({ url: `/task-updates/${id}/photo` })
    : undefined;

  useEffect(() => {
    let active = true;
    setImageFailed(false);
    setDisplayUri('');

    if (!isLocalPhoto) {
      setDisplayUri(uri);
      return () => { active = false; };
    }

    filesService.downloadToCache({
      downloadUrl,
      originalName: `task-update-${id}${mimeType === 'image/png' ? '.png' : '.jpg'}`,
      mimeType,
    })
      .then((localUri) => {
        if (active) setDisplayUri(localUri);
      })
      .catch(() => {
        if (active) setImageFailed(true);
      });

    return () => { active = false; };
  }, [downloadUrl, id, isLocalPhoto, mimeType, uri]);

  if (imageFailed || (!isLocalPhoto && !/^https?:\/\//i.test(uri))) {
    return (
      <View style={styles.imageFallback}>
        <Ionicons name="image-outline" size={28} color={colors.textMuted} />
        <Text style={styles.imageFallbackText}>Photo indisponible</Text>
      </View>
    );
  }

  return (
    <>
      {displayUri ? (
        <TouchableOpacity onPress={() => setPreviewVisible(true)} accessibilityRole="button">
          <Image
            source={{ uri: displayUri }}
            style={styles.updateImage}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
            accessibilityLabel="Ouvrir la photo de la mise à jour"
          />
        </TouchableOpacity>
      ) : (
        <View style={[styles.updateImage, styles.imageLoading]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <ImagePreviewModal
        visible={previewVisible}
        file={{
          originalName: `Photo de mise à jour ${id}`,
          mimeType: isLocalPhoto ? mimeType : 'application/octet-stream',
          downloadUrl,
        }}
        uri={displayUri}
        onClose={() => setPreviewVisible(false)}
      />
    </>
  );
}

const getStatusColor = (s) => ({ TODO: '#E3F2FD', IN_PROGRESS: '#E8F5E9', BLOCKED: '#FFEBEE', COMPLETED: '#F3E5F5' }[s]);
const getPriorityColor = (p) => ({ LOW: '#E8F5E9', NORMAL: '#E3F2FD', HIGH: '#FFF3E0', URGENT: '#FFEBEE' }[p]);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark },
  updateState: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  stateText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 },
  retryButton: { marginTop: 12, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  updateCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  updateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  updateType: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  doneType: { backgroundColor: '#E8F5E9' },
  blockedType: { backgroundColor: '#FFEBEE' },
  updateTypeText: { fontSize: 12, fontWeight: '700', color: colors.textDark },
  updateDate: { flex: 1, color: colors.textMuted, fontSize: 12, textAlign: 'right' },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  authorText: { color: colors.textMuted, fontSize: 13, marginLeft: 6 },
  updateMessage: { color: colors.textDark, fontSize: 14, lineHeight: 20, marginBottom: 10 },
  updateImage: { width: '100%', height: 180, borderRadius: 10, backgroundColor: '#F2F2F2' },
  imageLoading: { justifyContent: 'center', alignItems: 'center' },
  imageFallback: { height: 100, borderRadius: 10, backgroundColor: '#F2F2F2', justifyContent: 'center', alignItems: 'center' },
  imageFallbackText: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
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
  assigneeCard: { marginTop: 16, padding: 12, backgroundColor: colors.backgroundLight, borderRadius: 12 },
  assigneeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  assigneeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingRight: 10, borderWidth: 1, borderColor: '#E9E9E9' },
  assigneeAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 7 },
  assigneeAvatarText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  assigneeName: { color: colors.textDark, fontSize: 13, fontWeight: '500' },
  emptyAssigneeText: { color: colors.textMuted, fontStyle: 'italic', marginTop: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  assigneeName: { fontSize: 16, fontWeight: '600', color: colors.textDark },
  assigneeRole: { fontSize: 12, color: colors.textMuted },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.error },
  deleteButtonText: { color: colors.error, fontWeight: '600', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKeyboard: { width: '100%', justifyContent: 'flex-end' },
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
  priorityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priorityOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  prioritySelected: { backgroundColor: colors.primary },
  priorityOptionText: { fontSize: 14, color: colors.textDark, fontWeight: '600' },
  prioritySelectedText: { color: '#fff' },
  selectorCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  selectorInfo: { flexDirection: 'row', alignItems: 'center' },
  selectorText: { fontSize: 16, color: colors.textDark, marginLeft: 12, fontWeight: '500' },
  avatarSelector: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarSelectorText: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
  workerModalItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: '#F9F9F9' },
  workerModalItemSelected: { backgroundColor: colors.primary },
  workerName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.textDark },
  selectedTextColor: { color: '#fff' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  emptyAssigneeContainer: { alignItems: 'center', paddingVertical: 20 },
  emptyAssigneeText: { color: colors.textMuted, marginTop: 8, fontSize: 13 },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarSmallText: { fontSize: 12, fontWeight: 'bold', color: colors.primary },
  buttonRow: { flexDirection: 'row', gap: 12 },
  modalSaveButton: { flex: 1, backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
