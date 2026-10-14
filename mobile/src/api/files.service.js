import api from './axios';
import { File, Paths } from 'expo-file-system';
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { Linking } from 'react-native';

function safeFileName(fileName) {
  return (fileName || 'project-file')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
}

export const filesService = {
  getByProject: (projectId) =>
    api.get(`/files/projects/${projectId}`).then((r) => r.data.data),

  getById: (fileId) =>
    api.get(`/files/${fileId}`).then((r) => r.data.data),

  upload: (formData) =>
    api.post('/files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data),

  downloadAndOpen: async ({ downloadUrl, originalName }) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('Session expirée');
    if (!downloadUrl) throw new Error('Lien de téléchargement indisponible');

    const destination = new File(
      Paths.cache,
      `${Date.now()}-${safeFileName(originalName)}`
    );
    const downloadedFile = await File.downloadFileAsync(downloadUrl, destination, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const openUri = await getContentUriAsync(downloadedFile.uri);

    await Linking.openURL(openUri);
    return downloadedFile.uri;
  },
};
