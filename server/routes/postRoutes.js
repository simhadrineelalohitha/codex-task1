const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');

router.get('/', optionalAuthMiddleware, postController.getFeed);
router.post('/', authMiddleware, postController.createPost);
router.get('/:id', optionalAuthMiddleware, postController.getPostById);
router.delete('/:id', authMiddleware, postController.deletePost);
router.post('/:id/like', authMiddleware, postController.toggleLike);

module.exports = router;
