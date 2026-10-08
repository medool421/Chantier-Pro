import api from './axios';

export const taskUpdatesService = {
  createTaskUpdate: ({ formData }) =>
    api.post('/task-updates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data),

  getTaskUpdates: (taskId) =>
    api.get(`/tasks/${taskId}/updates`).then((r) => r.data.data || []),
};
