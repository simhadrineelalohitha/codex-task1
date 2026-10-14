const express = require('express');
const { query } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Helper: extract primary image from either product_images table or images JSONB
const PRIMARY_IMAGE_SQL = `
  COALESCE(
    (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
    p.images->0->>'url'
  )
`;

// GET /api/products - list with pagination, search, filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      category,
      min_price,
      max_price,
      min_rating,
      brand,
      sort = 'created_at_desc',
      featured,
      tags,
    } = req.query;

    const safePage  = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 12));
    const offset    = (safePage - 1) * safeLimit;

    const conditions = ['p.is_active = true'];
    const params = [];
    let p = 1;

    if (search && search.trim()) {
      conditions.push(`(p.name ILIKE $${p} OR p.description ILIKE $${p} OR p.brand ILIKE $${p} OR p.short_description ILIKE $${p})`);
      params.push(`%${search.trim()}%`);
      p++;
    }
    if (category) {
      conditions.push(`c.slug = $${p}`);
      params.push(category);
      p++;
    }
    if (min_price) {
      conditions.push(`p.price >= $${p}`);
      params.push(parseFloat(min_price));
      p++;
    }
    if (max_price) {
      conditions.push(`p.price <= $${p}`);
      params.push(parseFloat(max_price));
      p++;
    }
    if (min_rating) {
      conditions.push(`p.rating_average >= $${p}`);
      params.push(parseFloat(min_rating));
      p++;
    }
    if (brand) {
      conditions.push(`p.brand ILIKE $${p}`);
      params.push(`%${brand}%`);
      p++;
    }
    if (featured === 'true') {
      conditions.push('p.is_featured = true');
    }
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        conditions.push(`p.tags && $${p}`);
        params.push(tagList);
        p++;
      }
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const sortMap = {
      'price_asc':       'p.price ASC',
      'price_desc':      'p.price DESC',
      'rating_desc':     'p.rating_average DESC, p.rating_count DESC',
      'name_asc':        'p.name ASC',
      'created_at_desc': 'p.created_at DESC',
      'sold_desc':       'p.sold_count DESC',
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    const [countResult, productsResult] = await Promise.all([
      query(
        `SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause}`,
        params
      ),
      query(
        `SELECT
          p.id, p.name, p.slug, p.price, p.compare_price, p.brand,
          p.stock_quantity, p.rating_average, p.rating_count, p.sold_count,
          p.is_featured, p.tags, p.short_description, p.sku,
          p.metadata->>'image_status' as image_status,
          c.name as category_name, c.slug as category_slug,
          ${PRIMARY_IMAGE_SQL} as primary_image
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         ${whereClause}
         ORDER BY ${orderBy}
         LIMIT $${p} OFFSET $${p + 1}`,
        [...params, safeLimit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count);
    res.json({
      products: productsResult.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    console.error('Products list error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/featured
router.get('/featured', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.id, p.name, p.slug, p.price, p.compare_price, p.brand,
        p.stock_quantity, p.rating_average, p.rating_count, p.is_featured,
        p.metadata->>'image_status' as image_status,
        c.name as category_name, c.slug as category_slug,
        ${PRIMARY_IMAGE_SQL} as primary_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true AND p.is_featured = true
       ORDER BY p.rating_average DESC, p.sold_count DESC
       LIMIT 12`
    );
    // fallback: if no featured, return top-rated
    if (result.rows.length === 0) {
      const fallback = await query(
        `SELECT p.id, p.name, p.slug, p.price, p.compare_price, p.brand,
          p.stock_quantity, p.rating_average, p.rating_count,
          p.metadata->>'image_status' as image_status,
          c.name as category_name, c.slug as category_slug,
          ${PRIMARY_IMAGE_SQL} as primary_image
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = true
         ORDER BY p.rating_average DESC, p.rating_count DESC LIMIT 12`
      );
      return res.json({ products: fallback.rows });
    }
    res.json({ products: result.rows });
  } catch (err) {
    console.error('Featured products error:', err);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// GET /api/products/search-suggestions
router.get('/search-suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ suggestions: [] });
    const result = await query(
      `SELECT DISTINCT name, slug, brand FROM products
       WHERE is_active = true AND (name ILIKE $1 OR brand ILIKE $1)
       ORDER BY name LIMIT 8`,
      [`%${q}%`]
    );
    res.json({ suggestions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// GET /api/products/:slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await query(
      `SELECT p.*,
        c.name as category_name, c.slug as category_slug,
        ${PRIMARY_IMAGE_SQL} as primary_image,
        COALESCE(
          (SELECT json_agg(json_build_object('id', id, 'url', url, 'alt_text', alt_text, 'is_primary', is_primary) ORDER BY sort_order)
           FROM product_images WHERE product_id = p.id),
          p.images,
          '[]'::json
        ) as image_list
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = $1`,
      [slug]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = result.rows[0];

    // Also search by partial slug (handle -prd00001 suffix)
    const [related, wishlistCheck] = await Promise.all([
      query(
        `SELECT p.id, p.name, p.slug, p.price, p.compare_price, p.brand,
          p.rating_average, p.rating_count, p.stock_quantity,
          p.metadata->>'image_status' as image_status,
          ${PRIMARY_IMAGE_SQL} as primary_image
         FROM products p
         WHERE p.category_id = $1 AND p.id != $2 AND p.is_active = true
         ORDER BY p.rating_average DESC LIMIT 6`,
        [product.category_id, product.id]
      ),
      req.user
        ? query('SELECT id FROM wishlist_items WHERE user_id=$1 AND product_id=$2', [req.user.id, product.id])
        : Promise.resolve({ rows: [] }),
    ]);

    res.json({
      product: { ...product, in_wishlist: wishlistCheck.rows.length > 0 },
      related: related.rows,
    });
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;
