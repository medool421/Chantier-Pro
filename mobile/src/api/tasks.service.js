import api from './axios';

export const tasksService = {
  getByProject: (projectId) =>
    api.get(`tasks/projects/${projectId}/tasks`).then((r) => r.data.data),

  getById: (id) =>
    api.get(`tasks/tasks/${id}`).then((r) => r.data.data),

  getMyTasks: () =>
    api.get('/tasks/tasks/my').then((r) => r.data.data || []),

  create: (projectId, data) =>
    api.post(`tasks/projects/${projectId}/tasks`, data).then((r) => r.data),

  update: (id, data) =>
    api.put(`tasks/tasks/${id}`, data).then((r) => r.data),

  updateStatus: (id, status) =>
    api.patch(`tasks/tasks/${id}/status`, { status }).then((r) => r.data),

  delete: (id) =>
    api.delete(`/tasks/${id}`).then((r) => r.data),
};