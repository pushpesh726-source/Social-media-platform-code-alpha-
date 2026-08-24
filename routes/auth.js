const express = require('express');
const bcrypt = require('bcryptjs');
const { run, get } = require('../database/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

const publicUser = (user) => ({ id: user.id, username: user.username, email: user.email, avatar: user.avatar, bio: user.bio });

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    if (!username || !email || !password || !confirmPassword) return res.status(400).json({ error: 'Please complete every field.' });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: 'Username must be 3-20 characters using letters, numbers, or underscores.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match.' });
    const duplicate = await get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (duplicate) return res.status(409).json({ error: 'That username or email is already registered.' });
    const avatar = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(username)}`;
    const result = await run('INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)', [username, email.toLowerCase(), await bcrypt.hash(password, 10), avatar]);
    req.session.userId = result.id;
    res.status(201).json({ user: { id: result.id, username, email: email.toLowerCase(), avatar, bio: '' } });
  } catch (error) { res.status(500).json({ error: 'Could not create account right now.' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await get('SELECT * FROM users WHERE email = ?', [(email || '').toLowerCase().trim()]);
    if (!user || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ error: 'Invalid email or password.' });
    req.session.userId = user.id;
    res.json({ user: publicUser(user) });
  } catch (error) { res.status(500).json({ error: 'Could not log in right now.' }); }
});

router.post('/logout', requireAuth, (req, res) => req.session.destroy(() => res.json({ message: 'Logged out successfully.' })));
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = await get('SELECT id, username, email, avatar, bio FROM users WHERE id = ?', [req.session.userId]);
  res.json({ user: user || null });
});

module.exports = router;
