const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const { initializeDatabase } = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'database') }),
  secret: process.env.SESSION_SECRET || 'pushvex-development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7, httpOnly: true, sameSite: 'lax' }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/follows', require('./routes/follows'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'PushVex' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

initializeDatabase()
  .then(() => app.listen(PORT, () => console.log(`PushVex is running at http://localhost:${PORT}`)))
  .catch((error) => { console.error('Database startup failed:', error); process.exit(1); });
