const express = require('express');
const { query, getClient } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const csvParser = require('csv-parser');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// All admin routes require auth + admin role
router.use(authenticate, requireAdmin);

// Upload config for CSV/Excel
const upload = multer({
  dest: path.join(__dirname, '../uploads/temp'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only CSV and Excel files are allowed'));
  },
});

// ─── Dashboard Stats ───────────────────────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [users, products, orders, revenue, recentOrders] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL \'30 days\') as new_this_month FROM users WHERE role = \'customer\''),
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE stock_quantity <= low_stock_threshold) as low_stock FROM products WHERE is_active = true'),
      query(`SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
       FROM orders`),
      query(`SELECT 
        COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled', 'refunded')), 0) as total_revenue,
        COALESCE(SUM(total) FILTER (WHERE created_at > NOW() - INTERVAL '30 days' AND status NOT IN ('cancelled', 'refunded')), 0) as monthly_revenue
       FROM orders`),
      query(`SELECT o.id, o.order_number, o.total, o.status, o.created_at,
        u.first_name, u.last_name, u.email
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT 5`),
    ]);
    
    // Monthly revenue chart data (last 6 months)
    const chartData = await query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at > NOW() - INTERVAL '6 months'
        AND status NOT IN ('cancelled', 'refunded')
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);
    
    // Top selling products
    const topProducts = await query(`
      SELECT p.name, p.slug, SUM(oi.quantity) as sold, SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status NOT IN ('cancelled', 'refunded')
      GROUP BY p.id, p.name, p.slug
      ORDER BY sold DESC
      LIMIT 5
    `);
    
    res.json({
      stats: {
        users: users.rows[0],
        products: products.rows[0],
        orders: orders.rows[0],
        revenue: revenue.rows[0],
      },
      recentOrders: recentOrders.rows,
      chartData: chartData.rows,
      topProducts: topProducts.rows,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── Products ──────────────────────────────────────────────────────────────────

// GET /api/admin/products
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let paramIdx = 1;
    
    if (search) {
      conditions.push(`(p.name ILIKE $${paramIdx} OR p.sku ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (category) {
      conditions.push(`c.slug = $${paramIdx}`);
      params.push(category);
      paramIdx++;
    }
    if (status === 'active') conditions.push('p.is_active = true');
    if (status === 'inactive') conditions.push('p.is_active = false');
    if (status === 'low_stock') conditions.push('p.stock_quantity <= p.low_stock_threshold');
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countResult = await query(
      `SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause}`,
      params
    );
    
    const result = await query(
      `SELECT p.id, p.name, p.slug, p.price, p.compare_price, p.brand, p.sku,
        p.stock_quantity, p.low_stock_threshold, p.rating_average, p.rating_count,
        p.is_active, p.is_featured, p.created_at, c.name as category_name,
        p.metadata->>'image_status' as image_status,
        COALESCE(
          (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
          p.images->0->>'url'
        ) as primary_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, parseInt(limit), offset]
    );
    
    const total = parseInt(countResult.rows[0].count);
    res.json({
      products: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/admin/products
router.post('/products', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { name, description, short_description, price, compare_price, cost_price, category_id, brand, sku, stock_quantity, low_stock_threshold, is_featured, images, tags } = req.body;
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
    
    const result = await client.query(
      `INSERT INTO products (name, slug, description, short_description, price, compare_price, cost_price, category_id, brand, sku, stock_quantity, low_stock_threshold, is_featured, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, slug, description, short_description, price, compare_price, cost_price, category_id, brand, sku, stock_quantity || 0, low_stock_threshold || 5, is_featured || false, tags || []]
    );
    
    const product = result.rows[0];
    
    // Insert images
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await client.query(
          'INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES ($1, $2, $3, $4, $5)',
          [product.id, images[i].url, images[i].alt_text || name, i, i === 0]
        );
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json({ product, message: 'Product created' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Product create error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  } finally {
    client.release();
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', async (req, res) => {
  try {
    const { name, description, short_description, price, compare_price, cost_price, category_id, brand, sku, stock_quantity, low_stock_threshold, is_featured, is_active, tags } = req.body;
    
    const result = await query(
      `UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        short_description = COALESCE($3, short_description),
        price = COALESCE($4, price),
        compare_price = COALESCE($5, compare_price),
        cost_price = COALESCE($6, cost_price),
        category_id = COALESCE($7, category_id),
        brand = COALESCE($8, brand),
        sku = COALESCE($9, sku),
        stock_quantity = COALESCE($10, stock_quantity),
        low_stock_threshold = COALESCE($11, low_stock_threshold),
        is_featured = COALESCE($12, is_featured),
        is_active = COALESCE($13, is_active),
        tags = COALESCE($14, tags)
       WHERE id = $15
       RETURNING *`,
      [name, description, short_description, price, compare_price, cost_price, category_id, brand, sku, stock_quantity, low_stock_threshold, is_featured, is_active, tags, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    await query('UPDATE products SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST /api/admin/products/bulk-import
router.post('/products/bulk-import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const ext = path.extname(req.file.originalname).toLowerCase();
    const rows = [];
    
    if (ext === '.csv') {
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csvParser())
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);
      const sheet = workbook.worksheets[0];
      const headers = [];
      sheet.eachRow((row, rowNum) => {
        if (rowNum === 1) {
          row.eachCell((cell) => headers.push(cell.value?.toString().toLowerCase().trim()));
        } else {
          const obj = {};
          row.eachCell((cell, colNum) => {
            if (headers[colNum - 1]) obj[headers[colNum - 1]] = cell.value;
          });
          rows.push(obj);
        }
      });
    }
    
    fs.unlinkSync(req.file.path); // Cleanup temp file
    
    let imported = 0;
    let failed = 0;
    const errors = [];
    
    for (const row of rows) {
      try {
        if (!row.name || !row.price) {
          failed++;
          errors.push(`Row missing name or price`);
          continue;
        }
        
        const slug = row.name.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36) + imported;
        
        await query(
          `INSERT INTO products (name, slug, description, price, compare_price, brand, sku, stock_quantity, tags)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (slug) DO NOTHING`,
          [row.name, slug, row.description || '', parseFloat(row.price), parseFloat(row.compare_price) || null,
           row.brand || null, row.sku || null, parseInt(row.stock_quantity) || 0,
           row.tags ? row.tags.split(',').map(t => t.trim()) : []]
        );
        imported++;
      } catch (e) {
        failed++;
        errors.push(e.message);
      }
    }
    
    res.json({ imported, failed, errors: errors.slice(0, 10), total: rows.length });
  } catch (err) {
    console.error('Bulk import error:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Bulk import failed' });
  }
});

// ─── Orders ────────────────────────────────────────────────────────────────────

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let paramIdx = 1;
    
    if (status) {
      conditions.push(`o.status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }
    if (search) {
      conditions.push(`(o.order_number ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countResult = await query(
      `SELECT COUNT(*) FROM orders o JOIN users u ON o.user_id = u.id ${whereClause}`,
      params
    );
    
    const result = await query(
      `SELECT o.*, u.first_name, u.last_name, u.email,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, parseInt(limit), offset]
    );
    
    const total = parseInt(countResult.rows[0].count);
    res.json({
      orders: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, comment, tracking_number } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    
    const result = await query(
      `UPDATE orders SET status = $1, tracking_number = COALESCE($2, tracking_number),
        delivered_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE delivered_at END
       WHERE id = $3 RETURNING *`,
      [status, tracking_number, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Order not found' });
    
    await query(
      'INSERT INTO order_status_history (order_id, status, comment, changed_by) VALUES ($1, $2, $3, $4)',
      [req.params.id, status, comment || null, req.user.id]
    );
    
    res.json({ order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ─── Users ─────────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let paramIdx = 1;
    
    if (search) {
      conditions.push(`(email ILIKE $${paramIdx} OR first_name ILIKE $${paramIdx} OR last_name ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (role) {
      conditions.push(`role = $${paramIdx}`);
      params.push(role);
      paramIdx++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countResult = await query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
    const result = await query(
      `SELECT id, email, first_name, last_name, phone, role, is_active, created_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, parseInt(limit), offset]
    );
    
    const total = parseInt(countResult.rows[0].count);
    res.json({
      users: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const { is_active, role } = req.body;
    const result = await query(
      'UPDATE users SET is_active = COALESCE($1, is_active), role = COALESCE($2, role) WHERE id = $3 RETURNING id, email, role, is_active',
      [is_active, role, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ─── Categories Admin ──────────────────────────────────────────────────────────

// POST /api/admin/categories
router.post('/categories', async (req, res) => {
  try {
    const { name, description, image_url, sort_order } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const result = await query(
      'INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, slug, description, image_url, sort_order || 0]
    );
    res.status(201).json({ category: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// GET /api/admin/inventory
router.get('/inventory', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.id, p.name, p.sku, p.stock_quantity, p.low_stock_threshold,
        c.name as category_name,
        CASE 
          WHEN p.stock_quantity = 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY p.stock_quantity ASC
    `);
    res.json({ inventory: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

module.exports = router;
