const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'pushvex.db'));

db.run('PRAGMA foreign_keys = ON');

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => error ? reject(error) : resolve(row));
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
  });
}

async function initializeDatabase() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT 'https://api.dicebear.com/8.x/initials/svg?seed=User',
    bio TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS likes (
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS followers (
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  const count = await get('SELECT COUNT(*) AS count FROM users');
  if (count.count === 0) {
    const demoPassword = await bcrypt.hash('pushvex123', 10);
    const users = [
      ['pushvex_user', 'hello@pushvex.dev', demoPassword, 'https://api.dicebear.com/8.x/initials/svg?seed=PushVex', 'Building ideas in public. Welcome to PushVex.'],
      ['developer01', 'developer@pushvex.dev', demoPassword, 'https://api.dicebear.com/8.x/initials/svg?seed=Developer', 'Full stack learner and coffee-powered coder.'],
      ['coderhub', 'coder@pushvex.dev', demoPassword, 'https://api.dicebear.com/8.x/initials/svg?seed=Coder', 'Sharing small wins, clean code, and big curiosity.']
    ];
    for (const user of users) await run('INSERT INTO users (username, email, password, avatar, bio) VALUES (?, ?, ?, ?, ?)', user);
    const pushvex = await get('SELECT id FROM users WHERE username = ?', ['pushvex_user']);
    const developer = await get('SELECT id FROM users WHERE username = ?', ['developer01']);
    const coder = await get('SELECT id FROM users WHERE username = ?', ['coderhub']);
    await run('INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)', [pushvex.id, 'Welcome to PushVex. A fresh space for ideas, progress, and the people building what comes next.', 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80']);
    await run('INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)', [developer.id, 'Today I finally understood how sessions connect the browser to a protected API. Small milestone, big energy.', null]);
    const post = await run('INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)', [coder.id, 'A good interface gets out of your way. A great one makes you want to keep exploring.', null]);
    await run('INSERT INTO followers (follower_id, following_id) VALUES (?, ?)', [pushvex.id, developer.id]);
    await run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post.id, pushvex.id]);
    await run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [post.id, pushvex.id, 'This is a great perspective.']);
  }
}

module.exports = { run, get, all, initializeDatabase };
