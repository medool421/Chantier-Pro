import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 2,   // 2 minutes - data stays fresh
      gcTime: 1000 * 60 * 10,     // 10 minutes - cache kept in memory
      refetchOnWindowFocus: false, // mobile doesn't need this
    },
    mutations: {
      retry: 0,
    },
  },
});