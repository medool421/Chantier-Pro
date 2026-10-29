const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

router.delete('/me', auth, userController.deleteMe);

module.exports = router;
