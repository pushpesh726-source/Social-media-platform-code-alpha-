# PushVex

PushVex is a full-stack social media platform built for Full Stack Development Task 2. It uses a beginner-friendly vanilla HTML/CSS/JavaScript frontend, an Express REST API, and a local SQLite database.

## Setup

1. Open project in VS Code
2. Open terminal
3. Run:

```bash
npm install
```

4. Run:

```bash
npm start
```

5. Open the local URL shown by the server.

The default URL is `http://localhost:3000`.

## Demo login

- Email: `hello@pushvex.dev`
- Password: `pushvex123`

Other seeded users use the same password:
- `developer@pushvex.dev`
- `coder@pushvex.dev`

## Features

- Registration with validation, duplicate checks, and bcrypt password hashing
- Session-based login, logout, and protected API routes
- Profiles with avatars, bios, post counts, follower counts, and following counts
- Create, view, and delete text/image posts
- Live like/unlike actions
- Add and delete comments
- Follow and unfollow users
- Username search and discoverable member list
- Automatic SQLite tables and sample data on first startup
- Responsive dark premium interface for desktop and mobile

## Project structure

- `server.js`: Express server, sessions, static files, and route registration
- `database/database.js`: SQLite connection, schema, and demo seed data
- `routes/`: REST endpoints for authentication, users, posts, comments, and follows
- `middleware/auth.js`: protected-route authentication middleware
- `public/`: HTML pages, shared CSS, and browser JavaScript
- `database/pushvex.db`: generated local database file (ignored by Git)

No MongoDB, MySQL, or external database server is required.
