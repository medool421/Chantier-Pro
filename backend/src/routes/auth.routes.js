const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// TEST AUTH
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
