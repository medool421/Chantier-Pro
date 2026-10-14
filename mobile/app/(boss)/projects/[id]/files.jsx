import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../src/theme/colors';
import { useProjectFiles } from '../../../../src/hooks/useFiles';
import { filesService } from '../../../../src/api/files.service';

function formatSize(size) {
  if (!size) return 'Taille inconnue';
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function ProjectFiles() {
  const { id } = useLocalSearchParams();
  const projectId = Array.isArray(id) ? id[0] : id;
  const [openingFileId, setOpeningFileId] = useState(null);
  const {
    data: files = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useProjectFiles(projectId);

  const openFile = async (file) => {
    setOpeningFileId(file.id);
    try {
      await filesService.downloadAndOpen(file);
    } catch (error) {
      // The download request remains authenticated; do not fall back to a
      // public filesystem URL when opening fails.
      Alert.alert('Erreur', error.message || 'Impossible d’ouvrir le fichier.');
    } finally {
      setOpeningFileId(null);
    }
  };

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
        <Text style={styles.error}>Impossible de charger les fichiers.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      refreshControl={(
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      )}
      ListEmptyComponent={<Text style={styles.empty}>Aucun fichier pour ce projet</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => openFile(item)}
          disabled={openingFileId === item.id}
        >
          {openingFileId === item.id ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="document-text-outline" size={22} color={colors.primary} />
          )}
          <View style={styles.details}>
            <Text style={styles.title}>{item.originalName || 'Fichier sans nom'}</Text>
            <Text style={styles.subtitle}>
              {item.type} · {item.mimeType || 'Type inconnu'} · {formatSize(item.size)}
            </Text>
            {item.createdAt && (
              <Text style={styles.date}>
                Ajouté le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  details: { flex: 1, marginLeft: 12 },
  title: { fontWeight: '600', fontSize: 15 },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  date: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  empty: { textAlign: 'center', marginTop: 40, color: colors.textMuted, fontStyle: 'italic' },
  error: { color: colors.error, textAlign: 'center', marginBottom: 12 },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
