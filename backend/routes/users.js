const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

// GET /api/users/addresses
router.get('/addresses', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json({ addresses: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// POST /api/users/addresses
router.post('/addresses', authenticate, [
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('address_line1').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('postal_code').trim().notEmpty(),
], validate, async (req, res) => {
  try {
    const { first_name, last_name, phone, address_line1, address_line2, city, state, postal_code, country, label, is_default } = req.body;
    
    if (is_default) {
      await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }
    
    const result = await query(
      `INSERT INTO addresses (user_id, label, first_name, last_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [req.user.id, label || 'Home', first_name, last_name, phone, address_line1, address_line2, city, state, postal_code, country || 'India', is_default || false]
    );
    res.status(201).json({ address: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add address' });
  }
});

// PUT /api/users/addresses/:id
router.put('/addresses/:id', authenticate, async (req, res) => {
  try {
    const { first_name, last_name, phone, address_line1, address_line2, city, state, postal_code, country, label, is_default } = req.body;
    
    if (is_default) {
      await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }
    
    const result = await query(
      `UPDATE addresses SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        address_line1 = COALESCE($4, address_line1),
        address_line2 = COALESCE($5, address_line2),
        city = COALESCE($6, city),
        state = COALESCE($7, state),
        postal_code = COALESCE($8, postal_code),
        country = COALESCE($9, country),
        label = COALESCE($10, label),
        is_default = COALESCE($11, is_default)
       WHERE id = $12 AND user_id = $13
       RETURNING *`,
      [first_name, last_name, phone, address_line1, address_line2, city, state, postal_code, country, label, is_default, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Address not found' });
    res.json({ address: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// DELETE /api/users/addresses/:id
router.delete('/addresses/:id', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

module.exports = router;
