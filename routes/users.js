const express = require('express');
const { all, get, run } = require('../database/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const profileQuery = `SELECT u.id, u.username, u.email, u.avatar, u.bio, u.created_at,
  (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS posts,
  (SELECT COUNT(*) FROM followers WHERE following_id = u.id) AS followers,
  (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) AS following
  FROM users u`;

router.get('/search', requireAuth, async (req, res) => {
  const term = `%${(req.query.q || '').trim()}%`;
  res.json({ users: await all(`${profileQuery} WHERE username LIKE ? ORDER BY username LIMIT 20`, [term]) });
});
router.get('/', requireAuth, async (req, res) => res.json({ users: await all(`${profileQuery} WHERE u.id != ? ORDER BY followers DESC, username LIMIT 12`, [req.session.userId]) }));
router.get('/:id', requireAuth, async (req, res) => {
  const user = await get(`${profileQuery} WHERE u.id = ?`, [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const relationship = await get('SELECT 1 AS following FROM followers WHERE follower_id = ? AND following_id = ?', [req.session.userId, req.params.id]);
  res.json({ user, isFollowing: Boolean(relationship), isSelf: Number(req.params.id) === req.session.userId });
});
router.put('/me', requireAuth, async (req, res) => {
  const { bio, avatar } = req.body;
  if (bio !== undefined && String(bio).length > 160) return res.status(400).json({ error: 'Bio must be 160 characters or less.' });
  const user = await get('SELECT * FROM users WHERE id = ?', [req.session.userId]);
  await run('UPDATE users SET bio = ?, avatar = ? WHERE id = ?', [bio === undefined ? user.bio : String(bio).trim(), avatar === undefined ? user.avatar : String(avatar).trim(), req.session.userId]);
  res.json({ message: 'Profile updated.' });
});
router.get('/:id/followers', requireAuth, async (req, res) => res.json({ users: await all(`${profileQuery} JOIN followers f ON f.follower_id = u.id WHERE f.following_id = ?`, [req.params.id]) }));
router.get('/:id/following', requireAuth, async (req, res) => res.json({ users: await all(`${profileQuery} JOIN followers f ON f.following_id = u.id WHERE f.follower_id = ?`, [req.params.id]) }));
module.exports = router;
