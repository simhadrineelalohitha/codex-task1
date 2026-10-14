require('dotenv').config();
const path = require('path');
const { createHash } = require('crypto');
const ExcelJS = require('exceljs');
const { CATEGORY_IMAGES, CATEGORY_FALLBACK_POOL, SUBCATEGORY_IMAGES } = require('./import-products');

const DEFAULT_WORKBOOK = path.resolve(__dirname, '..', '..', 'complete_product_database_3500_products.xlsx');
const REQUIRED_HEADERS = [
  'Product_ID', 'Product_Name', 'Category', 'Subcategory', 'Brand',
  'Variant_Specification', 'Description', 'MRP_INR', 'Discount_Percent',
  'Selling_Price_INR', 'Quality', 'Rating_Stars', 'Review_Count',
  'Manufacturing_Date', 'Expiry_Date', 'Voltage', 'Power_Rating',
  'Age_Range', 'Warranty', 'Stock_Quantity', 'Seller', 'Country_of_Origin',
  'Return_Period_Days', 'Product_Status',
];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getCellValue(cell) {
  const value = cell.value;
  if (value && typeof value === 'object' && 'result' in value) return value.result;
  if (value && typeof value === 'object' && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join('');
  }
  return value;
}

function toDate(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function imageIdFromUrl(value) {
  const match = String(value || '').match(/\/(photo-[^/?]+)(?:\?|$)/);
  return match?.[1] || null;
}

function getCandidatePhotoIds(subcategory, category) {
  const candidates = [
    ...(SUBCATEGORY_IMAGES[subcategory] || []),
    ...(CATEGORY_FALLBACK_POOL[category] || []),
    ...(CATEGORY_IMAGES[category] ? [imageIdFromUrl(CATEGORY_IMAGES[category])] : []),
  ];
  return [...new Set(candidates.filter(Boolean))];
}

function takeUniqueImage(subcategory, category, usedPhotoIds, availablePhotoIds) {
  const photoId = getCandidatePhotoIds(subcategory, category)
    .find((id) => availablePhotoIds.has(id) && !usedPhotoIds.has(id));
  if (!photoId) return null;
  usedPhotoIds.add(photoId);
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=600&q=80`;
}

async function verifyStockImageUrls(photoIds) {
  const available = new Set();
  const contentHashes = new Set();
  const ids = [...photoIds];
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < ids.length) {
      const photoId = ids[nextIndex++];
      const url = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=600&q=80`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
          const bytes = Buffer.from(await response.arrayBuffer());
          const hash = createHash('sha256').update(bytes).digest('hex');
          if (!contentHashes.has(hash)) {
            contentHashes.add(hash);
            available.add(photoId);
          }
        }
      } catch {
        // Treat an unreachable image as unavailable; the import will mark it as unverified.
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(8, ids.length) }, worker));
  return available;
}

