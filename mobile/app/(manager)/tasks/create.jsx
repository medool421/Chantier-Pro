import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../src/theme/colors';
import { TASK_PRIORITY } from '../../../src/utils/constants';
import api from '../../../src/api/axios';

export default function CreateTask() {
  const router = useRouter();
  const { projectId: initialProjectId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true); // Pour le chargement initial
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  
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

  const fetchData = async () => {
    try {
      setFetchingData(true);
      const [workersRes, projectsRes] = await Promise.all([
        api.get('/users', { params: { role: 'WORKER' } }),
        api.get('/projects'),
      ]);
      
      // Sécurisation des données reçues
      setWorkers(workersRes.data?.data || []);
      setProjects(projectsRes.data?.data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      Alert.alert('Erreur', 'Impossible de charger les listes de projets ou d\'ouvriers.');
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.projectId) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires (Titre et Projet)');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/projects/${form.projectId}/tasks`, {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        assignedTo: form.assignedTo || undefined,
      });
      
      Alert.alert('Succès', 'Tâche créée avec succès');
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de créer la tâche');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ textAlign: 'center', marginTop: 10 }}>Chargement du formulaire...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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

      {/* CHOIX DU PROJET */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Projet *</Text>
        <View style={styles.pickerContainer}>
          {projects?.length > 0 ? (
            projects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={[styles.pickerOption, form.projectId === project.id && styles.pickerOptionSelected]}
                onPress={() => setForm({ ...form, projectId: project.id })}
              >
                <Text style={[styles.pickerText, form.projectId === project.id && styles.pickerTextSelected]}>
                  {project.name}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucun projet disponible</Text>
          )}
        </View>
      </View>

      {/* PRIORITÉ */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Priorité</Text>
        <View style={styles.priorityRow}>
          {Object.entries(TASK_PRIORITY).map(([key, value]) => (
            <TouchableOpacity
              key={value}
              style={[styles.priorityChip, form.priority === value && styles.priorityChipSelected]}
              onPress={() => setForm({ ...form, priority: value })}
            >
              <Text style={[styles.priorityText, form.priority === value && styles.priorityTextSelected]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ASSIGNATION */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Assigner à</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={[styles.pickerOption, !form.assignedTo && styles.pickerOptionSelected]}
            onPress={() => setForm({ ...form, assignedTo: '' })}
          >
            <Text style={[styles.pickerText, !form.assignedTo && styles.pickerTextSelected]}>
              Non assigné
            </Text>
          </TouchableOpacity>
          
          {workers?.map((worker) => (
            <TouchableOpacity
              key={worker.id}
              style={[styles.pickerOption, form.assignedTo === worker.id && styles.pickerOptionSelected]}
              onPress={() => setForm({ ...form, assignedTo: worker.id })}
            >
              <View style={styles.workerOption}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {worker.firstName?.[0] || ''}{worker.lastName?.[0] || ''}
                  </Text>
                </View>
                <Text style={[styles.pickerText, form.assignedTo === worker.id && styles.pickerTextSelected]}>
                  {worker.firstName} {worker.lastName}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* BOUTON SUBMIT */}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.textDark, marginBottom: 24 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textDark, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 16, fontSize: 16 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerContainer: { gap: 8 },
  pickerOption: { padding: 16, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 2, borderColor: 'transparent' },
  pickerOptionSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  pickerText: { fontSize: 16, color: colors.textDark },
  pickerTextSelected: { color: colors.primary, fontWeight: '600' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center' },
  priorityChipSelected: { backgroundColor: colors.primary },
  priorityText: { fontSize: 14, fontWeight: '600', color: colors.textDark },
  priorityTextSelected: { color: '#fff' },
  workerOption: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 12, fontWeight: 'bold', color: colors.primary },
  submitButton: { backgroundColor: colors.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyText: { color: '#999', fontStyle: 'italic', padding: 10 },
});