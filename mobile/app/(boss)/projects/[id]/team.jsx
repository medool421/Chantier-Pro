import React from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../src/theme/colors';
import { useProjectTeam } from '../../../../src/hooks/useProjects';

export default function ProjectTeam() {
  const { id } = useLocalSearchParams();
  const { data: team, isLoading, isError, isRefetching, refetch } = useProjectTeam(id);

  const getTeamStats = () => {
    if (!team?.members) return { total: 0, workers: 0, managers: 0 };
    return {
      total: team.members.length,
      workers: team.members.filter((m) => m.roleInTeam === 'WORKER').length,
      managers: team.members.filter((m) => m.roleInTeam === 'MANAGER').length,
    };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de l'équipe...</Text>
      </View>
    );
  }

  if (isError || !team) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Aucune équipe</Text>
        <Text style={styles.emptySubtitle}>Ce projet n'a pas encore d'équipe assignée</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = getTeamStats();
  const workers = team.members?.filter((m) => m.roleInTeam === 'WORKER') || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="people" size={32} color={colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.teamName}>{team.name || 'Équipe du projet'}</Text>
          {team.description && <Text style={styles.teamDescription}>{team.description}</Text>}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {[
          { value: stats.total, label: 'Membres' },
          { value: stats.managers, label: 'Managers' },
          { value: stats.workers, label: 'Ouvriers' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Workers */}
      {workers.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Ouvriers</Text>
          </View>

          {workers.map((member) => {
            const user = member.user;
            if (!user) return null;
            return (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{user.firstName} {user.lastName}</Text>
                  <Text style={styles.memberEmail}>{user.email}</Text>
                  {member.isActive !== undefined && (
                    <View style={[styles.statusBadge, { backgroundColor: member.isActive ? '#D1FAE5' : '#FEE2E2' }]}>
                      <View style={[styles.statusDot, { backgroundColor: member.isActive ? '#10B981' : '#EF4444' }]} />
                      <Text style={[styles.statusText, { color: member.isActive ? '#065F46' : '#991B1B' }]}>
                        {member.isActive ? 'Actif' : 'Inactif'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  scrollContent: { paddingBottom: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundLight },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textMuted },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark, marginBottom: 8, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  retryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 24, gap: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, padding: 20, marginBottom: 16, gap: 16 },
  headerIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  teamName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  teamDescription: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 20, marginBottom: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 16, fontWeight: '600', color: colors.textDark, marginBottom: 2 },
  memberEmail: { fontSize: 13, color: colors.textMuted, marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600' },
});