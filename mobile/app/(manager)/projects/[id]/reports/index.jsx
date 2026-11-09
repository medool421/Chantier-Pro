import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../src/theme/colors';
import { useProjectReports } from '../../../../../src/hooks/useReports';
import ReportImagePreview from '../../../../../src/components/ReportImagePreview';

export default function ManagerReports() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState(null);

  const {
    data: reports = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useProjectReports(id);

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
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedReport(item)}
      activeOpacity={0.9}
    >
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
      {!!item.imageUrl && (
        <ReportImagePreview report={item} compact />
      )}
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
                {new Date(selectedReport.reportDate || selectedReport.date).toLocaleDateString('fr-FR')}
              </Text>
              <View style={styles.divider} />
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalReportTitle}>{selectedReport.title}</Text>
                <Text style={styles.modalBody}>{selectedReport.content}</Text>
                {!!selectedReport.imageUrl && (
                  <ReportImagePreview report={selectedReport} style={styles.modalImage} />
                )}
                <View style={styles.modalFooter}>
                  <Text style={styles.modalAuthor}>
                    {selectedReport.user ? `Rédigé par: ${selectedReport.user.firstName} ${selectedReport.user.lastName}` : ''}
                  </Text>
                </View>
              </ScrollView>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textDark },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  addButtonText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  date: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '800' },
  content: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textDark },
  modalDate: { color: colors.textMuted, marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginBottom: 16 },
  modalReportTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.textDark },
  modalBody: { fontSize: 16, color: '#333', lineHeight: 24 },
  modalImage: { marginVertical: 16 },
  modalFooter: { marginTop: 32, marginBottom: 24, alignItems: 'flex-end' },
  modalAuthor: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
});
