const express = require('express');
const { get, run } = require('../database/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.post('/', requireAuth, async (req, res) => {
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: 'Comment cannot be empty.' });
  if (content.length > 240) return res.status(400).json({ error: 'Comments must be 240 characters or less.' });
  if (!await get('SELECT id FROM posts WHERE id = ?', [req.body.postId])) return res.status(404).json({ error: 'Post not found.' });
  await run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [req.body.postId, req.session.userId, content]);
  res.status(201).json({ message: 'Comment added.' });
});
router.delete('/:id', requireAuth, async (req, res) => {
  const comment = await get('SELECT user_id FROM comments WHERE id = ?', [req.params.id]);
  if (!comment) return res.status(404).json({ error: 'Comment not found.' });
  if (comment.user_id !== req.session.userId) return res.status(403).json({ error: 'You can only delete your own comments.' });
  await run('DELETE FROM comments WHERE id = ?', [req.params.id]);
  res.json({ message: 'Comment deleted.' });
});
module.exports = router;
