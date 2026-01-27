import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,

} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../../src/api/axios';
import { colors } from '../../../../src/theme/colors';

export default function ProjectTeam() {
  const { id } = useLocalSearchParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (id) fetchTeam();
    }, [id])
  );

  const fetchTeam = async () => {
    try {
      setError(null);
      
      console.log('📡 Fetching team for project:', id);
      
      const res = await api.get(`/projects/${id}/team`);
      const teamData = res.data?.data;

      console.log('👥 Team data received:', teamData);

      if (!teamData) {
        setTeam(null);
        setError('Aucune équipe trouvée pour ce projet');
        return;
      }

      setTeam(teamData);
      
    } catch (err) {
      console.error('❌ Error fetching team:', err);
      console.error('❌ Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          'Impossible de charger l\'équipe';
      
      setError(errorMessage);
      setTeam(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeam();
  };



  const getTeamStats = () => {
    if (!team || !team.members) return { total: 0, workers: 0, managers: 0 };
    
    const workers = team.members.filter(m => m.roleInTeam === 'WORKER').length;
    const managers = team.members.filter(m => m.roleInTeam === 'MANAGER').length;
    
    return {
      total: team.members.length,
      workers,
      managers,
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de l'équipe...</Text>
      </View>
    );
  }

  if (error || !team) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Aucune équipe</Text>
        <Text style={styles.emptySubtitle}>
          {error || 'Ce projet n\'a pas encore d\'équipe assignée'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchTeam}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = getTeamStats();
  const workers = team.members?.filter(m => m.roleInTeam === 'WORKER') || [];

  return (
    <ScrollView
      style={styles.container}
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
      {/* Team Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="people" size={32} color={colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.teamName}>{team.name || 'Équipe du projet'}</Text>
          {team.description && (
            <Text style={styles.teamDescription}>{team.description}</Text>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Membres</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.managers}</Text>
          <Text style={styles.statLabel}>Managers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.workers}</Text>
          <Text style={styles.statLabel}>Ouvriers</Text>
        </View>
      </View>

      {/* Workers Section */}
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
                  <Text style={styles.memberName}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text style={styles.memberEmail}>{user.email}</Text>
                  
                  {member.isActive !== undefined && (
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: member.isActive ? '#D1FAE5' : '#FEE2E2' }
                    ]}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: member.isActive ? '#10B981' : '#EF4444' }
                      ]} />
                      <Text style={[
                        styles.statusText,
                        { color: member.isActive ? '#065F46' : '#991B1B' }
                      ]}>
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

      {team.members?.length === 0 && (
        <View style={styles.noMembersContainer}>
          <Ionicons name="person-add-outline" size={48} color={colors.textMuted} />
          <Text style={styles.noMembersText}>Aucun membre dans l'équipe</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },

  // Member Card
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarManager: {
    backgroundColor: '#FEF3C7',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Member Actions
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // No Members
  noMembersContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noMembersText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
  },
});