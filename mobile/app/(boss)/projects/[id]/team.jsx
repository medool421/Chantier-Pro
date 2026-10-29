import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert, Modal, Linking,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../src/theme/colors';
import {
  useProjectTeam,
  useCompanyWorkers,
  useAddTeamMember,
  useRemoveTeamMember,
  useCreateProjectTeam,
} from '../../../../src/hooks/useProjects';

export default function BossProjectTeam() {
  const { id } = useLocalSearchParams();
  const projectId = Array.isArray(id) ? id[0] : id;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  const [isAddingSelected, setIsAddingSelected] = useState(false);
  const [createdTeamId, setCreatedTeamId] = useState(null);

  const {
    data: teamData,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useProjectTeam(projectId);
  const {
    data: workersPool = [],
    isLoading: workersLoading,
    isError: workersError,
    refetch: refetchWorkers,
  } = useCompanyWorkers();
  const createTeamMutation = useCreateProjectTeam(projectId);
  const addMemberMutation = useAddTeamMember(projectId);
  const removeMemberMutation = useRemoveTeamMember(projectId);

  const team = Array.isArray(teamData) ? teamData[0] : teamData;
  const members = team?.members || [];
  const teamId = team?.id || createdTeamId;

  const memberUserIds = useMemo(
    () => new Set(members.map((member) => member?.user?.id).filter(Boolean)),
    [members]
  );
  const availableWorkers = useMemo(
    () => workersPool.filter((worker) => !memberUserIds.has(worker.id)),
    [workersPool, memberUserIds]
  );

  const createTeam = async () => {
    try {
      const createdTeam = await createTeamMutation.mutateAsync({
        name: 'Équipe projet',
        projectId,
      });
      setCreatedTeamId(createdTeam?.id || null);
      await refetch();
      Alert.alert('Succès', 'Équipe créée. Vous pouvez maintenant ajouter des ouvriers.');
      return true;
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Impossible de créer l’équipe.');
      return false;
    }
  };

  const openPicker = async () => {
    if (!teamId && !(await createTeam())) return;
    setSelectedWorkerIds([]);
    setPickerOpen(true);
  };

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
      await refetch();

      if (failedIds.length === 0) {
        setPickerOpen(false);
        setSelectedWorkerIds([]);
        Alert.alert('Succès', `${addedCount} ouvrier${addedCount === 1 ? '' : 's'} ajouté${addedCount === 1 ? '' : 's'} à l’équipe.`);
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

  const removeMember = (member) => {
    const user = member.user;
    if (!user || !teamId) return;

    Alert.alert(
      'Retirer le membre',
      `Retirer ${user.firstName} ${user.lastName} de l’équipe ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMemberMutation.mutateAsync({ teamId, userId: user.id });
              Alert.alert('Succès', 'Membre retiré de l’équipe.');
            } catch (error) {
              Alert.alert('Erreur', error?.response?.data?.message || 'Impossible de retirer ce membre.');
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }) => {
    const user = item.user;
    if (!user) return null;

    return (
      <View style={styles.memberCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.firstName?.[0]}{user.lastName?.[0]}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.memberEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{item.roleInTeam || 'Membre'}</Text>
          </View>
        </View>
        {user.phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${user.phone}`)} style={styles.iconButton}>
            <Ionicons name="call-outline" size={21} color={colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => removeMember(item)}
          disabled={removeMemberMutation.isPending}
          style={styles.iconButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.stateText}>Chargement de l’équipe...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={52} color={colors.textMuted} />
        <Text style={styles.stateText}>Impossible de charger l’équipe.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.centered}>
        <Ionicons name="people-outline" size={60} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Aucune équipe pour ce projet</Text>
        <Text style={styles.stateText}>Créez l’équipe pour pouvoir y ajouter des ouvriers.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={createTeam} disabled={createTeamMutation.isPending}>
          {createTeamMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Créer l’équipe</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={openPicker} disabled={workersLoading || createTeamMutation.isPending}>
        <Ionicons name="person-add-outline" size={19} color="#fff" />
        <Text style={styles.addButtonText}>Ajouter un ouvrier</Text>
      </TouchableOpacity>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.teamName}>{team.name || 'Équipe du projet'}</Text>
            <Text style={styles.memberCount}>{members.length} membre{members.length === 1 ? '' : 's'}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={styles.stateText}>Aucun membre dans l’équipe.</Text>
          </View>
        }
      />

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un ouvrier</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {workersError ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.stateText}>Impossible de charger les ouvriers.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetchWorkers()}>
                  <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={availableWorkers}
                keyExtractor={(item) => item.id}
                style={styles.workerList}
                ListEmptyComponent={<Text style={styles.stateText}>Tous les ouvriers actifs de l’entreprise sont déjà dans l’équipe.</Text>}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.workerOption, selectedWorkerIds.includes(item.id) && styles.workerOptionSelected]}
                    onPress={() => toggleWorker(item.id)}
                    disabled={isAddingSelected}
                  >
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>{item.firstName?.[0]}{item.lastName?.[0]}</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{item.firstName} {item.lastName}</Text>
                      <Text style={styles.memberEmail}>{item.email}</Text>
                    </View>
                    <Ionicons
                      name={selectedWorkerIds.includes(item.id) ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={selectedWorkerIds.includes(item.id) ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={[styles.confirmAddButton, (selectedWorkerIds.length === 0 || isAddingSelected) && styles.confirmAddButtonDisabled]}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: colors.backgroundLight },
  stateText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 10 },
  emptyTitle: { color: colors.textDark, fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 13, marginTop: 20 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  retryButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 11, marginTop: 16 },
  retryText: { color: '#fff', fontWeight: '700' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, marginBottom: 14 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  listContent: { paddingBottom: 24 },
  listHeader: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14 },
  teamName: { fontSize: 20, fontWeight: '700', color: colors.textDark },
  memberCount: { color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: 10 },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, elevation: 2 },
  memberInfo: { flex: 1, marginLeft: 10 },
  memberName: { color: colors.textDark, fontSize: 16, fontWeight: '600' },
  memberEmail: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.primary, fontSize: 17, fontWeight: '700' },
  avatarSmall: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarSmallText: { color: colors.primary, fontWeight: '700' },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: colors.primaryLight, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, marginTop: 5 },
  roleText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  iconButton: { padding: 7, marginLeft: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { height: '75%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { color: colors.textDark, fontSize: 18, fontWeight: '700' },
  workerList: { flex: 1, minHeight: 0 },
  workerOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: '#F8F8F8', marginBottom: 8 },
  workerOptionSelected: { backgroundColor: colors.primaryLight },
  confirmAddButton: { minHeight: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 10, marginTop: 12, paddingHorizontal: 12 },
  confirmAddButtonDisabled: { opacity: 0.55 },
  confirmAddText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
