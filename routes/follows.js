const express = require('express');
const { get, run } = require('../database/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.post('/:id', requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.session.userId) return res.status(400).json({ error: 'You cannot follow yourself.' });
  if (!await get('SELECT id FROM users WHERE id = ?', [targetId])) return res.status(404).json({ error: 'User not found.' });
  await run('INSERT OR IGNORE INTO followers (follower_id, following_id) VALUES (?, ?)', [req.session.userId, targetId]);
  res.json({ following: true });
});
router.delete('/:id', requireAuth, async (req, res) => {
  await run('DELETE FROM followers WHERE follower_id = ? AND following_id = ?', [req.session.userId, req.params.id]);
  res.json({ following: false });
});
module.exports = router;
