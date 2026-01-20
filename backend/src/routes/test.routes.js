const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

router.get(
  '/boss',
  auth,
  role(['BOSS']),
  (req, res) => {
    res.json({ message: 'Welcome Boss 👑' });
  }
);

router.get(
  '/manager',
  auth,
  role(['MANAGER']),
  (req, res) => {
    res.json({ message: 'Welcome Manager 🧑‍💼' });
  }
);

router.get(
  '/worker',
  auth,
  role(['WORKER']),
  (req, res) => {
    res.json({ message: 'Welcome Worker 👷' });
  }
);

router.get(
  '/boss-or-manager',
  auth,
  role(['BOSS', 'MANAGER']),
  (req, res) => {
    res.json({ message: 'Welcome Boss or Manager' });
  }
);

module.exports = router;
