/**
 * Centralized query keys for React Query cache management.
 * Using factory pattern so keys are consistent across hooks.
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all })
 *   queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.detail(id) })
 */
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
};