async function readProducts(workbookPath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  const sheet = workbook.getWorksheet('Products');
  if (!sheet) throw new Error('Workbook is missing the Products worksheet.');

  const headerRow = sheet.getRow(1);
  const columns = new Map();
  headerRow.eachCell((cell, column) => {
    columns.set(String(getCellValue(cell) || '').trim(), column);
  });
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !columns.has(header));
  if (missingHeaders.length) {
    throw new Error(`Workbook is missing required columns: ${missingHeaders.join(', ')}`);
  }

  const products = [];
  const seenIds = new Set();
  const errors = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const get = (header) => getCellValue(row.getCell(columns.get(header)));
    const id = String(get('Product_ID') || '').trim();
    const name = String(get('Product_Name') || '').trim();
    const category = String(get('Category') || '').trim();
    const subcategory = String(get('Subcategory') || '').trim();
    const price = Number(get('Selling_Price_INR'));
    const mrp = Number(get('MRP_INR'));
    const stock = Number(get('Stock_Quantity'));

    if (!id && !name) continue;
    if (!id || !name || !category || !Number.isFinite(price) || price < 0 ||
        !Number.isInteger(stock) || stock < 0) {
      errors.push(`Row ${rowNumber} has a missing ID, name, category, valid price, or stock value.`);
      continue;
    }
    if (seenIds.has(id)) {
      errors.push(`Row ${rowNumber} duplicates product ID ${id}.`);
      continue;
    }
    seenIds.add(id);

    products.push({
      id,
      name,
      category,
      subcategory,
      brand: get('Brand') ? String(get('Brand')).trim() : null,
      variant: get('Variant_Specification') ? String(get('Variant_Specification')).trim() : null,
      description: get('Description') ? String(get('Description')).trim() : null,
      mrp: Number.isFinite(mrp) && mrp > 0 ? mrp : null,
      price,
      discount: Number(get('Discount_Percent')) || 0,
      quality: get('Quality') ? String(get('Quality')).trim() : null,
      rating: Number(get('Rating_Stars')) || 0,
      reviewCount: Number(get('Review_Count')) || 0,
      manufacturingDate: toDate(get('Manufacturing_Date')),
      expiryDate: toDate(get('Expiry_Date')),
      voltage: get('Voltage') ? String(get('Voltage')).trim() : null,
      powerRating: get('Power_Rating') ? String(get('Power_Rating')).trim() : null,
      ageRange: get('Age_Range') ? String(get('Age_Range')).trim() : null,
      warranty: get('Warranty') ? String(get('Warranty')).trim() : null,
      stock,
      seller: get('Seller') ? String(get('Seller')).trim() : null,
      country: get('Country_of_Origin') ? String(get('Country_of_Origin')).trim() : null,
      returnDays: Number(get('Return_Period_Days')) || 0,
      status: String(get('Product_Status') || '').trim(),
      sku: id,
      slug: `${slugify(name)}-${slugify(id)}`,
    });
  }

  if (errors.length) {
    throw new Error(`Workbook validation failed (${errors.length} row errors): ${errors.slice(0, 10).join(' ')}`);
  }
  if (!products.length) throw new Error('Workbook contains no product rows.');
  return products;
}

