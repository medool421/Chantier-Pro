import React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Linking, TouchableOpacity, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../../src/theme/colors';
import {
  useProjectTeam,
  useCompanyWorkers,
  useAddTeamMember,
  useRemoveTeamMember,
  useCreateProjectTeam,
} from '../../../../../src/hooks/useProjects';

export default function ManagerTeam() {
  const { id: projectId } = useLocalSearchParams();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [createdTeamId, setCreatedTeamId] = React.useState(null);
  const { data: teamData, isLoading, isError, refetch } = useProjectTeam(projectId);
  const { data: workersPool = [], isLoading: loadingWorkers, refetch: refetchWorkers } = useCompanyWorkers();
  const createTeamMutation = useCreateProjectTeam(projectId);
  const addMemberMutation = useAddTeamMember(projectId);
  const removeMemberMutation = useRemoveTeamMember(projectId);
  const [selectedWorkerIds, setSelectedWorkerIds] = React.useState([]);
  const [isAddingSelected, setIsAddingSelected] = React.useState(false);

  const teamObj = Array.isArray(teamData) ? teamData[0] : teamData;
  const workers = teamObj?.members || [];
  const teamId = teamObj?.id || createdTeamId;

  const workerUserIds = React.useMemo(
    () => new Set(workers.map((member) => member?.user?.id).filter(Boolean)),
    [workers]
  );

  const availableWorkers = React.useMemo(
    () => workersPool.filter((worker) => !workerUserIds.has(worker.id)),
    [workersPool, workerUserIds]
  );

  const toggleWorker = (workerId) => {
    setSelectedWorkerIds((current) => current.includes(workerId)
      ? current.filter((id) => id !== workerId)
      : [...current, workerId]);
  };

  const addSelectedWorkers = async () => {
    const selectedWorkers = availableWorkers.filter((worker) => selectedWorkerIds.includes(worker.id));
    if (!teamId || selectedWorkers.length === 0 || isAddingSelected) return;

    setIsAddingSelected(true);
    try {
      const results = await Promise.allSettled(selectedWorkers.map((worker) =>
        addMemberMutation.mutateAsync({ teamId, userId: worker.id, roleInTeam: 'WORKER' })
      ));
      const failedIds = results.flatMap((result, index) => result.status === 'rejected' ? [selectedWorkers[index].id] : []);
      const addedCount = results.length - failedIds.length;
      await Promise.all([refetch(), refetchWorkers()]);

      if (failedIds.length === 0) {
        setPickerOpen(false);
        setSelectedWorkerIds([]);
        Alert.alert('Succès', `${addedCount} ouvrier${addedCount === 1 ? '' : 's'} ajouté${addedCount === 1 ? '' : 's'} à l'équipe.`);
      } else {
        setSelectedWorkerIds(failedIds);
        const firstError = results.find((result) => result.status === 'rejected')?.reason;
        Alert.alert(
          'Ajout partiel',
          `${addedCount} ouvrier${addedCount === 1 ? '' : 's'} ajouté${addedCount === 1 ? '' : 's'}. ${firstError?.response?.data?.message || 'Certains ouvriers n’ont pas pu être ajoutés.'}`
        );
      }
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Impossible d’ajouter les ouvriers sélectionnés.');
    } finally {
      setIsAddingSelected(false);
    }
  };

  const renderWorker = ({ item }) => {
    const user = item.user;
    if (!user) return null;

    return (
      <View style={styles.workerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.firstName?.[0]}{user.lastName?.[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.workerName}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.workerEmail}>{user.email}</Text>
          <Text style={styles.roleBadge}>{item.roleInTeam}</Text>
        </View>
        {user.phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${user.phone}`)}>
            <Ionicons name="call-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.removeBtn}
          disabled={removeMemberMutation.isPending}
          onPress={() => {
            Alert.alert(
              'Retirer le membre',
              `Retirer ${user.firstName} ${user.lastName} de l'équipe ?`,
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Retirer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await removeMemberMutation.mutateAsync({ teamId, userId: user.id });
                    } catch (error) {
                      Alert.alert('Erreur', error?.response?.data?.message || 'Impossible de retirer ce membre');
                    }
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#D14343" />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="people-outline" size={48} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, marginTop: 12 }}>Impossible de charger l'équipe</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!teamObj) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="people-outline" size={48} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, marginTop: 12, textAlign: 'center' }}>
          Aucune equipe n'existe encore pour ce projet.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          disabled={createTeamMutation.isPending}
          onPress={async () => {
            try {
              const createdTeam = await createTeamMutation.mutateAsync({
                name: 'Equipe projet',
                description: 'Equipe generee depuis l\'application manager',
                projectId,
              });
              setCreatedTeamId(createdTeam?.id || null);
              Alert.alert('Succes', 'Equipe creee. Vous pouvez maintenant ajouter des membres.');
              refetch();
            } catch (error) {
              Alert.alert('Erreur', error?.response?.data?.message || 'Impossible de creer une equipe pour ce projet');
            }
          }}
        >
          <Text style={styles.retryText}>
            {createTeamMutation.isPending ? 'Creation en cours...' : 'Creer l\'equipe du projet'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={async () => {
          if (!teamId) {
            try {
              const createdTeam = await createTeamMutation.mutateAsync({
                name: 'Equipe projet',
                description: 'Equipe generee depuis l\'application manager',
                projectId,
              });
              setCreatedTeamId(createdTeam?.id || null);
            } catch (error) {
              Alert.alert('Erreur', error?.response?.data?.message || 'Impossible de creer une equipe pour ce projet');
              return;
            }
          }
          setSelectedWorkerIds([]);
          setPickerOpen(true);
        }}
        disabled={loadingWorkers || addMemberMutation.isPending || createTeamMutation.isPending}
      >
        <Ionicons name="person-add-outline" size={18} color="#fff" />
        <Text style={styles.addButtonText}>Ajouter un membre</Text>
      </TouchableOpacity>

      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        renderItem={renderWorker}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun membre dans l'équipe</Text>
          </View>
        }
      />

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un ouvrier</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableWorkers}
              keyExtractor={(item) => item.id}
              style={styles.workerList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Tous les ouvriers de l'entreprise sont deja dans l'equipe.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.workerCard, styles.pickerWorkerCard, selectedWorkerIds.includes(item.id) && styles.selectedWorkerCard]}
                  disabled={isAddingSelected}
                  onPress={() => toggleWorker(item.id)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.firstName?.[0]}{item.lastName?.[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workerName}>{item.firstName} {item.lastName}</Text>
                    <Text style={styles.workerEmail}>{item.email}</Text>
                  </View>
                  <Ionicons
                    name={selectedWorkerIds.includes(item.id) ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={selectedWorkerIds.includes(item.id) ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.confirmAddButton, (selectedWorkerIds.length === 0 || isAddingSelected) && styles.disabledButton]}
              onPress={addSelectedWorkers}
              disabled={selectedWorkerIds.length === 0 || isAddingSelected}
            >
              {isAddingSelected ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.confirmAddText}>Ajouter les ouvriers sélectionnés ({selectedWorkerIds.length})</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight, padding: 20 },
  addButton: {
    marginBottom: 14,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 24 },
  workerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  workerName: { fontSize: 16, fontWeight: '600', color: colors.textDark },
  workerEmail: { fontSize: 12, color: colors.textMuted },
  roleBadge: { fontSize: 10, color: colors.primary, backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textMuted, fontSize: 16, marginTop: 16 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  removeBtn: { marginLeft: 12, padding: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, height: '75%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark },
  workerList: { flex: 1, minHeight: 0 },
  pickerWorkerCard: { backgroundColor: '#F8F8F8', marginBottom: 8 },
  selectedWorkerCard: { backgroundColor: colors.primaryLight },
  confirmAddButton: { backgroundColor: colors.primary, borderRadius: 10, minHeight: 50, marginTop: 12, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  confirmAddText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  disabledButton: { opacity: 0.55 },
});
