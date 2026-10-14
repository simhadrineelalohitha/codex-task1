const { dbRun, dbGet, dbAll } = require('../config/db');

// Get user profile by username
const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const user = await dbGet(`
      SELECT id, username, displayName, bio, avatar, createdAt
      FROM users
      WHERE username = ?
    `, [username.toLowerCase()]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Follower and Following counts
    const followersCountRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE followingId = ?', [user.id]);
    const followingCountRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE followerId = ?', [user.id]);

    // Check if current user is following this profile user
    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const followCheck = await dbGet(
        'SELECT id FROM follows WHERE followerId = ? AND followingId = ?',
        [currentUserId, user.id]
      );
      isFollowing = Boolean(followCheck);
    }

    // Get posts by this user
    const posts = await dbAll(`
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
      WHERE p.userId = ?
      ORDER BY p.createdAt DESC
    `, [user.id]);

    const formattedPosts = posts.map(post => ({
      ...post,
      hasLiked: Boolean(post.hasLiked)
    }));

    return res.json({
      success: true,
      profile: {
        ...user,
        followersCount: followersCountRow.count,
        followingCount: followingCountRow.count,
        isFollowing,
        isSelf: currentUserId === user.id,
        posts: formattedPosts
      }
    });
  } catch (error) {
    console.error('getUserProfile error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Update own profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { displayName, bio, avatar } = req.body;

    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ success: false, message: 'Display name cannot be empty.' });
    }

    await dbRun(`
      UPDATE users 
      SET displayName = ?, bio = ?, avatar = ?
      WHERE id = ?
    `, [
      displayName.trim(),
      bio ? bio.trim() : '',
      avatar ? avatar.trim() : '',
      userId
    ]);

    const updatedUser = await dbGet(`
      SELECT id, username, email, displayName, bio, avatar, createdAt
      FROM users
      WHERE id = ?
    `, [userId]);

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Toggle follow / unfollow user
const toggleFollow = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const followerId = req.user.id;

    if (targetUserId === followerId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }

    const targetUser = await dbGet('SELECT id FROM users WHERE id = ?', [targetUserId]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    const existingFollow = await dbGet(
      'SELECT id FROM follows WHERE followerId = ? AND followingId = ?',
      [followerId, targetUserId]
    );

    let isFollowing = false;
    if (existingFollow) {
      await dbRun('DELETE FROM follows WHERE followerId = ? AND followingId = ?', [followerId, targetUserId]);
      isFollowing = false;
    } else {
      await dbRun('INSERT INTO follows (followerId, followingId) VALUES (?, ?)', [followerId, targetUserId]);
      isFollowing = true;
    }

    const followersCountRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE followingId = ?', [targetUserId]);

    return res.json({
      success: true,
      isFollowing,
      followersCount: followersCountRow.count,
      message: isFollowing ? 'Followed user' : 'Unfollowed user'
    });
  } catch (error) {
    console.error('toggleFollow error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  toggleFollow
};
