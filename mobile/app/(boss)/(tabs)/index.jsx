import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';
import { colors } from '../../../src/theme/colors';
import { useProjects } from '../../../src/hooks/useProjects';
import NotificationBell from '../../../src/components/NotificationBell';

export default function BossHome() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const { data: projects = [], isLoading, isRefetching, refetch } = useProjects();
  const filteredProjects = useMemo(
    () => selectedStatus === 'ALL' ? projects : projects.filter((project) => project.status === selectedStatus),
    [projects, selectedStatus]
  );

  const renderProjectItem = ({ item }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => router.push(`/(boss)/projects/${item.id}`)}
    >
      <View style={styles.projectHeader}>
        <Text style={styles.projectTitle}>{item.name}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.projectDescription} numberOfLines={2}>
        {item.description || 'Aucune description'}
      </Text>
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(Number(item.progressPercentage) || 0, 100))}%` }]} />
        </View>
        <Text style={styles.progressText}>{Number(item.progressPercentage) || 0}%</Text>
      </View>
      <View style={styles.projectFooter}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <Text style={styles.locationText}>{item.address || 'N/A'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.username}>{user?.firstName || 'Boss'}</Text>
        </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.push('/(boss)/invitations')}
        >
          <Ionicons name="mail-outline" size={28} color={colors.textDark} />
        </TouchableOpacity>
        <NotificationBell />
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(boss)/profile')}
          >
            <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
          </TouchableOpacity>
     </View>
      </View>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes Chantiers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(boss)/projects/create')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
        {[
          { value: 'ALL', label: 'Toutes' },
          { value: 'PLANNED', label: 'Planifiés' },
          { value: 'IN_PROGRESS', label: 'En cours' },
          { value: 'COMPLETED', label: 'Terminés' },
        ].map((status) => (
          <TouchableOpacity
            key={status.value}
            style={[styles.filterChip, selectedStatus === status.value && styles.filterChipActive]}
            onPress={() => setSelectedStatus(status.value)}
          >
            <Text style={[styles.filterText, selectedStatus === status.value && styles.filterTextActive]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProjectItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{selectedStatus === 'ALL' ? 'Aucun chantier.' : 'Aucun chantier pour ce statut.'}</Text>
              
            </View>
          )
        }
        />
    </View>
  );
}

const StatusBadge = ({ status }) => {
  let badgeColor = '#E0E0E0';
  let textColor = '#757575';
  let label = status;

  switch (status) {
    case 'IN_PROGRESS':
      badgeColor = '#E8F5E9'; textColor = '#2E7D32'; label = 'En cours'; break;
    case 'COMPLETED':
      badgeColor = '#E3F2FD'; textColor = '#1565C0'; label = 'Terminé'; break;
    case 'PLANNED':
      badgeColor = '#FFF3E0'; textColor = '#EF6C00'; label = 'Planifié'; break;
    case 'ON_HOLD':
      badgeColor = '#FFEBEE'; textColor = '#C62828'; label = 'En pause'; break;
    default:
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
};
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight, paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 16, color: colors.textMuted },
  username: { fontSize: 24, fontWeight: 'bold', color: colors.textDark },
  profileButton: {},
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.textDark },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  addButtonText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
  listContent: { paddingBottom: 24 },
  projectCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  projectTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark, flex: 1 },
  projectDescription: { fontSize: 14, color: colors.textMuted, marginBottom: 12 },
  filterContainer: { gap: 8, paddingBottom: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0' },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { minWidth: 34, fontSize: 12, textAlign: 'right', color: colors.textMuted },
  projectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  locationText: { flex: 1, fontSize: 14, color: colors.textMuted, marginLeft: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
});
