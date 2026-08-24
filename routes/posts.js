const express = require('express');
const { all, get, run } = require('../database/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const postQuery = `SELECT p.id, p.content, p.image_url AS imageUrl, p.created_at AS createdAt,
  u.id AS userId, u.username, u.avatar,
  (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes,
  EXISTS (SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS liked
  FROM posts p JOIN users u ON u.id = p.user_id`;

router.get('/', requireAuth, async (req, res) => {
  const posts = await all(`${postQuery} ORDER BY p.created_at DESC`, [req.session.userId]);
  for (const post of posts) post.comments = await all(`SELECT c.id, c.content, c.created_at AS createdAt, c.user_id AS userId, u.username, u.avatar FROM comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at ASC`, [post.id]);
  res.json({ posts });
});
router.post('/', requireAuth, async (req, res) => {
  const content = String(req.body.content || '').trim();
  const imageUrl = String(req.body.imageUrl || '').trim() || null;
  if (!content) return res.status(400).json({ error: 'A post needs some text.' });
  if (content.length > 500) return res.status(400).json({ error: 'Posts must be 500 characters or less.' });
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) return res.status(400).json({ error: 'Image URL must start with http:// or https://.' });
  await run('INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)', [req.session.userId, content, imageUrl]);
  res.status(201).json({ message: 'Post published.' });
});
router.delete('/:id', requireAuth, async (req, res) => {
  const post = await get('SELECT user_id FROM posts WHERE id = ?', [req.params.id]);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  if (post.user_id !== req.session.userId) return res.status(403).json({ error: 'You can only delete your own posts.' });
  await run('DELETE FROM posts WHERE id = ?', [req.params.id]);
  res.json({ message: 'Post deleted.' });
});
router.post('/:id/like', requireAuth, async (req, res) => {
  await run('INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)', [req.params.id, req.session.userId]);
  const result = await get('SELECT COUNT(*) AS count FROM likes WHERE post_id = ?', [req.params.id]);
  res.json({ liked: true, likes: result.count });
});
router.delete('/:id/like', requireAuth, async (req, res) => {
  await run('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [req.params.id, req.session.userId]);
  const result = await get('SELECT COUNT(*) AS count FROM likes WHERE post_id = ?', [req.params.id]);
  res.json({ liked: false, likes: result.count });
});
module.exports = router;
