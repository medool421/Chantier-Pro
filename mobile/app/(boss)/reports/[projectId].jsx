import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/theme/colors';
import api from '../../../src/api/axios';

export default function ProjectReports() {
    const { projectId } = useLocalSearchParams();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        fetchReports();
    }, [projectId]);

    const fetchReports = async () => {
        try {
            // Adjusted endpoint based on common REST patterns
            const response = await api.get(`/reports/project/${projectId}`);
            setReports(response.data.data || []);
        } catch (error) {
            console.error(error);
            // alert('Impossible de charger les rapports');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => setSelectedReport(item)}>
            <View style={styles.cardHeader}>
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
                <Ionicons name="documents-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.title} numberOfLines={1}>{item.title || 'Rapport journalier'}</Text>
            <Text style={styles.preview} numberOfLines={2}>{item.content}</Text>
            <View style={styles.authorRow}>
                <Text style={styles.author}>Par: {item.author?.firstName || 'Inconnu'}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={reports}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Aucun rapport disponible pour ce chantier.</Text>
                        </View>
                    }
                />
            )}

            {/* Report Detail Modal */}
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

                            <Text style={styles.modalDate}>{new Date(selectedReport.date).toLocaleDateString()} - {new Date(selectedReport.date).toLocaleTimeString()}</Text>

                            <View style={styles.divider} />

                            <Text style={styles.modalReportTitle}>{selectedReport.title}</Text>
                            <Text style={styles.modalBody}>{selectedReport.content}</Text>

                            <View style={styles.modalFooter}>
                                <Text style={styles.modalAuthor}>Rédigé par: {selectedReport.author?.firstName} {selectedReport.author?.lastName}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
    },
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    date: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '600',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textDark,
        marginBottom: 4,
    },
    preview: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: 12,
    },
    authorRow: {
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
        paddingTop: 8,
    },
    author: {
        fontSize: 12,
        color: colors.textDark,
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: colors.textMuted,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalContent: {
        padding: 24,
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textDark,
    },
    modalDate: {
        color: colors.textMuted,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginBottom: 20,
    },
    modalReportTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
        color: colors.textDark,
    },
    modalBody: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    },
    modalFooter: {
        marginTop: 40,
        alignItems: 'flex-end',
    },
    modalAuthor: {
        fontSize: 14,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
});
