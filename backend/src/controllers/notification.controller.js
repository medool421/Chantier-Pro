const { Notification } = require('../models');
const catchAsync = require('../utils/catchAsync');

// GET /notifications/my
exports.getMyNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });

  const unreadCount = await Notification.count({
    where: { userId: req.user.id, isRead: false },
  });

  res.json({
    success: true,
    data: { notifications, unreadCount },
  });
});

// PATCH /notifications/:id/read
exports.markAsRead = catchAsync(async (req, res) => {
  const notification = await Notification.findOne({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification non trouvée' });
  }

  await notification.update({ isRead: true });

  res.json({ success: true, data: notification });
});

// PATCH /notifications/read-all
exports.markAllAsRead = catchAsync(async (req, res) => {
  await Notification.update(
    { isRead: true },
    { where: { userId: req.user.id, isRead: false } }
  );

  res.json({ success: true, message: 'Toutes les notifications marquées comme lues' });
});

// POST /notifications/push-token
exports.savePushToken = catchAsync(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token requis' });
  }

  const { User } = require('../models');
  await User.update(
    { expoPushToken: token },
    { where: { id: req.user.id } }
  );

  res.json({ success: true, message: 'Token enregistré' });
});