const { dbRun, dbGet, dbAll } = require('../config/db');

// Get comments for a post
const getComments = async (req, res) => {
  try {
    const postId = req.params.postId;

    const comments = await dbAll(`
      SELECT 
        c.id,
        c.postId,
        c.userId,
        c.content,
        c.createdAt,
        u.username,
        u.displayName,
        u.avatar
      FROM comments c
      JOIN users u ON c.userId = u.id
      WHERE c.postId = ?
      ORDER BY c.createdAt ASC
    `, [postId]);

    return res.json({ success: true, comments });
  } catch (error) {
    console.error('getComments error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Add comment to a post
const addComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    // Verify post exists
    const post = await dbGet('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const result = await dbRun(
      'INSERT INTO comments (postId, userId, content) VALUES (?, ?, ?)',
      [postId, userId, content.trim()]
    );

    const newComment = await dbGet(`
      SELECT 
        c.id,
        c.postId,
        c.userId,
        c.content,
        c.createdAt,
        u.username,
        u.displayName,
        u.avatar
      FROM comments c
      JOIN users u ON c.userId = u.id
      WHERE c.id = ?
    `, [result.lastID]);

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comment: newComment
    });
  } catch (error) {
    console.error('addComment error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Delete comment (only author)
const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const comment = await dbGet('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this comment.' });
    }

    await dbRun('DELETE FROM comments WHERE id = ?', [commentId]);

    return res.json({ success: true, message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('deleteComment error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  getComments,
  addComment,
  deleteComment
};
