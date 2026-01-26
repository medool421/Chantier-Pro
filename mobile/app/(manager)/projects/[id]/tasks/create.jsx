import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../src/theme/colors';
import { TASK_PRIORITY, TASK_PRIORITY_LABELS } from '../../../../../src/utils/constants';
import api from '../../../../../src/api/axios';

// Protection : définir des valeurs par défaut si TASK_PRIORITY n'est pas importé
const DEFAULT_PRIORITIES = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

const PRIORITIES = TASK_PRIORITY || DEFAULT_PRIORITIES;

export default function CreateTask() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialProjectId = params.projectId || params.id;

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    projectId: initialProjectId || '',
    priority: 'NORMAL',
    dueDate: '',
    assignedTo: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredWorkers(workers);
    } else {
      const filtered = workers.filter(w =>
        `${w.firstName} ${w.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredWorkers(filtered);
    }
  }, [searchQuery, workers]);

  const fetchData = async () => {
    try {
      setFetchingData(true);

      if (!initialProjectId) {
        console.warn('No project ID found in params');
        setFetchingData(false);
        return;
      }

      const teamRes = await api.get(`/projects/${initialProjectId}/team`);
      const teamData = Array.isArray(teamRes.data?.data) ? teamRes.data?.data[0] : teamRes.data?.data;

      if (!teamData) {
        console.warn('No team found for this project');
        setWorkers([]);
        return;
      }

      const workersList =
        teamData?.TeamMembers
          ?.map((tm) => tm.User)
          ?.filter((u) => u.role === 'WORKER') || [];

      setWorkers(workersList);
      setFilteredWorkers(workersList);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      Alert.alert('Erreur', 'Impossible de charger les membres de l’équipe.');
      setWorkers([]);
    } finally {
      setFetchingData(false);
    }
  };

  const getSelectedWorkerName = () => {
    if (!form.assignedTo) return 'Non assigné';
    const worker = workers.find(w => w.id === form.assignedTo);
    return worker ? `${worker.firstName} ${worker.lastName}` : 'Chargement...';
  };

  const handleSubmit = async () => {
    if (!form.title) {
      Alert.alert('Erreur', 'Veuillez remplir le titre de la tâche');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/projects/${initialProjectId}/tasks`, {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        assignedTo: form.assignedTo || undefined,
      });

      Alert.alert('Succès', 'Tâche créée avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de créer la tâche');
    } finally {
      setLoading(false);
    }
  };

  const renderWorkerItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.workerModalItem,
        form.assignedTo === item.id && styles.workerModalItemSelected
      ]}
      onPress={() => {
        setForm({ ...form, assignedTo: item.id });
        setModalVisible(false);
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
      {form.assignedTo === item.id && (
        <Ionicons name="checkmark-circle" size={24} color="#fff" />
      )}
    </TouchableOpacity>
  );

  if (fetchingData) {
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

        {/* TITRE */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Installer tableau électrique"
            value={form.title}
            onChangeText={(t) => setForm({ ...form, title: t })}
          />
        </View>

        {/* DESCRIPTION */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Détails de la tâche..."
            value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* PRIORITÉ */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Priorité</Text>
          <View style={styles.priorityRow}>
            {Object.entries(PRIORITIES).map(([key, value]) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.priorityChip,
                  form.priority === value && styles.priorityChipSelected
                ]}
                onPress={() => setForm({ ...form, priority: value })}
              >
                <Text style={[
                  styles.priorityText,
                  form.priority === value && styles.priorityTextSelected
                ]}>
                  {TASK_PRIORITY_LABELS?.[value] || key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ASSIGNATION */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Assigner à</Text>
          <TouchableOpacity
            style={styles.selectorCard}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.selectorInfo}>
              <View style={styles.avatar}>
                {form.assignedTo ? (
                  <Text style={styles.avatarText}>
                    {workers.find(w => w.id === form.assignedTo)?.firstName?.[0]}
                    {workers.find(w => w.id === form.assignedTo)?.lastName?.[0]}
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
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Créer la tâche</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* MEMBER SELECTION MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un ouvrier</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity
              style={[styles.workerModalItem, !form.assignedTo && styles.workerModalItemSelected]}
              onPress={() => {
                setForm({ ...form, assignedTo: '' });
                setModalVisible(false);
              }}
            >
              <View style={styles.avatarSmall}>
                <Ionicons name="person-remove-outline" size={18} color={colors.primary} />
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
                  <Text style={styles.emptyText}>Aucun membre trouvé</Text>
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
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 16,
    fontSize: 16, backgroundColor: '#FAFAFA',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  priorityChip: {
    flex: 1, minWidth: 70, padding: 12, borderRadius: 12,
    backgroundColor: '#F5F5F5', alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  priorityChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  priorityText: { fontSize: 12, fontWeight: '600', color: colors.textDark },
  priorityTextSelected: { color: '#fff' },

  selectorCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0'
  },
  selectorInfo: { flexDirection: 'row', alignItems: 'center' },
  selectorText: { fontSize: 16, color: colors.textDark, marginLeft: 12, fontWeight: '500' },

  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: colors.primary },

  submitButton: {
    backgroundColor: colors.primary, padding: 18, borderRadius: 12,
    alignItems: 'center', marginTop: 20, marginBottom: 40
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textMuted },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5',
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 16
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  workerModalItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8,
    backgroundColor: '#F9F9F9'
  },
  workerModalItemSelected: { backgroundColor: colors.primary },
  avatarSmall: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  avatarSmallText: { fontSize: 12, fontWeight: 'bold', color: colors.primary },
  workerName: { fontSize: 16, fontWeight: '600', color: colors.textDark },
  workerEmail: { fontSize: 12, color: colors.textMuted },
  selectedTextColor: { color: '#fff' },
  selectedTextMutedColor: { color: 'rgba(255,255,255,0.7)' },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontStyle: 'italic' }
});
