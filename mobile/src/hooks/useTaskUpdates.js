import { useMutation, useQuery } from '@tanstack/react-query';
import { taskUpdatesService } from '../api/taskUpdates.service';
import { queryClient } from '../utils/queryClient';
import { QUERY_KEYS } from '../utils/queryKeys';

export const useTaskUpdates = (taskId) =>
  useQuery({
    queryKey: QUERY_KEYS.taskUpdates.byTask(taskId),
    queryFn: () => taskUpdatesService.getTaskUpdates(taskId),
    enabled: !!taskId,
  });

export const useCreateTaskUpdate = () =>
  useMutation({
    mutationFn: (data) => taskUpdatesService.createTaskUpdate(data),
    onSuccess: (_, variables) => {
      if (variables?.taskId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.taskUpdates.byTask(variables.taskId),
        });
      }
      if (variables?.taskId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.tasks.detail(variables.taskId),
        });
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.mine });
    },
  });
