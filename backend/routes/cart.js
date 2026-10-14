const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/cart
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT ci.id, ci.quantity, ci.created_at,
        p.id as product_id, p.name, p.slug, p.price, p.compare_price, p.stock_quantity,
        p.metadata->>'image_status' as image_status,
        COALESCE(
          (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
          p.images->0->>'url'
        ) as image
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1 AND p.is_active = true
       ORDER BY ci.created_at DESC`,
      [req.user.id]
    );
    
    const items = result.rows;
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    
    res.json({ items, subtotal: subtotal.toFixed(2) });
  } catch (err) {
    console.error('Cart get error:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart
router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id || quantity < 1) return res.status(400).json({ error: 'Invalid product or quantity' });
    
    const productCheck = await query(
      'SELECT id, stock_quantity, name FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );
    if (!productCheck.rows[0]) return res.status(404).json({ error: 'Product not found' });
    if (productCheck.rows[0].stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    await query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3`,
      [req.user.id, product_id, quantity]
    );
    
    res.json({ message: 'Added to cart' });
  } catch (err) {
    console.error('Cart add error:', err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// PUT /api/cart/:itemId
router.put('/:itemId', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Invalid quantity' });
    
    const result = await query(
      `UPDATE cart_items SET quantity = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [quantity, req.params.itemId, req.user.id]
    );
    
    if (!result.rows[0]) return res.status(404).json({ error: 'Cart item not found' });
    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', authenticate, async (req, res) => {
  try {
    await query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
      [req.params.itemId, req.user.id]
    );
    res.json({ message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// DELETE /api/cart (clear all)
router.delete('/', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
