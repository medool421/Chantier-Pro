import api from './axios';

export const projectsService = {
  getAll: () =>
    api.get('/projects').then((r) => r.data.data),

  getById: (id) =>
    api.get(`/projects/${id}`).then((r) => r.data.data),

  create: (data) =>
    api.post('/projects', data).then((r) => r.data),

  update: (id, data) =>
    api.put(`/projects/${id}`, data).then((r) => r.data),

  updateStatus: (id, status) =>
    api.patch(`/projects/${id}/status`, { status }).then((r) => r.data),

  assignManager: (projectId, managerId) =>
    api.patch(`/projects/${projectId}/assign-manager`, { managerId }).then((r) => r.data),

  delete: (id) =>
    api.delete(`/projects/${id}`).then((r) => r.data),

  getManagers: () =>
    api.get('/projects/managers').then((r) => r.data.data),

  getTeam: (id) =>
    api.get(`/projects/${id}/team`).then((r) => r.data.data),
};