const express = require('express');
const router = express.Router();

const { getMyNotifications, markAsRead, markAllAsRead, savePushToken } = require('../controllers/notification.controller');
const  auth = require('../middlewares/auth.middleware');


router.use(auth);

router.get('/my',          getMyNotifications);
router.patch('/read-all',  markAllAsRead);
router.patch('/:id/read',  markAsRead);
router.post('/push-token', savePushToken);

module.exports = router;
