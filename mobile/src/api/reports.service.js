import api from './axios';

export const reportsService = {
  getByProject: (projectId) =>
    api.get(`/reports/project/${projectId}`).then((r) => r.data.data),

  create: (projectId, data) =>
    api.post(`/projects/${projectId}/reports`, data).then((r) => r.data),
};