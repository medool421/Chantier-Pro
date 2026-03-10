import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../src/theme/colors';
import { TASK_PRIORITY, TASK_PRIORITY_LABELS } from '../../../../../src/utils/constants';
import { useCreateTask } from '../../../../../src/hooks/useTasks';
import { useProjectTeam } from '../../../../../src/hooks/useProjects';

const DEFAULT_PRIORITIES = { LOW: 'LOW', NORMAL: 'NORMAL', HIGH: 'HIGH' };
const PRIORITIES = TASK_PRIORITY || DEFAULT_PRIORITIES;

export default function CreateTask() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId || params.id;

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'NORMAL',
    dueDate: '',
    assignedTo: '',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: teamData, isLoading: teamLoading } = useProjectTeam(projectId);

  const workers = useMemo(() => {
    if (!teamData?.members) return [];
    return teamData.members
      .map((m) => m.user)
      .filter((u) => u && u.role === 'WORKER');
  }, [teamData]);

  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return workers;
    return workers.filter((w) =>
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, workers]);

  // ─── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useCreateTask(projectId);

  const getSelectedWorkerName = () => {
    if (!form.assignedTo) return 'Non assigné';
    const w = workers.find((w) => w.id === form.assignedTo);
    return w ? `${w.firstName} ${w.lastName}` : 'Chargement...';
  };

  const handleSubmit = () => {
    if (!form.title) {
      Alert.alert('Erreur', 'Veuillez remplir le titre de la tâche');
      return;
    }
    createMutation.mutate(
      {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        assignedTo: form.assignedTo || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('Succès', 'Tâche créée avec succès', [{ text: 'OK', onPress: () => router.back() }]);
        },
        onError: (error) => {
          Alert.alert('Erreur', error.response?.data?.message || 'Impossible de créer la tâche');
        },
      }
    );
  };

  const renderWorkerItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.workerModalItem, form.assignedTo === item.id && styles.workerModalItemSelected]}
      onPress={() => {
        setForm({ ...form, assignedTo: item.id });
        setModalVisible(false);
        setSearchQuery('');
      }}
    >
      <View style={styles.avatarSmall}>
        <Text style={styles.avatarSmallText}>{item.firstName?.[0]}{item.lastName?.[0]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.workerName, form.assignedTo === item.id && styles.selectedTextColor]}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={[styles.workerEmail, form.assignedTo === item.id && styles.selectedTextMutedColor]}>
          {item.email}
        </Text>
      </View>
      {form.assignedTo === item.id && <Ionicons name="checkmark-circle" size={24} color="#fff" />}
    </TouchableOpacity>
  );

  if (teamLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement du formulaire...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Nouvelle Tâche</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput style={styles.input} placeholder="Ex: Installer tableau électrique" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Détails de la tâche..." value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} multiline numberOfLines={4} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Priorité</Text>
          <View style={styles.priorityRow}>
            {Object.entries(PRIORITIES).map(([key, value]) => (
              <TouchableOpacity
                key={value}
                style={[styles.priorityChip, form.priority === value && styles.priorityChipSelected]}
                onPress={() => setForm({ ...form, priority: value })}
              >
                <Text style={[styles.priorityText, form.priority === value && styles.priorityTextSelected]}>
                  {TASK_PRIORITY_LABELS?.[value] || key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Assigner à</Text>
          <TouchableOpacity style={styles.selectorCard} onPress={() => setModalVisible(true)}>
            <View style={styles.selectorInfo}>
              <View style={styles.avatar}>
                {form.assignedTo ? (
                  <Text style={styles.avatarText}>
                    {workers.find((w) => w.id === form.assignedTo)?.firstName?.[0]}
                    {workers.find((w) => w.id === form.assignedTo)?.lastName?.[0]}
                  </Text>
                ) : (
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                )}
              </View>
              <Text style={styles.selectorText}>{getSelectedWorkerName()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Créer la tâche</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Worker selection modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { setModalVisible(false); setSearchQuery(''); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un ouvrier</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setSearchQuery(''); }}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput style={styles.searchInput} placeholder="Rechercher..." value={searchQuery} onChangeText={setSearchQuery} />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.workerModalItem, !form.assignedTo && styles.workerModalItemSelected]}
              onPress={() => { setForm({ ...form, assignedTo: '' }); setModalVisible(false); setSearchQuery(''); }}
            >
              <View style={styles.avatarSmall}>
                <Ionicons name="person-remove-outline" size={18} color={!form.assignedTo ? '#fff' : colors.primary} />
              </View>
              <Text style={[styles.workerName, !form.assignedTo && styles.selectedTextColor]}>Non assigné</Text>
              {!form.assignedTo && <Ionicons name="checkmark-circle" size={24} color="#fff" />}
            </TouchableOpacity>

            <FlatList
              data={filteredWorkers}
              keyExtractor={(item) => item.id}
              renderItem={renderWorkerItem}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'Aucun résultat trouvé' : 'Aucun ouvrier disponible'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.textDark, marginBottom: 24 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textDark, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#FAFAFA' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  priorityChip: { flex: 1, minWidth: 70, padding: 12, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  priorityChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  priorityText: { fontSize: 12, fontWeight: '600', color: colors.textDark },
  priorityTextSelected: { color: '#fff' },
  selectorCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  selectorInfo: { flexDirection: 'row', alignItems: 'center' },
  selectorText: { fontSize: 16, color: colors.textDark, marginLeft: 12, fontWeight: '500' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
  submitButton: { backgroundColor: colors.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  workerModalItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: '#F9F9F9' },
  workerModalItemSelected: { backgroundColor: colors.primary },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarSmallText: { fontSize: 12, fontWeight: 'bold', color: colors.primary },
  workerName: { fontSize: 16, fontWeight: '600', color: colors.textDark },
  workerEmail: { fontSize: 12, color: colors.textMuted },
  selectedTextColor: { color: '#fff' },
  selectedTextMutedColor: { color: 'rgba(255,255,255,0.7)' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontStyle: 'italic', marginTop: 12, fontSize: 14 },
});