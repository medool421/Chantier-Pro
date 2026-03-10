import { useQuery, useMutation } from '@tanstack/react-query';
import { projectsService } from '../api/projects.service';
import { queryClient } from '../utils/queryClient';
import { QUERY_KEYS } from '../utils/queryKeys';

// ─── Queries ───────────────────────────────────────────────────────────────

export const useProjects = () =>
  useQuery({
    queryKey: QUERY_KEYS.projects.all,
    queryFn: projectsService.getAll,
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