-- SmartCart AI — Safe Schema Migration
-- Adds missing columns, fixes constraints, creates indexes
-- Run AFTER 001_schema.sql if upgrading an existing DB

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Products: ensure images JSONB column exists ────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='images'
  ) THEN
    ALTER TABLE products ADD COLUMN images JSONB DEFAULT '[]';
  END IF;
END $$;

-- ── Products: ensure metadata JSONB column exists ─────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='metadata'
  ) THEN
    ALTER TABLE products ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- ── Products: ensure sold_count exists ────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='sold_count'
  ) THEN
    ALTER TABLE products ADD COLUMN sold_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ── product_images: ON CONFLICT DO NOTHING needs unique constraint ─────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'product_images_product_id_url_key'
  ) THEN
    ALTER TABLE product_images ADD CONSTRAINT product_images_product_id_url_key UNIQUE (product_id, url);
  END IF;
END $$;

-- ── Indexes for performance with 3500 products ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products (rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);

-- ── Orders indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders (order_number);

-- ── Cart/wishlist indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items (user_id);

-- Migration 003 complete: indexes and column additions done.
