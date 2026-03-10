import { useQuery } from '@tanstack/react-query';
import { managerService } from '../api/manager.service';
import { QUERY_KEYS } from '../utils/queryKeys';

export const useMyProjects = () =>
  useQuery({
    queryKey: QUERY_KEYS.manager.myProjects,
    queryFn: managerService.getMyProjects,
  });