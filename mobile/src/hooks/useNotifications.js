import { useQuery, useMutation } from '@tanstack/react-query';
import { notificationsService } from '../api/notifications.service';
import { queryClient } from '../utils/queryClient';
import { QUERY_KEYS } from '../utils/queryKeys';

// ─── Query: fetch notifications, poll every 30s ───────────────────────────
export const useMyNotifications = () =>
  useQuery({
    queryKey: QUERY_KEYS.notifications.mine,
    queryFn: notificationsService.getMyNotifications,
    refetchInterval: 30_000,
    select: (data) => ({
      // Backend returns { success, data: { notifications, unreadCount } }
      notifications: data?.data?.notifications ?? data?.notifications ?? [],
      unreadCount: data?.data?.unreadCount ?? data?.unreadCount ?? 0,
    }),
  });

// ─── Mutations ────────────────────────────────────────────────────────────
export const useMarkAsRead = () =>
  useMutation({
    mutationFn: (id) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.mine });
    },
  });

export const useMarkAllAsRead = () =>
  useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.mine });
    },
  });