import api from './axios';

// Manager sees only their assigned project(s)
export const managerService = {
  getMyProjects: () =>
    api.get('/projects/my-project').then((r) => r.data.data || []),
};