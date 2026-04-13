import api from './axios';

export const notificationsService = {
  // Fetch my notifications + unread count
  getMyNotifications: () =>
    api.get('/notifications/my').then((r) => r.data.data),

  // Mark a single notification as read
  markAsRead: (id) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),

  // Mark all notifications as read
  markAllAsRead: () =>
    api.patch('/notifications/read-all').then((r) => r.data),

  // Register or update device push token
  savePushToken: (token) =>
    api.post('/notifications/push-token', { token }).then((r) => r.data),
};