import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
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

  const { data: projects = [], isLoading, isRefetching, refetch } = useProjects();

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

      <FlatList
        data={projects}
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
              <Text style={styles.emptyText}>Aucun chantier en cours.</Text>
              
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
  projectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 14, color: colors.textMuted, marginLeft: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
});