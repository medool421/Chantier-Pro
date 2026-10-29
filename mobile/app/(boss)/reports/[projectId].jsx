import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, Modal, RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/theme/colors';
import { useProjectReports } from '../../../src/hooks/useReports';

export default function ProjectReports() {
  const { projectId } = useLocalSearchParams();
  const [selectedReport, setSelectedReport] = useState(null);

  const { data: reports = [], isLoading, isError, isRefetching, refetch } = useProjectReports(projectId);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedReport(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{new Date(item.reportDate).toLocaleDateString()}</Text>
        <Ionicons name="documents-outline" size={20} color={colors.primary} />
      </View>
      <Text style={styles.title} numberOfLines={1}>{item.title || 'Rapport journalier'}</Text>
      <Text style={styles.preview} numberOfLines={2}>{item.content}</Text>
      <View style={styles.authorRow}>
        <Text style={styles.author}>Par: {item.user?.firstName || 'Inconnu'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Impossible de charger les rapports.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item._id || item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="documents-outline" size={30} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Aucun rapport pour le moment</Text>
              <Text style={styles.emptyDescription}>Les rapports disponibles apparaîtront ici.</Text>
            </View>
          </View>
        }
      />

      <Modal
        visible={!!selectedReport}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalContainer}>
          {selectedReport && (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Détails du Rapport</Text>
                <TouchableOpacity onPress={() => setSelectedReport(null)}>
                  <Ionicons name="close-circle" size={30} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalDate}>
                {new Date(selectedReport.reportDate).toLocaleDateString()}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.modalReportTitle}>{selectedReport.title}</Text>
              <Text style={styles.modalBody}>{selectedReport.content}</Text>
              <View style={styles.modalFooter}>
                <Text style={styles.modalAuthor}>
                  Rédigé par: {selectedReport.user?.firstName} {selectedReport.user?.lastName}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, flexGrow: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  date: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: colors.textDark, marginBottom: 4 },
  preview: { fontSize: 14, color: colors.textMuted, marginBottom: 12 },
  authorRow: { borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 8 },
  author: { fontSize: 12, color: colors.textDark, fontStyle: 'italic' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCard: { width: '100%', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  emptyIconContainer: { width: 60, height: 60, borderRadius: 16, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { color: colors.textDark, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptyDescription: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  retryButton: { marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalContent: { padding: 24, flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textDark },
  modalDate: { color: colors.textMuted, marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginBottom: 20 },
  modalReportTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.textDark },
  modalBody: { fontSize: 16, color: '#333', lineHeight: 24 },
  modalFooter: { marginTop: 40, alignItems: 'flex-end' },
  modalAuthor: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
});
