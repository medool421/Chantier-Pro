import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/theme/colors';
import api from '../../../src/api/axios';
import { PROJECT_STATUS, PROJECT_STATUS_LABELS } from '../../../src/utils/constants';

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.data);
      setEditForm(response.data.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Erreur', 'Impossible de charger les détails du projet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjectDetails();
  };

  // ============================================
  // UPDATE STATUS
  // ============================================
  const handleUpdateStatus = async (newStatus) => {
    try {
      await api.patch(`/projects/${id}/status`, { status: newStatus });
      setProject({ ...project, status: newStatus });
      setStatusModalVisible(false);
      Alert.alert('Succès', 'Statut mis à jour');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  // ============================================
  // UPDATE PROJECT
  // ============================================
  const handleUpdateProject = async () => {
    try {
      const response = await api.put(`/projects/${id}`, {
        name: editForm.name,
        description: editForm.description,
        address: editForm.address,
        budget: editForm.budget,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      });
      setProject(response.data.data);
      setEditModalVisible(false);
      Alert.alert('Succès', 'Projet mis à jour');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le projet');
    }
  };

  // ============================================
  // DELETE PROJECT
  // ============================================
  const handleDeleteProject = () => {
    Alert.alert(
      'Confirmer la suppression',
      `Voulez-vous vraiment supprimer le projet "${project.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/projects/${id}`);
              Alert.alert('Succès', 'Projet supprimé');
              router.back();
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur', 'Impossible de supprimer le projet');
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

  if (!project) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Projet introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >

        {/* Header Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.projectTitle}>{project.name}</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(true)}>
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.statusContainer}
            onPress={() => setStatusModalVisible(true)}
          >
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
              <Text style={styles.statusText}>
                {PROJECT_STATUS_LABELS[project.status] || project.status}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.dateRow}>
            <Text style={styles.dateText}>
              Début: {new Date(project.startDate).toLocaleDateString('fr-FR')}
            </Text>
            {project.endDate && (
              <Text style={styles.dateText}>
                Fin: {new Date(project.endDate).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>

          <Text style={styles.description}>{project.description || 'Aucune description'}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.textMuted} />
            <Text style={styles.infoText}>{project.address || 'N/A'}</Text>
          </View>

          {project.budget && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={18} color={colors.textMuted} />
              <Text style={styles.infoText}>
                Budget: {project.budget.toLocaleString('fr-MA')} DH
              </Text>
            </View>
          )}

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Progression</Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${project.progressPercentage || 0}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{project.progressPercentage || 0}%</Text>
          </View>
        </View>

        {/* Manager Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chef de Chantier</Text>
          {project.manager ? (
            <View style={styles.managerCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(project.manager.firstName?.[0] || 'M').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.managerName}>
                  {project.manager.firstName} {project.manager.lastName}
                </Text>
                <Text style={styles.managerEmail}>{project.manager.email}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyManager}>
              <Text style={styles.emptyText}>Aucun chef de chantier assigné</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: '/(boss)/projects/assign-manager',
              params: { projectId: id }
            })}
          >
            <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>
              {project.manager ? 'Changer de Chef' : 'Assigner un Chef'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: '/(boss)/projects/[id]/tasks',
              params: { id }
            })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="checkbox-outline" size={24} color="#1976D2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitle}>Tâches du projet</Text>
              <Text style={styles.actionCardSubtitle}>Gérer les tâches</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: '/(boss)/projects/[id]/team',
              params: { id }
            })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="people-outline" size={24} color="#7B1FA2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitle}>Équipe</Text>
              <Text style={styles.actionCardSubtitle}>Voir les membres</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: '/(boss)/projects/[id]/files',
              params: { id }
            })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="document-text-outline" size={24} color="#F57C00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitle}>Fichiers</Text>
              <Text style={styles.actionCardSubtitle}>Plans et documents</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity> */}
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteProject}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={styles.deleteButtonText}>Supprimer le projet</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ============================================ */}
      {/* STATUS MODAL */}
      {/* ============================================ */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer le statut</Text>

            {Object.entries(PROJECT_STATUS).map(([key, value]) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.statusOption,
                  project.status === value && styles.selectedOption
                ]}
                onPress={() => handleUpdateStatus(value)}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(value) }]} />
                <Text style={styles.statusOptionText}>
                  {PROJECT_STATUS_LABELS[value]}
                </Text>
                {project.status === value && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ============================================ */}
      {/* EDIT MODAL */}
      {/* ============================================ */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Modifier le projet</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nom</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.name}
                  onChangeText={(t) => setEditForm({ ...editForm, name: t })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.description}
                  onChangeText={(t) => setEditForm({ ...editForm, description: t })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Adresse</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.address}
                  onChangeText={(t) => setEditForm({ ...editForm, address: t })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Budget (DH)</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.budget?.toString()}
                  onChangeText={(t) => setEditForm({ ...editForm, budget: parseFloat(t) || 0 })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleUpdateProject}
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

const getStatusColor = (status) => {
  const colors = {
    PLANNED: '#E3F2FD',
    IN_PROGRESS: '#C8E6C9',
    ON_HOLD: '#FFF3E0',
    COMPLETED: '#F3E5F5',
  };
  return colors[status] || '#F5F5F5';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textDark,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  description: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: colors.textMuted,
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 12,
  },
  managerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  managerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  managerEmail: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyManager: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    marginBottom: 40,
  },
  deleteButtonText: {
    color: colors.error,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  selectedOption: {
    backgroundColor: colors.primaryLight,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    color: colors.textDark,
  },
  modalCancelButton: {
    paddingHorizontal: 26,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCancelText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});