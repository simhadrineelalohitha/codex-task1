const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');

router.get('/:username', optionalAuthMiddleware, userController.getUserProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.post('/:userId/follow', authMiddleware, userController.toggleFollow);

module.exports = router;
