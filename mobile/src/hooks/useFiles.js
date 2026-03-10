import { useQuery, useMutation } from '@tanstack/react-query';
import { filesService } from '../api/files.service';
import { queryClient } from '../utils/queryClient';
import { QUERY_KEYS } from '../utils/queryKeys';

export const useProjectFiles = (projectId) =>
  useQuery({
    queryKey: QUERY_KEYS.files.byProject(projectId),
    queryFn: () => filesService.getByProject(projectId),
    enabled: !!projectId,
  });

export const useUploadFile = (projectId) =>
  useMutation({
    mutationFn: filesService.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files.byProject(projectId) });
    },
  });