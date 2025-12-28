const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/me', auth, (req, res) => {
  return res.json({ user: { id: req.user.sub, role: req.user.role || 'user' } });
});

router.patch('/me', auth, (req, res) => {
  // placeholder update
  return res.json({ ok: true, updates: req.body });
});

module.exports = router;
