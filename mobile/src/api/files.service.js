import api from './axios';
import { File, Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as IntentLauncher from 'expo-intent-launcher';
import * as SecureStore from 'expo-secure-store';
import { Alert, Linking, Platform } from 'react-native';

function safeFileName(fileName) {
  return (fileName || 'project-file')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
}

export function getReadableFileName(fileName) {
  if (!fileName) return '';
  try {
    return /%[0-9a-f]{2}/i.test(fileName) ? decodeURIComponent(fileName) : fileName;
  } catch {
    return fileName;
  }
}

function fileNameWithExtension(originalName, mimeType) {
  const fileName = safeFileName(getReadableFileName(originalName));
  if (/\.[a-z0-9]{2,5}$/i.test(fileName)) return fileName;
  if (mimeType === 'image/png') return `${fileName}.png`;
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return `${fileName}.jpg`;
  if (mimeType === 'application/pdf') return `${fileName}.pdf`;
  return fileName;
}

async function downloadToCache({ downloadUrl, originalName, mimeType }) {
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) throw new Error('Session expired');
  if (!downloadUrl) throw new Error('Download link unavailable');

  const destination = new File(
    Paths.cache,
    `${Date.now()}-${fileNameWithExtension(originalName, mimeType)}`
  );
  const downloadedFile = await File.downloadFileAsync(downloadUrl, destination, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return downloadedFile.uri;
}

async function saveToGallery({ localUri, downloadUrl, originalName, mimeType }) {
  let uri = localUri;

  let localFileExists = false;
  try {
    localFileExists = !!uri && new File(uri).exists;
  } catch (error) {
    localFileExists = false;
  }

  if (!localFileExists) {
    uri = await downloadToCache({ downloadUrl, originalName, mimeType });
  }

  await MediaLibrary.saveToLibraryAsync(uri);
  return uri;
}

function getResponseErrorMessage(data, status) {
  try {
    const text = typeof data === 'string'
      ? data
      : new TextDecoder().decode(new Uint8Array(data).subarray(0, 65536));
    const parsed = JSON.parse(text);
    if (parsed?.message) return parsed.message;
  } catch {
    // Non-JSON server errors use the clear status fallback below.
  }
  return `Download failed (HTTP ${status})`;
}

export const filesService = {
  getByProject: (projectId) =>
    api.get(`/files/projects/${projectId}`).then((r) => r.data.data),

  getById: (fileId) =>
    api.get(`/files/${fileId}`).then((r) => r.data.data),

  upload: (formData, onUploadProgress) =>
    api.post('/files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }).then((r) => r.data.data),

  downloadToCache,
  saveToGallery,

  downloadAndOpen: async ({ downloadUrl, originalName, mimeType }) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('Session expirée');
    if (!downloadUrl) throw new Error('Lien de téléchargement indisponible');

    if (mimeType && mimeType !== 'application/pdf') {
      throw new Error('This file is not a PDF.');
    }

    const destination = new File(
      Paths.cache,
      `${Date.now()}-${fileNameWithExtension(originalName, 'application/pdf')}`
    );
    const response = await api.get(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });
    if (response.status !== 200) {
      throw new Error(getResponseErrorMessage(response.data, response.status));
    }

    const bytes = typeof response.data === 'string'
      ? new TextEncoder().encode(response.data)
      : new Uint8Array(response.data);
    const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
    if (bytes.length < pdfSignature.length || !pdfSignature.every((byte, i) => bytes[i] === byte)) {
      throw new Error('The server response is not a valid PDF file.');
    }

    destination.write(bytes);
    if (!destination.exists || destination.size <= 0) {
      throw new Error('The downloaded PDF could not be saved.');
    }

    if (Platform.OS === 'android') {
      try {
        const contentUri = await FileSystem.getContentUriAsync(destination.uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: 'application/pdf',
        });
      } catch {
        Alert.alert(
          'Lecteur PDF manquant',
          'Veuillez installer un lecteur PDF pour ouvrir ce document.'
        );
      }
    } else {
      await Linking.openURL(destination.uri);
    }
    return destination.uri;
  },
};
