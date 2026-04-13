import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';
import { useManagerProjects } from '../../../src/hooks/useProjects';
import { colors } from '../../../src/theme/colors';
import { PROJECT_STATUS_LABELS } from '../../../src/utils/constants';

const getStatusColor = (s) => ({
  PLANNED: '#E3F2FD',
  IN_PROGRESS: '#C8E6C9',
  ON_HOLD: '#FFF3E0',
  COMPLETED: '#F3E5F5',
}[s] || '#F5F5F5');

const getStatusTextColor = (s) => ({
  PLANNED: '#1565C0',
  IN_PROGRESS: '#2E7D32',
  ON_HOLD: '#E65100',
  COMPLETED: '#6A1B9A',
}[s] || '#555');

export default function ManagerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const {
    data: projects = [],
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useManagerProjects();

  const renderProject = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(manager)/projects/${item.id}`)}
      activeOpacity={0.85}
    >
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          {item.address ? (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusTextColor(item.status) }]}>
            {PROJECT_STATUS_LABELS[item.status] || item.status}
          </Text>
        </View>
      </View>

      {/* Description */}
      {item.description ? (
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
      ) : null}

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progressPercentage || 0}%` }]} />
        </View>
        <Text style={styles.progressText}>{item.progressPercentage || 0}%</Text>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        {item.manager && (
          <View style={styles.managerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.manager.firstName?.[0]}{item.manager.lastName?.[0]}
              </Text>
            </View>
            <Text style={styles.managerName} numberOfLines={1}>
              {item.manager.firstName} {item.manager.lastName}
            </Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.username}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.role}>Chef de Chantier</Text>
        </View>
        <View style={styles.statsBox}>
          <Text style={styles.statsNumber}>{projects.length}</Text>
          <Text style={styles.statsLabel}>Chantier{projects.length > 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Section title */}
      <Text style={styles.sectionTitle}>Mes Chantiers</Text>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderProject}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {isError ? 'Erreur de chargement' : 'Aucun chantier assigné'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isError
                ? 'Vérifiez votre connexion et réessayez'
                : 'Votre responsable vous assignera bientôt un chantier'}
            </Text>
            {isError && (
              <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
  },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  username: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  role: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statsBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statsNumber: { fontSize: 28, fontWeight: '800', color: '#fff' },
  statsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark, marginBottom: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontSize: 12, color: colors.textMuted, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardDescription: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: 12 },

  // Progress
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressBar: {
    flex: 1, height: 6, backgroundColor: '#F0F0F0',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { fontSize: 12, color: colors.textMuted, minWidth: 32, textAlign: 'right' },

  // Footer
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  managerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  managerName: { fontSize: 13, color: colors.textMuted },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark, marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retryButton: {
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: colors.primary, borderRadius: 8,
  },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});