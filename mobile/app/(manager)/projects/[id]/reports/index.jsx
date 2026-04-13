import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../src/theme/colors';
import { useProjectReports } from '../../../../../src/hooks/useReports';

export default function ManagerReports() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: reports = [], isLoading, isRefetching, refetch } = useProjectReports(id);

  const getReportIcon = (type) => {
    switch (type) {
      case 'INCIDENT': return 'alert-circle-outline';
      case 'WEEKLY': return 'calendar-outline';
      default: return 'document-text-outline';
    }
  };

  const getReportColor = (type) => {
    switch (type) {
      case 'INCIDENT': return '#C62828';
      case 'WEEKLY': return '#1976D2';
      default: return colors.primary;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getReportColor(item.type) + '15' }]}>
          <Ionicons name={getReportIcon(item.type)} size={24} color={getReportColor(item.type)} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.date}>{new Date(item.reportDate || item.date).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: getReportColor(item.type) + '15' }]}>
          <Text style={[styles.typeText, { color: getReportColor(item.type) }]}>{item.type}</Text>
        </View>
      </View>
      <Text style={styles.content} numberOfLines={3}>{item.content}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rapports de chantier</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push({ pathname: `/(manager)/projects/${id}/reports/create`, params: { projectId: id } })}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id || item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun rapport envoyé pour le moment.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textDark },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  addButtonText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  date: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '800' },
  content: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.textMuted, marginTop: 16, textAlign: 'center', paddingHorizontal: 40 },
});
