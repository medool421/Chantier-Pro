import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../src/theme/colors';
import ThemedTextInput from '../../../../src/components/ThemedTextInput';
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

const FILE_CATEGORIES = [
  { value: 'PLANS', label: 'Plans' },
  { value: 'UPDATES', label: 'Mises à jour' },
  { value: 'NORMS', label: 'Normes & conformité' },
  { value: 'OTHER', label: 'Autres documents' },
];

const LEGACY_CATEGORY_MAP = { BEFORE: 'UPDATES', AFTER: 'UPDATES', ISSUE: 'OTHER' };

function getFileCategory(file) {
  return file.category || LEGACY_CATEGORY_MAP[file.type] || file.type || 'OTHER';
}

function categoryLabel(category) {
  return FILE_CATEGORIES.find((item) => item.value === category)?.label || 'Autres documents';
}

function getNameBase(fileName) {
  const name = getReadableFileName(fileName).replace(/\.[^./\\]+$/, '');
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_').slice(0, 100) || 'Fichier';
}

function cameraPhotoName() {
  const now = new Date();
  return `Photo_du_${String(now.getDate()).padStart(2, '0')}_${String(now.getMonth() + 1).padStart(2, '0')}`;
}

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
  const [fileType, setFileType] = useState('UPDATES');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [pendingUpload, setPendingUpload] = useState(null);
  const [fileNameDraft, setFileNameDraft] = useState('');
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
  const visibleFiles = selectedCategory === 'ALL'
    ? files
    : files.filter((file) => getFileCategory(file) === selectedCategory);

  const choosePhoto = async (source) => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', source === 'camera' ? 'Autorisez l’accès à la caméra pour continuer.' : 'Autorisez la galerie pour continuer.');
      return;
    }
    const picker = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await picker({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    const name = getUploadImageName(asset);
    const mimeType = asset.mimeType || IMAGE_MIME_BY_EXTENSION[name.split('.').pop()?.toLowerCase()] || 'image/jpeg';
    const extension = name.split('.').pop()?.toLowerCase() || 'jpg';
    setPendingUpload({ uri: asset.uri, mimeType, extension, category: fileType });
    setFileNameDraft(source === 'camera' ? cameraPhotoName() : getNameBase(name));
  };

  const submitUpload = (formData) => {
    setFailedUpload(null);
    setUploadProgress(0);
    uploadMutation.mutate({ formData, onUploadProgress: ({ loaded, total }) => {
      if (total) setUploadProgress(Math.round((loaded / total) * 100));
    } }, {
      onSuccess: () => {
        setFailedUpload(null);
        Alert.alert('Succès', 'Fichier ajouté au projet.');
      },
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
    setPendingUpload({ uri: asset.uri, mimeType: 'application/pdf', extension: 'pdf', category: fileType });
    setFileNameDraft(getNameBase(asset.name));
  };

  const cancelNameEntry = () => {
    setPendingUpload(null);
    setFileNameDraft('');
  };

  const confirmUpload = () => {
    if (!pendingUpload) return;
    const extension = pendingUpload.extension.toLowerCase();
    let baseName = fileNameDraft.trim().replace(/[\\/\u0000-\u001f]/g, ' ');
    if (baseName.toLowerCase().endsWith(`.${extension}`)) {
      baseName = baseName.slice(0, -(extension.length + 1)).trim();
    }
    if (!baseName) {
      Alert.alert('Nom manquant', 'Saisissez un nom pour le fichier.');
      return;
    }

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('type', pendingUpload.category);
    formData.append('file', {
      uri: pendingUpload.uri,
      name: `${baseName.slice(0, 120)}.${extension}`,
      type: pendingUpload.mimeType,
    });
    cancelNameEntry();
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
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={visibleFiles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
        ListHeaderComponent={(
          <View>
            <View style={styles.uploadPanel}>
              <Text style={styles.panelTitle}>Ajouter un fichier</Text>
              <Text style={styles.sectionLabel}>Classer dans</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
                {FILE_CATEGORIES.map(({ value, label }) => (
                  <TouchableOpacity key={value} style={[styles.typeButton, fileType === value && styles.selectedType]} onPress={() => setFileType(value)}>
                    <Text style={[styles.typeButtonText, fileType === value && styles.selectedTypeText]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.uploadButton, uploadMutation.isPending && styles.disabled]} onPress={() => choosePhoto('camera')} disabled={uploadMutation.isPending}>
                <Ionicons name="camera-outline" size={20} color="#fff" /><Text style={styles.uploadText}>Prendre une photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.uploadButton, uploadMutation.isPending && styles.disabled]} onPress={() => choosePhoto('gallery')} disabled={uploadMutation.isPending}>
                <Ionicons name="images-outline" size={20} color="#fff" /><Text style={styles.uploadText}>Choisir dans la galerie</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pdfButton, uploadMutation.isPending && styles.disabled]} onPress={uploadPdf} disabled={uploadMutation.isPending}>
                <Ionicons name="document-attach-outline" size={20} color={colors.primary} /><Text style={styles.pdfText}>Choisir un PDF (max. 10 Mo)</Text>
              </TouchableOpacity>
              {uploadMutation.isPending && <Text style={styles.uploadStatus}>Envoi : {uploadProgress}%</Text>}
              {failedUpload && !uploadMutation.isPending && <TouchableOpacity onPress={() => submitUpload(failedUpload)}><Text style={styles.retryText}>Échec de l’envoi · Réessayer</Text></TouchableOpacity>}
            </View>
            <View style={styles.filterSection}>
              <Text style={styles.sectionLabel}>Fichiers du projet</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
                {[{ value: 'ALL', label: 'Tous' }, ...FILE_CATEGORIES].map(({ value, label }) => (
                  <TouchableOpacity key={value} style={[styles.filterChip, selectedCategory === value && styles.filterChipActive]} onPress={() => setSelectedCategory(value)}>
                    <Text style={[styles.filterText, selectedCategory === value && styles.filterTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}><Ionicons name="folder-open-outline" size={30} color={colors.primary} /></View>
              <Text style={styles.emptyTitle}>Aucun fichier pour le moment</Text>
              <Text style={styles.emptyDescription}>Les fichiers ajoutés apparaîtront ici.</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openFile(item)} disabled={openingFileId === item.id}>
            {openingFileId === item.id ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="document-text-outline" size={22} color={colors.primary} />}
            <View style={styles.details}>
              <Text style={styles.title}>{getReadableFileName(item.originalName) || 'Fichier sans nom'}</Text>
              <Text style={styles.subtitle}>{categoryLabel(getFileCategory(item))} · {item.mimeType || 'Type inconnu'} · {formatSize(item.size)}</Text>
              {item.createdAt && <Text style={styles.date}>Ajouté le {new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>}
            </View>
          </TouchableOpacity>
        )}
      />
      <Modal visible={!!pendingUpload} transparent animationType="fade" onRequestClose={cancelNameEntry}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboard}>
            <View style={styles.nameModal}>
              <Text style={styles.modalTitle}>Nom du fichier</Text>
              <View style={styles.fileNameRow}>
                <ThemedTextInput autoFocus value={fileNameDraft} onChangeText={setFileNameDraft} maxLength={120} style={styles.fileNameInput} returnKeyType="done" onSubmitEditing={confirmUpload} />
                <Text style={styles.extensionLabel}>.{pendingUpload?.extension}</Text>
              </View>
              <Text style={styles.modalCategory}>{categoryLabel(pendingUpload?.category)}</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelNameEntry}><Text style={styles.cancelText}>Annuler</Text></TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={confirmUpload}><Text style={styles.confirmText}>Ajouter</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 2, paddingRight: 8 },
  typeButton: { borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  selectedType: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeButtonText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  selectedTypeText: { color: '#fff' },
  filterSection: { marginBottom: 14, gap: 8 },
  filterChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  filterTextActive: { color: '#fff' },
  uploadButton: { backgroundColor: colors.primary, minHeight: 48, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  uploadText: { color: '#fff', fontWeight: '600', flexShrink: 1, textAlign: 'center' },
  pdfButton: { borderWidth: 1, borderColor: colors.primary, minHeight: 48, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  pdfText: { color: colors.primary, fontWeight: '600', flexShrink: 1, textAlign: 'center' },
  uploadStatus: { textAlign: 'center', color: colors.textMuted, marginTop: 8 },
  disabled: { opacity: 0.65 },
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCard: { width: '100%', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  emptyIconContainer: { width: 60, height: 60, borderRadius: 16, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { color: colors.textDark, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptyDescription: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  error: { color: colors.error, textAlign: 'center', marginBottom: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 24 },
  modalKeyboard: { width: '100%' },
  nameModal: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { color: colors.textDark, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  fileNameRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12 },
  fileNameInput: { flex: 1, minHeight: 48, fontSize: 15, color: colors.textDark },
  extensionLabel: { color: colors.textMuted, fontWeight: '600', marginLeft: 8 },
  modalCategory: { color: colors.textMuted, fontSize: 12, marginTop: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 12 },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  confirmButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  confirmText: { color: '#fff', fontWeight: '700' },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  retryText: { color: colors.error, textAlign: 'center', marginTop: 8, fontWeight: '600' },
});
