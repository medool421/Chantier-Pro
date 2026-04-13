import api from './axios';

export const tasksService = {
  // GET /api/projects/:projectId/tasks
  getByProject: (projectId) =>
    api.get(`/projects/${projectId}/tasks`).then((r) => r.data.data),

  // GET /api/tasks/:id
  getById: (id) =>
    api.get(`/tasks/${id}`).then((r) => r.data.data),

  // GET /api/tasks/my
  getMyTasks: () =>
    api.get('/tasks/my').then((r) => r.data.data || []),

  // POST /api/projects/:projectId/tasks
  create: (projectId, data) =>
    api.post(`/projects/${projectId}/tasks`, data).then((r) => r.data.data),

  // PUT /api/tasks/:id
  update: (id, data) =>
    api.put(`/tasks/${id}`, data).then((r) => r.data.data),

  // PATCH /api/tasks/:id/status
  updateStatus: (id, status) =>
    api.patch(`/tasks/${id}/status`, { status }).then((r) => r.data.data),

  // DELETE /api/tasks/:id
  delete: (id) =>
    api.delete(`/tasks/${id}`).then((r) => r.data),
};