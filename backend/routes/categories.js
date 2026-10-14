const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, 
        COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
       WHERE c.is_active = true
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`
    );
    res.json({ categories: result.rows });
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM categories WHERE slug = $1 AND is_active = true',
      [req.params.slug]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Category not found' });
    res.json({ category: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

module.exports = router;