async function getCategoryId(client, category, categoryCache) {
  if (categoryCache.has(category)) return categoryCache.get(category);

  const slug = slugify(category) || 'general';
  const imageUrl = CATEGORY_IMAGES[category] || null;
  const existing = await client.query('SELECT id FROM categories WHERE slug = $1', [slug]);
  let id = existing.rows[0]?.id;
  if (!id) {
    const result = await client.query(
      `INSERT INTO categories (name, slug, description, image_url, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [category, slug, `Products in ${category}`, imageUrl]
    );
    id = result.rows[0].id;
  }
  categoryCache.set(category, id);
  return id;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const workbookPath = path.resolve(args.find((argument) => !argument.startsWith('--')) || DEFAULT_WORKBOOK);
  const products = await readProducts(workbookPath);
  const photoIds = new Set(products.flatMap((product) => getCandidatePhotoIds(product.subcategory, product.category)));
  const availablePhotoIds = await verifyStockImageUrls(photoIds);

  if (dryRun) {
    const usedPhotoIds = new Set();
    let imageCandidates = 0;
    for (const product of products) {
      if (takeUniqueImage(product.subcategory, product.category, usedPhotoIds, availablePhotoIds)) {
        imageCandidates += 1;
      }
    }
    const categories = new Set(products.map((product) => product.category));
    console.log(`Workbook: ${workbookPath}`);
    console.log(`Rows validated: ${products.length}`);
    console.log(`Unique product IDs: ${new Set(products.map((product) => product.id)).size}`);
    console.log(`Categories: ${categories.size}`);
    console.log(`Distinct stock-photo files verified over HTTP: ${availablePhotoIds.size}/${photoIds.size}`);
    console.log(`Unique mapped image candidates for this workbook: ${imageCandidates}/${products.length}`);
    console.log('Image note: source-category mapping is not exact-model verification; remaining products need an image source or a no-verified-image state.');
    console.log('Database note: dry run does not check existing SKUs or image URLs in PostgreSQL.');
    return;
  }

  const { pool } = require('./config/database');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('smartcart-excel-product-import'))");

    const skus = products.map((product) => product.sku);
    const [existingProducts, existingImageUrls] = await Promise.all([
      client.query('SELECT sku FROM products WHERE sku = ANY($1::text[])', [skus]),
      client.query(`
        SELECT url FROM product_images
        UNION
        SELECT image.value->>'url' AS url
        FROM products p
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(p.images) = 'array' THEN p.images ELSE '[]'::jsonb END
        ) AS image(value)
      `),
    ]);

    const existingSkus = new Set(existingProducts.rows.map((row) => row.sku));
    const usedPhotoIds = new Set(existingImageUrls.rows.map((row) => imageIdFromUrl(row.url)).filter(Boolean));
    const categoryCache = new Map();
    let inserted = 0;
    let skippedExisting = 0;
    let importedWithoutImage = 0;

    for (const product of products) {
      if (existingSkus.has(product.sku)) {
        skippedExisting += 1;
        continue;
      }

      const categoryId = await getCategoryId(client, product.category, categoryCache);
      const imageUrl = takeUniqueImage(
        product.subcategory,
        product.category,
        usedPhotoIds,
        availablePhotoIds
      );
      const image = imageUrl ? [{
        url: imageUrl,
        alt_text: product.name,
        is_primary: true,
        sort_order: 0,
      }] : [];
      const metadata = {
        variant_spec: product.variant,
        quality: product.quality,
        manufacturing_date: product.manufacturingDate,
        expiry_date: product.expiryDate,
        voltage: product.voltage,
        power_rating: product.powerRating,
        age_range: product.ageRange,
        warranty: product.warranty,
        seller: product.seller,
        country_of_origin: product.country,
        return_period_days: product.returnDays,
        discount_percent: product.discount,
        original_product_id: product.id,
        image_status: imageUrl ? 'stock_photo_unverified' : 'unverified_missing',
      };

      const result = await client.query(`
        INSERT INTO products (
          name, slug, description, short_description, price, compare_price,
          category_id, brand, sku, stock_quantity, low_stock_threshold,
          is_active, is_featured, rating_average, rating_count, images, tags, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 10,
          $11, $12, $13, $14, $15::jsonb, $16, $17::jsonb
        )
        ON CONFLICT (sku) DO NOTHING
        RETURNING id
      `, [
        product.name,
        product.slug,
        product.description || `${product.name} - ${product.subcategory || product.category}`,
        product.variant
          ? `${product.variant}${product.warranty ? ` | Warranty: ${product.warranty}` : ''}`
          : (product.description || '').slice(0, 200),
        product.price,
        product.mrp > product.price ? product.mrp : null,
        categoryId,
        product.brand,
        product.sku,
        product.status === 'Out of Stock' ? 0 : product.stock,
        product.status !== 'Discontinued',
        product.rating >= 4.5 && product.reviewCount > 10000,
        Math.max(0, Math.min(5, product.rating)),
        product.reviewCount,
        JSON.stringify(image),
        product.subcategory
          ? [slugify(product.subcategory), slugify(product.category)]
          : [slugify(product.category)],
        JSON.stringify(metadata),
      ]);

      if (!result.rows[0]) {
        skippedExisting += 1;
        continue;
      }
      if (imageUrl) {
        await client.query(
          `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
           VALUES ($1, $2, $3, 0, true)
           ON CONFLICT (product_id, url) DO NOTHING`,
          [result.rows[0].id, imageUrl, product.name]
        );
      } else {
        importedWithoutImage += 1;
      }
      existingSkus.add(product.sku);
      inserted += 1;
    }

    await client.query('COMMIT');
    console.log(`Imported new products: ${inserted}`);
    console.log(`Skipped existing product IDs (preserved): ${skippedExisting}`);
    console.log(`Imported without a unique verified image: ${importedWithoutImage}`);
    console.log('Image note: assigned Unsplash stock images are category-mapped and HTTP-checked, but not verified as exact product models.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = { main, readProducts, verifyStockImageUrls };

if (require.main === module) {
  main().catch((error) => {
    console.error(`Product import failed: ${error.message}`);
    process.exitCode = 1;
  });
}
