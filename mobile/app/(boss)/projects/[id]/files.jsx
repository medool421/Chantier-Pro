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
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../src/theme/colors';
import { useProjectFiles, useUploadFile } from '../../../../src/hooks/useFiles';
import { filesService, getReadableFileName } from '../../../../src/api/files.service';
import ImagePreviewModal from '../../../../src/components/ImagePreviewModal';

function formatSize(size) {
  if (!size) return 'Taille inconnue';
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

const IMAGE_MIME_BY_EXTENSION = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', bmp: 'image/bmp', heic: 'image/heic', heif: 'image/heif',
};

function getUploadImageName(asset) {
  const name = getReadableFileName(asset.fileName || asset.uri.split('/').pop() || '');
  const extension = name.split('.').pop()?.toLowerCase();
  if (extension && IMAGE_MIME_BY_EXTENSION[extension]) return name;
  const mime = asset.mimeType?.toLowerCase();
  const mimeExtension = Object.entries(IMAGE_MIME_BY_EXTENSION).find(([, value]) => value === mime)?.[0] || 'jpg';
  return `project-file-${Date.now()}.${mimeExtension}`;
}

export default function ProjectFiles() {
  const { id } = useLocalSearchParams();
  const projectId = Array.isArray(id) ? id[0] : id;
  const [openingFileId, setOpeningFileId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState('AFTER');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [failedUpload, setFailedUpload] = useState(null);
  const uploadMutation = useUploadFile(projectId);
  const {
    data: files = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useProjectFiles(projectId);

  const uploadImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', 'Autorisez la galerie pour continuer.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    const name = getUploadImageName(asset);
    const mimeType = asset.mimeType || IMAGE_MIME_BY_EXTENSION[name.split('.').pop()?.toLowerCase()] || 'image/jpeg';
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('type', fileType);
    formData.append('file', { uri: asset.uri, name, type: mimeType });
    submitUpload(formData);
  };

  const submitUpload = (formData) => {
    setFailedUpload(null);
    setUploadProgress(0);
    uploadMutation.mutate({ formData, onUploadProgress: ({ loaded, total }) => {
      if (total) setUploadProgress(Math.round((loaded / total) * 100));
    } }, {
      onSuccess: () => setFailedUpload(null),
      onError: (error) => Alert.alert(
        'Erreur', error.response?.data?.message || "Impossible d'ajouter le fichier.",
        [{ text: 'Fermer' }, { text: 'Réessayer', onPress: () => setFailedUpload(formData) }]
      ),
    });
  };

  const uploadPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf', copyToCacheDirectory: true, multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.size > 10 * 1024 * 1024) {
      Alert.alert('Fichier trop volumineux', 'La taille maximale est de 10 Mo.');
      return;
    }
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('type', fileType);
    formData.append('file', { uri: asset.uri, name: asset.name, type: 'application/pdf' });
    submitUpload(formData);
  };

  const openFile = async (file) => {
    setOpeningFileId(file.id);
    try {
      const isImage = file.mimeType?.startsWith('image/')
        || /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(file.originalName || '');

      if (isImage) {
        const localUri = await filesService.downloadToCache(file);
        setPreview({ file, uri: localUri });
      } else {
        await filesService.downloadAndOpen(file);
      }
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
    <>
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
      ListHeaderComponent={(
        <View style={styles.uploadPanel}>
          <Text style={styles.panelTitle}>Ajouter un fichier</Text>
          <View style={styles.typeRow}>
            {['BEFORE', 'AFTER', 'ISSUE'].map((type) => (
              <TouchableOpacity key={type} style={[styles.typeButton, fileType === type && styles.selectedType]} onPress={() => setFileType(type)}>
                <Text style={[styles.typeButtonText, fileType === type && styles.selectedTypeText]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.uploadButton, uploadMutation.isPending && styles.disabled]} onPress={uploadImage} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? <ActivityIndicator color="#fff" /> : <><Ionicons name="cloud-upload-outline" size={20} color="#fff" /><Text style={styles.uploadText}>Choisir une photo</Text></>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pdfButton, uploadMutation.isPending && styles.disabled]} onPress={uploadPdf} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? <ActivityIndicator color={colors.primary} /> : <><Ionicons name="document-attach-outline" size={20} color={colors.primary} /><Text style={styles.pdfText}>Choisir un PDF (max. 10 Mo)</Text></>}
          </TouchableOpacity>
          {uploadMutation.isPending && <Text style={styles.uploadStatus}>Envoi : {uploadProgress}%</Text>}
          {failedUpload && !uploadMutation.isPending && <TouchableOpacity onPress={() => submitUpload(failedUpload)}><Text style={styles.retryText}>Échec de l’envoi · Réessayer</Text></TouchableOpacity>}
        </View>
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
            <Text style={styles.title}>{getReadableFileName(item.originalName) || 'Fichier sans nom'}</Text>
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
      <ImagePreviewModal
        visible={!!preview}
        file={preview?.file}
        uri={preview?.uri}
        onClose={() => setPreview(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flexGrow: 1 },
  uploadPanel: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, gap: 10 },
  panelTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2, color: colors.textDark },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  typeButton: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: '#ddd', paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  selectedType: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeButtonText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  selectedTypeText: { color: '#fff' },
  uploadButton: { backgroundColor: colors.primary, minHeight: 48, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  uploadText: { color: '#fff', fontWeight: '600', flexShrink: 1, textAlign: 'center' },
  pdfButton: { borderWidth: 1, borderColor: colors.primary, minHeight: 48, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  pdfText: { color: colors.primary, fontWeight: '600', flexShrink: 1, textAlign: 'center' },
  uploadStatus: { textAlign: 'center', color: colors.textMuted, marginTop: 8 },
  disabled: { opacity: 0.65 },
  retryText: { color: colors.error, textAlign: 'center', marginTop: 8, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  details: { flex: 1, minWidth: 0, marginLeft: 12 },
  title: { fontWeight: '600', fontSize: 15, flexShrink: 1 },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  date: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  empty: { textAlign: 'center', marginTop: 40, color: colors.textMuted, fontStyle: 'italic' },
  error: { color: colors.error, textAlign: 'center', marginBottom: 12 },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
