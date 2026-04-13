const { Expo } = require('expo-server-sdk');
const { Notification, User } = require('../models');

const expo = new Expo();

const NOTIFICATION_TYPES = {
  TASK_ASSIGNED:          'TASK_ASSIGNED',
  TASK_STATUS_CHANGED:    'TASK_STATUS_CHANGED',
  PROJECT_STATUS_CHANGED: 'PROJECT_STATUS_CHANGED',
  MANAGER_ASSIGNED:       'MANAGER_ASSIGNED',
};

// ─── Core: save to DB + send push ─────────────────────────────────────────
async function sendNotification({ userId, title, body, type, data = {} }) {
  try {
    const notification = await Notification.create({ userId, title, body, type, data });

    const user = await User.findByPk(userId, {
      attributes: ['expoPushToken'],
    });

    if (user?.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
      const chunks = expo.chunkPushNotifications([{
        to: user.expoPushToken,
        sound: 'default',
        title,
        body,
        data,
      }]);

      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (pushErr) {
          console.error('[Push] Chunk send failed:', pushErr.message);
        }
      }
    }

    return notification;
  } catch (error) {
    console.error('[Notification] Error:', error.message);
  }
}

// ─── Trigger Helpers ──────────────────────────────────────────────────────

function notifyTaskAssigned({ assigneeId, taskTitle, projectName, taskId, projectId }) {
  return sendNotification({
    userId: assigneeId,
    title: '📋 Nouvelle tâche assignée',
    body: `"${taskTitle}" sur le projet ${projectName}`,
    type: NOTIFICATION_TYPES.TASK_ASSIGNED,
    data: { taskId, projectId },
  });
}

function notifyTaskStatusChanged({ managerId, taskTitle, newStatus, taskId, projectId }) {
  return sendNotification({
    userId: managerId,
    title: '🔄 Statut de tâche mis à jour',
    body: `"${taskTitle}" est maintenant: ${newStatus}`,
    type: NOTIFICATION_TYPES.TASK_STATUS_CHANGED,
    data: { taskId, projectId },
  });
}

function notifyProjectStatusChanged({ managerId, projectName, newStatus, projectId }) {
  return sendNotification({
    userId: managerId,
    title: '🏗️ Statut du projet mis à jour',
    body: `"${projectName}" est maintenant: ${newStatus}`,
    type: NOTIFICATION_TYPES.PROJECT_STATUS_CHANGED,
    data: { projectId },
  });
}

function notifyManagerAssigned({ managerId, projectName, projectId }) {
  return sendNotification({
    userId: managerId,
    title: '🎯 Nouveau chantier assigné',
    body: `Vous êtes maintenant chef de chantier sur "${projectName}"`,
    type: NOTIFICATION_TYPES.MANAGER_ASSIGNED,
    data: { projectId },
  });
}

module.exports = {
  sendNotification,
  notifyTaskAssigned,
  notifyTaskStatusChanged,
  notifyProjectStatusChanged,
  notifyManagerAssigned,
  NOTIFICATION_TYPES,
};