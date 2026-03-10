import { useQuery, useMutation } from '@tanstack/react-query';
import { reportsService } from '../api/reports.service';
import { queryClient } from '../utils/queryClient';
import { QUERY_KEYS } from '../utils/queryKeys';

export const useProjectReports = (projectId) =>
  useQuery({
    queryKey: QUERY_KEYS.reports.byProject(projectId),
    queryFn: () => reportsService.getByProject(projectId),
    enabled: !!projectId,
  });

export const useCreateReport = (projectId) =>
  useMutation({
    mutationFn: (data) => reportsService.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.byProject(projectId) });
    },
  });