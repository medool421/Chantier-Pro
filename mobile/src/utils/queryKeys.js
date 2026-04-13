export const QUERY_KEYS = {
  auth: {
    me: ['auth', 'me'],
  },

  projects: {
    all: ['projects'],
    detail: (id) => ['projects', id],
    managers: ['projects', 'managers'],
    team: (id) => ['projects', id, 'team'],
  },

  tasks: {
    byProject: (projectId) => ['tasks', 'project', projectId],
    detail: (id) => ['tasks', id],
    mine: ['tasks', 'mine'], // Worker: tasks assigned to current user
  },

  manager: {
    myProjects: ['manager', 'my-projects'],
  },

  files: {
    byProject: (projectId) => ['files', 'project', projectId],
  },

  reports: {
    byProject: (projectId) => ['reports', 'project', projectId],
  },

  notifications: {
    mine: ['notifications', 'mine'],
  },

  invitations: {
    all: ['invitations'],
  },
};