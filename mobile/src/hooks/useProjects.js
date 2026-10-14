import { useQuery, useMutation } from '@tanstack/react-query';
import { projectsService } from '../api/projects.service';
import { queryClient } from '../utils/queryClient';
import { QUERY_KEYS } from '../utils/queryKeys';

// ─── Queries ───────────────────────────────────────────────────────────────

// BOSS: all projects
export const useProjects = () =>
  useQuery({
    queryKey: QUERY_KEYS.projects.all,
    queryFn: projectsService.getAll,
  });

// MANAGER: only projects assigned to this manager
export const useManagerProjects = () =>
  useQuery({
    queryKey: QUERY_KEYS.manager.myProjects,
    queryFn: projectsService.getMyProjects,
  });

export const useProject = (id) =>
  useQuery({
    queryKey: QUERY_KEYS.projects.detail(id),
    queryFn: () => projectsService.getById(id),
    enabled: !!id,
  });

export const useProjectManagers = () =>
  useQuery({
    queryKey: QUERY_KEYS.projects.managers,
    queryFn: projectsService.getManagers,
  });

export const useCompanyWorkers = () =>
  useQuery({
    queryKey: QUERY_KEYS.projects.workers,
    queryFn: projectsService.getWorkers,
  });

export const useProjectTeam = (id) =>
  useQuery({
    queryKey: QUERY_KEYS.projects.team(id),
    queryFn: () => projectsService.getTeam(id),
    enabled: !!id,
  });

// ─── Mutations ─────────────────────────────────────────────────────────────

export const useCreateProject = () =>
  useMutation({
    mutationFn: projectsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all });
    },
  });

export const useUpdateProject = (id) =>
  useMutation({
    mutationFn: (data) => projectsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all });
    },
  });

export const useUpdateProjectStatus = (id) =>
  useMutation({
    mutationFn: (status) => projectsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.manager.myProjects });
    },
  });

export const useAssignManager = (projectId) =>
  useMutation({
    mutationFn: (managerId) => projectsService.assignManager(projectId, managerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all });
    },
  });

export const useDeleteProject = () =>
  useMutation({
    mutationFn: projectsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all });
    },
  });

export const useAddTeamMember = (projectId) =>
  useMutation({
    mutationFn: ({ teamId, userId, roleInTeam = 'WORKER' }) =>
      projectsService.addTeamMember(teamId, { userId, roleInTeam }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.team(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.workers });
    },
  });

export const useRemoveTeamMember = (projectId) =>
  useMutation({
    mutationFn: ({ teamId, userId }) => projectsService.removeTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.team(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.workers });
    },
  });

export const useCreateProjectTeam = (projectId) =>
  useMutation({
    mutationFn: (payload) => projectsService.createTeam(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.team(projectId) });
    },
  });