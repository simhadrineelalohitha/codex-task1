const express = require('express');
const { query, getClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SC-${timestamp}-${random}`;
};

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['o.user_id = $1'];
    const params = [req.user.id];
    let paramIdx = 2;
    
    if (status) {
      conditions.push(`o.status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }
    
    const countResult = await query(
      `SELECT COUNT(*) FROM orders o WHERE ${conditions.join(' AND ')}`,
      params
    );
    
    const ordersResult = await query(
      `SELECT o.*, 
        (SELECT json_agg(json_build_object(
          'id', oi.id, 'product_name', oi.product_name, 'quantity', oi.quantity,
          'unit_price', oi.unit_price, 'total_price', oi.total_price, 'product_image', oi.product_image
        )) FROM order_items oi WHERE oi.order_id = o.id) as items
       FROM orders o
       WHERE ${conditions.join(' AND ')}
       ORDER BY o.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, parseInt(limit), offset]
    );
    
    const total = parseInt(countResult.rows[0].count);
    res.json({
      orders: ordersResult.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('Orders list error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const orderResult = await query(
      `SELECT o.* FROM orders o WHERE o.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!orderResult.rows[0]) return res.status(404).json({ error: 'Order not found' });
    
    const order = orderResult.rows[0];
    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );
    const historyResult = await query(
      'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC',
      [order.id]
    );
    
    res.json({ order: { ...order, items: itemsResult.rows, history: historyResult.rows } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders (checkout)
router.post('/', authenticate, [
  body('shipping_address').notEmpty().withMessage('Shipping address required'),
  body('payment_method').isIn(['cod', 'card', 'upi', 'netbanking']).withMessage('Invalid payment method'),
  body('items').optional().isArray(),
], validate, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const { shipping_address, payment_method, notes, coupon_code } = req.body;
    
    // Get cart items
    const cartResult = await client.query(
      `SELECT ci.quantity, p.id as product_id, p.name, p.price, p.stock_quantity,
        COALESCE(
          (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
          p.images->0->>'url'
        ) as image
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1 AND p.is_active = true
       FOR UPDATE OF p`,
      [req.user.id]
    );
    
    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Check stock
    for (const item of cartResult.rows) {
      if (item.stock_quantity < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
      }
    }
    
    // Calculate totals
    let subtotal = cartResult.rows.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const shipping = subtotal >= 500 ? 0 : 49;
    const tax = subtotal * 0.18;
    const total = subtotal + shipping + tax;
    
    const orderNumber = generateOrderNumber();
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
    
    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (order_number, user_id, status, payment_status, payment_method,
        subtotal, shipping_amount, tax_amount, total, shipping_address, notes, estimated_delivery)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [orderNumber, req.user.id, 'confirmed', 'pending',
       payment_method, subtotal.toFixed(2), shipping.toFixed(2), tax.toFixed(2), total.toFixed(2),
       JSON.stringify(shipping_address), notes || null, estimatedDelivery]
    );
    
    const order = orderResult.rows[0];
    
    // Insert order items & update stock
    for (const item of cartResult.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, sku, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [order.id, item.product_id, item.name, item.image, null, item.quantity,
         item.price, (parseFloat(item.price) * item.quantity).toFixed(2)]
      );
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1, sold_count = sold_count + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }
    
    // Add status history
    await client.query(
      `INSERT INTO order_status_history (order_id, status, comment, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [order.id, 'confirmed', 'Order placed successfully', req.user.id]
    );
    
    // Clear cart
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Order placed successfully',
      order: { ...order, items: cartResult.rows },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    client.release();
  }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const orderResult = await query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (!orderResult.rows[0]) return res.status(404).json({ error: 'Order not found' });
    const order = orderResult.rows[0];
    
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }
    
    await query(
      `UPDATE orders SET status = 'cancelled', cancellation_reason = $1, cancelled_at = NOW()
       WHERE id = $2`,
      [reason || 'Customer requested cancellation', order.id]
    );
    
    // Restore stock
    const items = await query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [order.id]);
    for (const item of items.rows) {
      await query(
        'UPDATE products SET stock_quantity = stock_quantity + $1, sold_count = sold_count - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }
    
    await query(
      `INSERT INTO order_status_history (order_id, status, comment, changed_by)
       VALUES ($1, 'cancelled', $2, $3)`,
      [order.id, reason || 'Customer requested cancellation', req.user.id]
    );
    
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;
