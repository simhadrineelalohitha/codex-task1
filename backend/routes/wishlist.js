const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/wishlist
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT wi.id, wi.created_at,
        p.id as product_id, p.name, p.slug, p.price, p.compare_price, p.rating_average, p.rating_count,
        p.metadata->>'image_status' as image_status,
        COALESCE(
          (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
          p.images->0->>'url'
        ) as image
       FROM wishlist_items wi
       JOIN products p ON wi.product_id = p.id
       WHERE wi.user_id = $1 AND p.is_active = true
       ORDER BY wi.created_at DESC`,
      [req.user.id]
    );
    res.json({ items: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// POST /api/wishlist
router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ error: 'Product ID required' });
    
    const check = await query('SELECT id FROM products WHERE id = $1 AND is_active = true', [product_id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Product not found' });
    
    await query(
      'INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, product_id]
    );
    res.json({ message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', authenticate, async (req, res) => {
  try {
    await query(
      'DELETE FROM wishlist_items WHERE product_id = $1 AND user_id = $2',
      [req.params.productId, req.user.id]
    );
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

module.exports = router;
