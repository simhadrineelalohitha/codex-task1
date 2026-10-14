const { dbRun, dbGet, dbAll } = require('../config/db');

// Get all posts or feed posts (with like count, comments count, and hasLiked)
const getFeed = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const filter = req.query.filter; // 'all' or 'following'

    let query = `
      SELECT 
        p.id,
        p.userId,
        p.content,
        p.imageUrl,
        p.createdAt,
        u.username,
        u.displayName,
        u.avatar,
        (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likesCount,
        (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentsCount,
        ${currentUserId ? `(SELECT COUNT(*) FROM likes WHERE postId = p.id AND userId = ${currentUserId})` : '0'} as hasLiked
      FROM posts p
      JOIN users u ON p.userId = u.id
    `;

    const params = [];

    if (filter === 'following' && currentUserId) {
      query += ` WHERE p.userId IN (SELECT followingId FROM follows WHERE followerId = ?) OR p.userId = ? `;
      params.push(currentUserId, currentUserId);
    }

    query += ` ORDER BY p.createdAt DESC`;

    const posts = await dbAll(query, params);

    // Format hasLiked boolean
    const formatted = posts.map(post => ({
      ...post,
      hasLiked: Boolean(post.hasLiked)
    }));

    return res.json({ success: true, posts: formatted });
  } catch (error) {
    console.error('getFeed error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Create a new post
const createPost = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Post content cannot be empty.' });
    }

    const result = await dbRun(
      'INSERT INTO posts (userId, content, imageUrl) VALUES (?, ?, ?)',
      [userId, content.trim(), imageUrl ? imageUrl.trim() : '']
    );

    const newPost = await dbGet(`
      SELECT 
        p.id,
        p.userId,
        p.content,
        p.imageUrl,
        p.createdAt,
        u.username,
        u.displayName,
        u.avatar,
        0 as likesCount,
        0 as commentsCount,
        0 as hasLiked
      FROM posts p
      JOIN users u ON p.userId = u.id
      WHERE p.id = ?
    `, [result.lastID]);

    return res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      post: {
        ...newPost,
        hasLiked: false
      }
    });
  } catch (error) {
    console.error('createPost error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Get single post by id with comments
const getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const currentUserId = req.user ? req.user.id : null;

    const post = await dbGet(`
      SELECT 
        p.id,
        p.userId,
        p.content,
        p.imageUrl,
        p.createdAt,
        u.username,
        u.displayName,
        u.avatar,
        (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likesCount,
        (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentsCount,
        ${currentUserId ? `(SELECT COUNT(*) FROM likes WHERE postId = p.id AND userId = ${currentUserId})` : '0'} as hasLiked
      FROM posts p
      JOIN users u ON p.userId = u.id
      WHERE p.id = ?
    `, [postId]);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    return res.json({
      success: true,
      post: {
        ...post,
        hasLiked: Boolean(post.hasLiked)
      }
    });
  } catch (error) {
    console.error('getPostById error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Delete post (only author)
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await dbGet('SELECT * FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this post.' });
    }

    await dbRun('DELETE FROM posts WHERE id = ?', [postId]);

    return res.json({ success: true, message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('deletePost error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Toggle like / unlike on a post
const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Check if post exists
    const post = await dbGet('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    // Check if already liked
    const existing = await dbGet(
      'SELECT id FROM likes WHERE postId = ? AND userId = ?',
      [postId, userId]
    );

    let liked = false;
    if (existing) {
      await dbRun('DELETE FROM likes WHERE postId = ? AND userId = ?', [postId, userId]);
      liked = false;
    } else {
      await dbRun('INSERT INTO likes (postId, userId) VALUES (?, ?)', [postId, userId]);
      liked = true;
    }

    const countRow = await dbGet('SELECT COUNT(*) as count FROM likes WHERE postId = ?', [postId]);

    return res.json({
      success: true,
      liked,
      likesCount: countRow.count
    });
  } catch (error) {
    console.error('toggleLike error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  getFeed,
  createPost,
  getPostById,
  deletePost,
  toggleLike
};
