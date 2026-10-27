import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../src/theme/colors';
import { useProjectFiles, useUploadFile } from '../../../../../src/hooks/useFiles';
import { filesService, getReadableFileName } from '../../../../../src/api/files.service';
import ImagePreviewModal from '../../../../../src/components/ImagePreviewModal';

const FILE_TYPES = ['BEFORE', 'AFTER', 'ISSUE'];

const MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  heic: 'image/heic',
  heif: 'image/heif',
};

const EXTENSION_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

function getImageMimeType(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return MIME_BY_EXTENSION[extension] || 'image/jpeg';
}

function getUploadFileName(asset) {
  const originalName = getReadableFileName(asset.fileName || asset.uri.split('/').pop() || '');
  const declaredMimeType = asset.mimeType?.toLowerCase();
  const extension = originalName.split('.').pop()?.toLowerCase();

  if (
    extension &&
    MIME_BY_EXTENSION[extension] &&
    (!declaredMimeType ||
      declaredMimeType === 'image/jpg' ||
      MIME_BY_EXTENSION[extension] === declaredMimeType)
  ) {
    return originalName;
  }

  const mimeType = declaredMimeType || getImageMimeType(originalName);
  const normalizedExtension = EXTENSION_BY_MIME[mimeType] || 'jpg';
  return `project-file-${Date.now()}.${normalizedExtension}`;
}

function formatSize(size) {
  if (!size) return 'Taille inconnue';
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function ManagerFiles() {
  const { id } = useLocalSearchParams();
  const projectId = Array.isArray(id) ? id[0] : id;
  const [fileType, setFileType] = useState('AFTER');
  const [openingFileId, setOpeningFileId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [failedUpload, setFailedUpload] = useState(null);
  const {
    data: files = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useProjectFiles(projectId);
  const uploadMutation = useUploadFile(projectId);

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
      Alert.alert('Erreur', error.message || 'Impossible d’ouvrir le fichier.');
    } finally {
      setOpeningFileId(null);
    }
  };

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
    const fileName = getUploadFileName(asset);
    const mimeType = asset.mimeType || getImageMimeType(fileName);
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('type', fileType);
    formData.append('file', {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    });

    submitUpload(formData);
  };

  const submitUpload = (formData) => {
    setFailedUpload(null);
    setUploadProgress(0);
    uploadMutation.mutate({ formData, onUploadProgress: ({ loaded, total }) => {
      if (total) setUploadProgress(Math.round((loaded / total) * 100));
    } }, {
      onSuccess: () => { setFailedUpload(null); Alert.alert('Succès', 'Fichier ajouté au projet.'); },
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
          <Text style={styles.panelTitle}>Ajouter une photo</Text>
          <View style={styles.typeRow}>
            {FILE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, fileType === type && styles.selectedType]}
                onPress={() => setFileType(type)}
              >
                <Text style={[styles.typeButtonText, fileType === type && styles.selectedTypeText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.uploadButton, uploadMutation.isPending && styles.disabled]}
            onPress={uploadImage}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.uploadText}>Choisir une photo</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pdfButton, uploadMutation.isPending && styles.disabled]}
            onPress={uploadPdf}
            disabled={uploadMutation.isPending}
          >
            <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
            <Text style={styles.pdfText}>Choisir un PDF</Text>
          </TouchableOpacity>
          {uploadMutation.isPending && <Text style={styles.uploadStatus}>Envoi : {uploadProgress}%</Text>}
          {failedUpload && !uploadMutation.isPending && (
            <TouchableOpacity onPress={() => submitUpload(failedUpload)}>
              <Text style={styles.retryText}>Échec de l’envoi · Réessayer</Text>
            </TouchableOpacity>
          )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  uploadPanel: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16 },
  panelTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: colors.textDark },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeButton: { flex: 1, borderWidth: 1, borderColor: '#ddd', paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  selectedType: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeButtonText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  selectedTypeText: { color: '#fff' },
  uploadButton: { backgroundColor: colors.primary, padding: 13, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  uploadText: { color: '#fff', fontWeight: '600' },
  pdfButton: { borderWidth: 1, borderColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  pdfText: { color: colors.primary, fontWeight: '600' },
  uploadStatus: { textAlign: 'center', color: colors.textMuted, marginTop: 8 },
  disabled: { opacity: 0.65 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  details: { flex: 1, marginLeft: 12 },
  title: { fontWeight: '600', fontSize: 15 },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  empty: { textAlign: 'center', marginTop: 20, color: colors.textMuted, fontStyle: 'italic' },
  error: { color: colors.error, textAlign: 'center', marginBottom: 12 },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
