import api from './axios';

export const filesService = {
  getByProject: (projectId) =>
    api.get(`/files/projects/${projectId}`).then((r) => r.data.data),

  upload: (formData) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
};