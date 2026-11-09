import api from './axios';
import { File, Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as IntentLauncher from 'expo-intent-launcher';
import * as SecureStore from 'expo-secure-store';
import { Alert, Linking, Platform } from 'react-native';
import { useAuthStore } from '../store/auth.store';

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

export function isImageFile(file) {
  if (!file) return false;
  const mimeType = (file.mimeType || '').toLowerCase();
  if (mimeType.startsWith('image/')) return true;

  const fileName = (file.originalName || file.name || '').toLowerCase();
  return /\.(jpe?g|png|gif|webp|bmp|heic|heif|svg)$/i.test(fileName);
}

function fileNameWithExtension(originalName, mimeType) {
  const fileName = safeFileName(getReadableFileName(originalName));
  if (/\.[a-z0-9]{2,5}$/i.test(fileName)) return fileName;
  if (mimeType === 'image/png') return `${fileName}.png`;
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return `${fileName}.jpg`;
  if (mimeType === 'image/webp') return `${fileName}.webp`;
  if (mimeType === 'application/pdf') return `${fileName}.pdf`;
  return fileName;
}

export function resolveDownloadUrl(fileOrUrl, fileId) {
  let targetUrl = '';
  let id = fileId;

  if (typeof fileOrUrl === 'string') {
    targetUrl = fileOrUrl;
  } else if (fileOrUrl && typeof fileOrUrl === 'object') {
    targetUrl = fileOrUrl.downloadUrl || '';
    if (!id) id = fileOrUrl.id;
  }

  const base = (api.defaults.baseURL || '').replace(/\/+$/, '');

  // 1. Always construct the download URL from api.defaults.baseURL when file?.id is available:
  //    ${baseUrl}/files/${file.id}/download
  if (id) {
    return `${base}/files/${id}/download`;
  }

  if (!targetUrl) return '';

  // 2. Relative paths
  if (targetUrl.startsWith('/')) {
    if (base.endsWith('/api') && targetUrl.startsWith('/api/')) {
      const origin = base.slice(0, -4);
      return `${origin}${targetUrl}`;
    }
    return `${base}${targetUrl}`;
  }

  // 3. Absolute URLs - force https:// if api.defaults.baseURL uses https:// to avoid 301 redirects on Render
  try {
    if (base.startsWith('http')) {
      const baseParsed = new URL(base);
      const urlParsed = new URL(targetUrl);

      if (baseParsed.protocol === 'https:' && urlParsed.protocol === 'http:') {
        urlParsed.protocol = 'https:';
      }

      const isSameHost = urlParsed.hostname === baseParsed.hostname;
      const isLoopbackOrEmulator =
        urlParsed.hostname === 'localhost' ||
        urlParsed.hostname === '127.0.0.1' ||
        urlParsed.hostname === '10.0.2.2';

      if (isSameHost || (isLoopbackOrEmulator && baseParsed.hostname !== urlParsed.hostname)) {
        return `${baseParsed.origin}${urlParsed.pathname}${urlParsed.search}`;
      }

      return urlParsed.toString();
    }
  } catch {
    // Fallback URL string replacement
    if (base.startsWith('https://') && targetUrl.startsWith('http://')) {
      return 'https://' + targetUrl.slice(7);
    }
  }

  if (base.startsWith('https://') && targetUrl.startsWith('http://')) {
    return 'https://' + targetUrl.slice(7);
  }

  return targetUrl;
}

async function getAuthToken() {
  try {
    const storeToken = useAuthStore.getState().token;
    if (storeToken) return storeToken;
  } catch {
    // fallback to SecureStore
  }
  return await SecureStore.getItemAsync('accessToken');
}

async function downloadToCache(fileOrOptions) {
  const fileObj = typeof fileOrOptions === 'object' && fileOrOptions !== null ? fileOrOptions : {};
  const downloadUrl = fileObj.downloadUrl || (typeof fileOrOptions === 'string' ? fileOrOptions : '');
  const fileId = fileObj.id;
  const originalName = fileObj.originalName || fileObj.name || 'file';
  const mimeType = fileObj.mimeType || '';

  const token = await getAuthToken();
  const resolvedUrl = resolveDownloadUrl(downloadUrl || fileObj, fileId);
  if (!resolvedUrl && !fileId) throw new Error('Lien de téléchargement indisponible');

  const fileKey = fileId ? String(fileId).slice(0, 36) : Date.now();
  const cacheName = `cp_${fileKey}_${fileNameWithExtension(originalName, mimeType)}`;
  const destination = new File(Paths.cache, cacheName);

  // Cache Integrity: If a valid cached file (> 0 bytes) exists, reuse it.
  // If an empty 0-byte file exists from a previous failed attempt, delete it and re-download.
  if (destination.exists) {
    if (destination.size > 0) {
      return destination.uri;
    }
    try {
      destination.delete();
    } catch {
      // ignore deletion failure
    }
  }

  // Primary: Pass relative path /files/:id/download so Axios naturally prepends
  // api.defaults.baseURL (HTTPS) and runs the existing axios.js request interceptor.
  const requestPath = fileId ? `/files/${fileId}/download` : resolvedUrl;
  const config = {
    responseType: 'arraybuffer',
    validateStatus: () => true,
  };

  // Only merge Authorization header when token is a non-empty string.
  // Otherwise, let axios.js request interceptor attach the token from SecureStore.
  if (token && typeof token === 'string' && token.trim()) {
    config.headers = { Authorization: `Bearer ${token.trim()}` };
  }

  try {
    const response = await api.get(requestPath, config);
    if (response.status !== 200) {
      throw new Error(getResponseErrorMessage(response.data, response.status));
    }

    const bytes = typeof response.data === 'string'
      ? new TextEncoder().encode(response.data)
      : new Uint8Array(response.data);

    if (bytes.length === 0) {
      throw new Error('Le fichier téléchargé est vide.');
    }

    destination.write(bytes);
    if (!destination.exists || destination.size <= 0) {
      try { destination.delete(); } catch {}
      throw new Error('Impossible d’enregistrer le fichier téléchargé.');
    }
    return destination.uri;
  } catch (apiError) {
    // Clean fallback: If api.get failed and resolvedUrl is available, try File.downloadFileAsync
    if (resolvedUrl) {
      try {
        const downloadOptions = { idempotent: true };
        if (config.headers?.Authorization) {
          downloadOptions.headers = { Authorization: config.headers.Authorization };
        } else if (token && typeof token === 'string' && token.trim()) {
          downloadOptions.headers = { Authorization: `Bearer ${token.trim()}` };
        }
        const downloadedFile = await File.downloadFileAsync(resolvedUrl, destination, downloadOptions);
        if (downloadedFile && destination.exists && destination.size > 0) {
          return destination.uri;
        }
      } catch {
        // preserve original apiError
      }
    }

    // Clean up empty destination if left behind
    try {
      if (destination.exists && destination.size <= 0) {
        destination.delete();
      }
    } catch {}

    throw apiError;
  }
}

async function openLocalPdf(uri) {
  if (Platform.OS === 'android') {
    try {
      const contentUri = await FileSystem.getContentUriAsync(uri);
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
    await Linking.openURL(uri);
  }
  return uri;
}

async function saveToGallery(fileOrOptions) {
  const fileObj = typeof fileOrOptions === 'object' && fileOrOptions !== null ? fileOrOptions : {};
  let uri = fileObj.localUri;

  let localFileExists = false;
  try {
    localFileExists = !!uri && new File(uri).exists && new File(uri).size > 0;
  } catch (error) {
    localFileExists = false;
  }

  if (!localFileExists) {
    uri = await downloadToCache(fileOrOptions);
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
  return `Échec du téléchargement (HTTP ${status})`;
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
  isImageFile,
  resolveDownloadUrl,

  downloadAndOpen: async (fileOrOptions) => {
    const fileObj = typeof fileOrOptions === 'object' && fileOrOptions !== null ? fileOrOptions : {};
    const downloadUrl = fileObj.downloadUrl || (typeof fileOrOptions === 'string' ? fileOrOptions : '');
    const fileId = fileObj.id;
    const originalName = fileObj.originalName || fileObj.name || 'document.pdf';
    const mimeType = fileObj.mimeType || '';

    const token = await getAuthToken();
    const resolvedUrl = resolveDownloadUrl(downloadUrl || fileObj, fileId);
    if (!resolvedUrl && !fileId) throw new Error('Lien de téléchargement indisponible');

    if (mimeType && mimeType !== 'application/pdf') {
      throw new Error('Ce fichier n’est pas un PDF.');
    }

    const fileKey = fileId ? String(fileId).slice(0, 36) : Date.now();
    const destination = new File(
      Paths.cache,
      `cp_${fileKey}_${fileNameWithExtension(originalName, 'application/pdf')}`
    );

    // Reuse valid cached PDF if available; clear 0-byte file if corrupt
    if (destination.exists) {
      if (destination.size > 0) {
        return await openLocalPdf(destination.uri);
      }
      try {
        destination.delete();
      } catch {
        // ignore
      }
    }

    const requestPath = fileId ? `/files/${fileId}/download` : resolvedUrl;
    const config = {
      responseType: 'arraybuffer',
      validateStatus: () => true,
    };

    if (token && typeof token === 'string' && token.trim()) {
      config.headers = { Authorization: `Bearer ${token.trim()}` };
    }

    const response = await api.get(requestPath, config);
    if (response.status !== 200) {
      throw new Error(getResponseErrorMessage(response.data, response.status));
    }

    const bytes = typeof response.data === 'string'
      ? new TextEncoder().encode(response.data)
      : new Uint8Array(response.data);
    const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
    if (bytes.length < pdfSignature.length || !pdfSignature.every((byte, i) => bytes[i] === byte)) {
      throw new Error('Le serveur n’a pas renvoyé un document PDF valide.');
    }

    destination.write(bytes);
    if (!destination.exists || destination.size <= 0) {
      try { destination.delete(); } catch {}
      throw new Error('Impossible d’enregistrer le PDF téléchargé.');
    }

    return await openLocalPdf(destination.uri);
  },
};
