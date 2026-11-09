import api from './axios';

export const reportsService = {
  getByProject: (projectId) =>
    api.get(`/projects/${projectId}/reports`).then((r) => r.data.data),

  create: (projectId, data) => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
    return api.post(`/projects/${projectId}/reports`, data, config).then((r) => r.data);
  },
};
