import { useQuery, useMutation } from '@tanstack/react-query';
import { tasksService } from '../api/tasks.service';
import { queryClient } from '../utils/queryClient';
import { QUERY_KEYS } from '../utils/queryKeys';

// ─── Queries ───────────────────────────────────────────────────────────────

export const useProjectTasks = (projectId) =>
  useQuery({
    queryKey: QUERY_KEYS.tasks.byProject(projectId),
    queryFn: () => tasksService.getByProject(projectId),
    enabled: !!projectId,
  });

export const useTask = (id) =>
  useQuery({
    queryKey: QUERY_KEYS.tasks.detail(id),
    queryFn: () => tasksService.getById(id),
    enabled: !!id,
  });

// Worker: fetch only tasks assigned to the logged-in user
export const useMyTasks = () =>
  useQuery({
    queryKey: QUERY_KEYS.tasks.mine,
    queryFn: tasksService.getMyTasks,
  });

// ─── Mutations ─────────────────────────────────────────────────────────────

export const useCreateTask = (projectId) =>
  useMutation({
    mutationFn: (data) => tasksService.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.byProject(projectId) });
    },
  });

export const useUpdateTask = (id, projectId) =>
  useMutation({
    mutationFn: (data) => tasksService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.detail(id) });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.byProject(projectId) });
      }
    },
  });

export const useUpdateTaskStatus = (id, projectId) =>
  useMutation({
    mutationFn: (status) => tasksService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.mine });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.byProject(projectId) });
      }
    },
  });

export const useDeleteTask = (projectId) =>
  useMutation({
    mutationFn: (id) => tasksService.delete(id),
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.byProject(projectId) });
      }
    },
  });