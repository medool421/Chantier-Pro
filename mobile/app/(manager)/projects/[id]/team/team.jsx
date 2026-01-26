import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Linking, TouchableOpacity, Alert, Modal, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../../src/theme/colors';
import api from '../../../../../src/api/axios';

export default function ManagerTeam() {
  const { id: projectId } = useLocalSearchParams();
  const [team, setTeam] = useState(null);
  const [workers, setWorkers] = useState([]); // Members already in team
  const [availableWorkers, setAvailableWorkers] = useState([]); // All workers to pick from
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Project Team
      const teamRes = await api.get(`/projects/${projectId}/team`);
      const teamData = Array.isArray(teamRes.data?.data) ? teamRes.data?.data[0] : teamRes.data?.data;

      setTeam(teamData);
      setWorkers(teamData?.TeamMembers || []);
      
    } catch (error) {
      console.error('Error fetching team data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données de l\'équipe');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId) => {
    if (!team) return;

    try {
      setAddingMember(true);
      await api.post(`/teams/${team.id}/members`, {
        userId,
        roleInTeam: 'WORKER'
      });

      Alert.alert('Succès', 'Membre ajouté à l\'équipe');
      setModalVisible(false);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'ajouter le membre');
    } finally {
      setAddingMember(false);
    }
  };

  const renderWorker = ({ item }) => {
    const user = item.User || item;
    return (
      <View style={styles.workerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.firstName?.[0]}{user.lastName?.[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.workerName}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.workerEmail}>{user.email}</Text>
          {item.roleInTeam && <Text style={styles.roleBadge}>{item.roleInTeam}</Text>}
        </View>
        {user.phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${user.phone}`)}>
            <Ionicons name="call-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Équipe ({workers.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="person-add-outline" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workers}
        keyExtractor={(item) => item.id || item.userId}
        renderItem={renderWorker}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun membre d'équipe</Text>
          </View>
        }
      />

      {/* Modal for adding members */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un membre</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {availableWorkers
                .filter(aw => !workers.some(w => w.userId === aw.id))
                .map(worker => (
                  <TouchableOpacity
                    key={worker.id}
                    style={styles.availableWorkerItem}
                    onPress={() => handleAddMember(worker.id)}
                    disabled={addingMember}
                  >
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>{worker.firstName?.[0]}{worker.lastName?.[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.workerName}>{worker.firstName} {worker.lastName}</Text>
                      <Text style={styles.workerEmail}>{worker.email}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                  </TouchableOpacity>
                ))}

              {availableWorkers.filter(aw => !workers.some(w => w.userId === aw.id)).length === 0 && (
                <Text style={styles.emptyModalText}>Aucun autre ouvrier disponible</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight, padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.textDark },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 4 },
  listContent: { paddingBottom: 24 },
  workerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  workerName: { fontSize: 16, fontWeight: '600', color: colors.textDark },
  workerEmail: { fontSize: 12, color: colors.textMuted },
  roleBadge: { fontSize: 10, color: colors.primary, backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textMuted, fontSize: 16, marginTop: 16 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark },
  availableWorkerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarSmallText: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
  emptyModalText: { textAlign: 'center', color: colors.textMuted, marginTop: 20, fontStyle: 'italic' },
});

