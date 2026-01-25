import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Modal, TextInput 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/theme/colors';
import { PROJECT_STATUS, PROJECT_STATUS_LABELS } from '../../../src/utils/constants';
import api from '../../../src/api/axios';

export default function ManagerProjectDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger les détails du projet');
    } finally {
      setLoading(false);
    }
  };

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Card */}
        <View style={styles.card}>
          <Text style={styles.projectTitle}>{project.name}</Text>

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

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: '/(manager)/tasks/create',
              params: { projectId: id }
            })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="add-circle-outline" size={24} color="#388E3C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitle}>Nouvelle tâche</Text>
              <Text style={styles.actionCardSubtitle}>Créer et assigner</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: '/(manager)/tasks',
              params: { projectId: id }
            })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="checkbox-outline" size={24} color="#1976D2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitle}>Tâches du projet</Text>
              <Text style={styles.actionCardSubtitle}>Voir et gérer</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(manager)/team')}
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
        </View>

      </ScrollView>

      {/* STATUS MODAL */}
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
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
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
    maxHeight: '60%',
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
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCancelText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});