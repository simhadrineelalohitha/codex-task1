# ⚡ Sphere - Mini Social Media Web Application

A full-stack, responsive, zero-external-database social networking platform built with **Express.js (Node.js)**, **SQLite (via `sqlite3`)**, and **modern Vanilla HTML5/CSS3/JavaScript (ES6+)**.

---

## 🌟 Key Features

1. **Authentication & User Management**:
   - Secure registration, login, and logout.
   - JWT tokens stored in cookies and localStorage with bcrypt password hashing.
   - User profile pages with bio, display name, follower count, and following count.
   - Self-profile bio and display name editing via a clean modal interface.

2. **Posts & Feed**:
   - Global chronological feed for discovering posts across the platform.
   - "Following" tab filter to view only posts from creators you follow.
   - Rich media post creation: text with optional image URL preview.
   - Live relative timestamps (e.g. *15m ago*, *2h ago*).
   - Post authors can delete their own posts.

3. **Comments System**:
   - Dynamic slide-out comments drawer under each post.
   - Real-time comment submission and immediate author rendering.
   - Authors can delete their own comments with dynamic counter adjustment.

4. **Interactions & Follow Network**:
   - Live Like / Unlike toggle on every post with reactive counter updates.
   - Follow / Unfollow system with dynamic follower count synchronization.

5. **Design & UI**:
   - Modern dark mode aesthetic inspired by clean SaaS and social products.
   - Responsive flexbox/grid layout optimized for both desktop and mobile viewports.
   - Initial avatar placeholders with fallback initial generation.

---

## 📁 Project Architecture

```
├── server/
│   ├── config/
│   │   └── db.js                 # SQLite database setup, table schemas & auto-seed
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, logout, me
│   │   ├── commentController.js  # Add, list, delete comments
│   │   ├── postController.js     # Post CRUD, global/following feeds, like toggle
│   │   └── userController.js     # User profiles, bio update, follow toggle
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification & optional session decoding
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── postRoutes.js
│   │   └── userRoutes.js
│   └── server.js                 # Express app bootstrap & route registration
├── public/
│   ├── index.html                # Main feed view (Global & Following)
│   ├── login.html                # Authentication sign-in
│   ├── register.html             # User registration
│   ├── profile.html              # User profile & posts view
│   ├── css/
│   │   └── style.css             # Unified dark modern card UI stylesheet
│   └── js/
│       ├── api.js                # Centralized fetch API wrapper & utilities
│       ├── auth.js               # Dynamic navbar & authentication logic
│       ├── feed.js               # Feed rendering, post creation & comments
│       └── profile.js            # Profile page handling, edit modal & follow button
├── package.json
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
Run the following command in the project root:
```bash
npm install
```

### 2. Start the Application
Run the start command:
```bash
npm start
```
The application will automatically:
- Connect to SQLite and create `database.sqlite` (if not already existing).
- Run migrations for tables: `users`, `posts`, `comments`, `likes`, `follows`.
- Seed initial demo users, posts, and comments for instant testing.
- Launch the server at **`http://localhost:3000`**.

---

## 🧪 Demo Credentials

The database automatically seeds with three demo accounts (all using password `password123`):

| Username | Email | Password | Role / Bio |
| :--- | :--- | :--- | :--- |
| **`alice`** | `alice@example.com` | `password123` | Full-Stack Developer & Tech Explorer |
| **`bob_codes`** | `bob@example.com` | `password123` | Coffee enthusiast & open-source contributor |
| **`carol_ux`** | `carol@example.com` | `password123` | UI/UX Designer & typography fan |

You can also click **Sign Up** on the navbar to create a new custom account anytime!
