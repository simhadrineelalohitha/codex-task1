const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

// Helper promise wrappers for sqlite3
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize tables and seed demo data
async function initDatabase() {
  // Foreign keys support
  await dbRun('PRAGMA foreign_keys = ON;');

  // Users table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      displayName TEXT NOT NULL,
      bio TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Posts table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      content TEXT NOT NULL,
      imageUrl TEXT DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Comments table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (postId) REFERENCES posts (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Likes table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(postId, userId),
      FOREIGN KEY (postId) REFERENCES posts (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Follows table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      followerId INTEGER NOT NULL,
      followingId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(followerId, followingId),
      FOREIGN KEY (followerId) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (followingId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Seed demo data if users table is empty
  const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count === 0) {
    console.log('Seeding initial demo data...');
    const hashedPw = await bcrypt.hash('password123', 10);

    // Create demo users
    const u1 = await dbRun(
      'INSERT INTO users (username, email, password, displayName, bio, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [
        'alice',
        'alice@example.com',
        hashedPw,
        'Alice Johnson',
        'Full-Stack Developer & Tech Explorer. Building clean, fast web experiences.',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
      ]
    );

    const u2 = await dbRun(
      'INSERT INTO users (username, email, password, displayName, bio, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [
        'bob_codes',
        'bob@example.com',
        hashedPw,
        'Bob Smith',
        'Coffee enthusiast, open source contributor, and distributed systems nerd.',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      ]
    );

    const u3 = await dbRun(
      'INSERT INTO users (username, email, password, displayName, bio, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [
        'carol_ux',
        'carol@example.com',
        hashedPw,
        'Carol Williams',
        'UI/UX Designer who loves typography, minimalism, and micro-interactions.',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80'
      ]
    );

    const aliceId = u1.lastID;
    const bobId = u2.lastID;
    const carolId = u3.lastID;

    // Follows: Bob and Carol follow Alice; Alice follows Bob
    await dbRun('INSERT INTO follows (followerId, followingId) VALUES (?, ?)', [bobId, aliceId]);
    await dbRun('INSERT INTO follows (followerId, followingId) VALUES (?, ?)', [carolId, aliceId]);
    await dbRun('INSERT INTO follows (followerId, followingId) VALUES (?, ?)', [aliceId, bobId]);

    // Create demo posts
    const p1 = await dbRun(
      'INSERT INTO posts (userId, content, imageUrl, createdAt) VALUES (?, ?, ?, datetime("now", "-3 hours"))',
      [
        aliceId,
        'Welcome to the new mini social network! Built with standard Vanilla JS, Express, and SQLite. Super lightweight and snappy! 🚀✨',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'
      ]
    );

    const p2 = await dbRun(
      'INSERT INTO posts (userId, content, imageUrl, createdAt) VALUES (?, ?, ?, datetime("now", "-1 hours"))',
      [
        bobId,
        'Nothing beats a fresh cup of specialty pour-over coffee while reading through clean codebases in the morning. What is your favorite setup? ☕💻',
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80'
      ]
    );

    const p3 = await dbRun(
      'INSERT INTO posts (userId, content, imageUrl, createdAt) VALUES (?, ?, ?, datetime("now", "-25 minutes"))',
      [
        carolId,
        'Crafting modern design systems: keep your spacing modular, typography intentional, and colors accessible! 🎨',
        ''
      ]
    );

    // Likes
    await dbRun('INSERT INTO likes (postId, userId) VALUES (?, ?)', [p1.lastID, bobId]);
    await dbRun('INSERT INTO likes (postId, userId) VALUES (?, ?)', [p1.lastID, carolId]);
    await dbRun('INSERT INTO likes (postId, userId) VALUES (?, ?)', [p2.lastID, aliceId]);
    await dbRun('INSERT INTO likes (postId, userId) VALUES (?, ?)', [p3.lastID, aliceId]);

    // Comments
    await dbRun('INSERT INTO comments (postId, userId, content, createdAt) VALUES (?, ?, ?, datetime("now", "-2 hours"))', [
      p1.lastID,
      bobId,
      'Looks super sleek! Excited to build on this.'
    ]);
    await dbRun('INSERT INTO comments (postId, userId, content, createdAt) VALUES (?, ?, ?, datetime("now", "-1 hours"))', [
      p1.lastID,
      carolId,
      'The UI layout is super clean. Love the responsive feed!'
    ]);
    await dbRun('INSERT INTO comments (postId, userId, content, createdAt) VALUES (?, ?, ?, datetime("now", "-10 minutes"))', [
      p2.lastID,
      aliceId,
      'V60 Ethiopian light roast is my daily go-to!'
    ]);

    console.log('Seed demo data created successfully.');
  }
}

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
  initDatabase
};
