const express = require('express');
const { query } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

// GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const sortMap = {
      'newest': 'r.created_at DESC',
      'oldest': 'r.created_at ASC',
      'highest': 'r.rating DESC',
      'lowest': 'r.rating ASC',
      'helpful': 'r.helpful_count DESC',
    };
    const orderBy = sortMap[sort] || 'r.created_at DESC';
    
    const countResult = await query(
      'SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND is_approved = true',
      [req.params.productId]
    );
    
    const result = await query(
      `SELECT r.*, u.first_name, u.last_name, u.avatar_url,
        (SELECT json_object_agg(rating::text, cnt) FROM (
          SELECT rating, COUNT(*) as cnt FROM reviews WHERE product_id = $1 GROUP BY rating
        ) sub) as rating_breakdown
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.is_approved = true
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [req.params.productId, parseInt(limit), offset]
    );
    
    const statsResult = await query(
      `SELECT AVG(rating)::DECIMAL(3,2) as avg_rating, COUNT(*) as total_reviews
       FROM reviews WHERE product_id = $1 AND is_approved = true`,
      [req.params.productId]
    );
    
    const total = parseInt(countResult.rows[0].count);
    res.json({
      reviews: result.rows,
      stats: statsResult.rows[0],
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('Reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews/:productId
router.post('/:productId', authenticate, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 255 }),
  body('body').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Review must be 10-2000 characters'),
], validate, async (req, res) => {
  try {
    const { rating, title, body: reviewBody } = req.body;
    const { productId } = req.params;
    
    const productCheck = await query('SELECT id FROM products WHERE id = $1 AND is_active = true', [productId]);
    if (!productCheck.rows[0]) return res.status(404).json({ error: 'Product not found' });
    
    // Check if already reviewed
    const existing = await query(
      'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
      [productId, req.user.id]
    );
    if (existing.rows[0]) return res.status(409).json({ error: 'You have already reviewed this product' });
    
    // Check if verified purchase
    const purchaseCheck = await query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = $1 AND o.user_id = $2 AND o.status = 'delivered'
       LIMIT 1`,
      [productId, req.user.id]
    );
    const isVerified = purchaseCheck.rows.length > 0;
    
    const result = await query(
      `INSERT INTO reviews (product_id, user_id, rating, title, body, is_verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [productId, req.user.id, rating, title || null, reviewBody || null, isVerified]
    );
    
    // Update product rating
    await query(
      `UPDATE products SET
        rating_average = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE product_id = $1 AND is_approved = true),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND is_approved = true)
       WHERE id = $1`,
      [productId]
    );
    
    res.status(201).json({ review: result.rows[0], message: 'Review submitted successfully' });
  } catch (err) {
    console.error('Review submit error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
