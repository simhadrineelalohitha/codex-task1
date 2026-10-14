-- SmartCart AI Seed Data
-- Run after schema: node migrate.js --seed

-- Categories
INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES
('Electronics', 'electronics', 'Smartphones, laptops, TVs and more', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', 1),
('Fashion', 'fashion', 'Clothing, footwear and accessories', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', 2),
('Home & Kitchen', 'home-kitchen', 'Appliances, furniture and decor', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', 3),
('Sports & Fitness', 'sports-fitness', 'Equipment, apparel and accessories', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400', 4),
('Books & Stationery', 'books-stationery', 'Books, notebooks and office supplies', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', 5),
('Beauty & Health', 'beauty-health', 'Skincare, haircare and wellness', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', 6),
('Toys & Kids', 'toys-kids', 'Toys, games and educational items', 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400', 7),
('Food & Grocery', 'food-grocery', 'Fresh food, snacks and beverages', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', 8)
ON CONFLICT (slug) DO NOTHING;

-- Electronics Products
WITH cat AS (SELECT id FROM categories WHERE slug = 'electronics')
INSERT INTO products (name, slug, description, short_description, price, compare_price, brand, sku, stock_quantity, is_featured, rating_average, rating_count, sold_count, tags, category_id)
SELECT name, slug, description, short_description, price, compare_price, brand, sku, stock_qty, is_feat, rating, rating_cnt, sold, tags, cat.id FROM cat, (VALUES
  ('Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'The Samsung Galaxy S24 Ultra is the ultimate Android smartphone with a 6.8-inch Dynamic AMOLED display, Snapdragon 8 Gen 3 processor, and a 200MP quad-camera system. Features built-in S Pen for productivity and creativity.', 'Flagship Android smartphone with 200MP camera and S Pen', 124999, 134999, 'Samsung', 'SGS24U-256BK', 45, true, 4.7, 2340, 890, ARRAY['smartphone', 'android', 'flagship', '5g'], true::boolean),
  ('Apple iPhone 15 Pro', 'apple-iphone-15-pro', 'iPhone 15 Pro features the groundbreaking A17 Pro chip, a customizable Action Button, and the most versatile Pro camera system ever. Titanium design with USB 3 connectivity.', 'Apple flagship iPhone with A17 Pro chip and titanium design', 134900, 149900, 'Apple', 'AIPH15P-256BK', 32, true, 4.8, 3120, 1250, ARRAY['smartphone', 'ios', 'flagship', '5g'], false::boolean),
  ('Sony WH-1000XM5 Headphones', 'sony-wh-1000xm5', 'Industry-leading noise canceling with Speak-to-Chat and Auto NC Optimizer. Up to 30 hours battery life with quick charge support. Premium sound quality with DSEE Extreme upscaling.', 'Premium wireless noise-canceling headphones', 26990, 34990, 'Sony', 'SWH1000XM5', 78, true, 4.6, 1890, 567, ARRAY['headphones', 'wireless', 'noise-canceling', 'audio'], false::boolean),
  ('Dell XPS 15 Laptop', 'dell-xps-15-laptop', 'Dell XPS 15 features a stunning 15.6" OLED display, Intel Core i7-13700H processor, 32GB RAM, 1TB SSD, and NVIDIA GeForce RTX 4060 graphics. Perfect for creators and professionals.', 'Premium 15.6" laptop with OLED display and RTX 4060', 159990, 174990, 'Dell', 'DXPS15-I7-32GB', 20, true, 4.5, 678, 234, ARRAY['laptop', 'creator', 'oled', 'gaming'], false::boolean),
  ('OnePlus 12 5G', 'oneplus-12-5g', 'OnePlus 12 features Snapdragon 8 Gen 3, 50MP Hasselblad triple camera, 5400mAh battery with 100W SUPERVOOC fast charging, and a 120Hz ProXDR display. The ultimate performance flagship.', '5G flagship with Hasselblad cameras and 100W charging', 64999, 69999, 'OnePlus', 'OP12-256BK', 56, false, 4.4, 1234, 445, ARRAY['smartphone', '5g', 'android', 'flagship'], false::boolean),
  ('Samsung 55" QLED Smart TV', 'samsung-55-qled-tv', 'Samsung 55" QLED 4K Smart TV with Quantum Dot technology for 100% Color Volume. Features Motion Xcelerator Turbo+ for smooth 120fps gaming, and built-in Alexa and Google Assistant.', '55-inch QLED 4K Smart TV with Quantum Dot technology', 74999, 89999, 'Samsung', 'SSG55QN90B', 15, false, 4.3, 456, 123, ARRAY['tv', 'qled', '4k', 'smart-tv'], false::boolean),
  ('Apple AirPods Pro (3rd Gen)', 'apple-airpods-pro-3rd-gen', 'AirPods Pro (3rd generation) feature H2 chip-powered Adaptive Audio, personalized Spatial Audio, and up to 2x more Active Noise Cancellation than previous generation. MagSafe charging case included.', 'Premium wireless earbuds with adaptive noise cancellation', 24900, 26900, 'Apple', 'AAPP3G-WH', 89, true, 4.7, 2100, 890, ARRAY['earbuds', 'wireless', 'noise-canceling', 'ios'], false::boolean),
  ('Canon EOS R50 Camera', 'canon-eos-r50', 'Canon EOS R50 is a compact mirrorless camera with 24.2MP APS-C sensor, DIGIC X processor, and in-body image stabilization. Perfect for content creators with 4K video and fast autofocus.', 'Compact mirrorless camera for content creators', 54990, 62990, 'Canon', 'CEOSR50-BK', 25, false, 4.5, 567, 189, ARRAY['camera', 'mirrorless', '4k', 'photography'], false::boolean)
) AS data(name, slug, description, short_description, price, compare_price, brand, sku, stock_qty, is_feat, rating, rating_cnt, sold, tags, dummy) ON CONFLICT (slug) DO NOTHING;

-- Fashion Products
WITH cat AS (SELECT id FROM categories WHERE slug = 'fashion')
INSERT INTO products (name, slug, description, short_description, price, compare_price, brand, sku, stock_quantity, is_featured, rating_average, rating_count, sold_count, tags, category_id)
SELECT name, slug, description, short_description, price, compare_price, brand, sku, stock_qty, is_feat, rating, rating_cnt, sold, tags, cat.id FROM cat, (VALUES
  ('Nike Air Max 270', 'nike-air-max-270', 'The Nike Air Max 270 delivers unrivaled, all-day comfort. The design draws inspiration from two iconic Air Max sneakers that changed sneaker culture. Features the tallest Air unit ever made in a lifestyle shoe.', 'Iconic lifestyle sneakers with Air Max cushioning', 11995, 14995, 'Nike', 'NAM270-BK-10', 120, true, 4.5, 890, 456, ARRAY['shoes', 'sneakers', 'lifestyle', 'running'], true::boolean),
  ('Levi''s 511 Slim Jeans', 'levis-511-slim-jeans', 'Levi''s 511 Slim Jeans are cut close from hip to ankle without being skintight. Made with stretch denim for comfort and flexibility. Features the classic 5-pocket design.', 'Classic slim-fit jeans with stretch comfort', 3999, 5499, 'Levi''s', 'L511-32-32-IND', 200, false, 4.3, 1200, 789, ARRAY['jeans', 'denim', 'slim-fit', 'casual'], false::boolean),
  ('Adidas Ultraboost 22', 'adidas-ultraboost-22', 'Adidas Ultraboost 22 running shoes with Boost midsole technology for incredible energy return. Features Primeknit+ upper for adaptive support and Continental rubber outsole for superior grip.', 'Premium running shoes with Boost technology', 14999, 19999, 'Adidas', 'AUB22-WH-9', 85, true, 4.6, 678, 234, ARRAY['shoes', 'running', 'sports', 'boost'], false::boolean),
  ('H&M Cotton Blend T-Shirt Pack', 'hm-cotton-tshirt-pack', 'Pack of 3 premium cotton blend t-shirts from H&M. Comfortable, breathable fabric with a classic regular fit. Available in multiple color combinations. Machine washable.', 'Pack of 3 premium cotton t-shirts', 1299, 1999, 'H&M', 'HMT3PK-M-WHT', 350, false, 4.1, 2300, 1500, ARRAY['tshirt', 'casual', 'cotton', 'basics'], false::boolean),
  ('Woodland Leather Boots', 'woodland-leather-boots', 'Genuine leather ankle boots by Woodland with waterproof construction. Features cushioned insole for all-day comfort and anti-skid outsole. Perfect for outdoor adventures and casual wear.', 'Premium waterproof leather ankle boots', 4999, 6999, 'Woodland', 'WLB-AKL-9-BRN', 60, false, 4.4, 567, 234, ARRAY['boots', 'leather', 'outdoor', 'casual'], false::boolean),
  ('FabIndia Kurta Set', 'fabindia-kurta-set', 'Handcrafted cotton kurta with palazzo pants from FabIndia. Features traditional block print design with modern silhouette. Made from 100% pure cotton for comfort in Indian climate.', 'Traditional handcrafted cotton kurta with palazzo', 2499, 3499, 'FabIndia', 'FBI-KS-XL-BLU', 75, false, 4.5, 890, 456, ARRAY['kurta', 'ethnic', 'cotton', 'indian-wear'], false::boolean)
) AS data(name, slug, description, short_description, price, compare_price, brand, sku, stock_qty, is_feat, rating, rating_cnt, sold, tags, dummy) ON CONFLICT (slug) DO NOTHING;

-- Home & Kitchen Products
WITH cat AS (SELECT id FROM categories WHERE slug = 'home-kitchen')
INSERT INTO products (name, slug, description, short_description, price, compare_price, brand, sku, stock_quantity, is_featured, rating_average, rating_count, sold_count, tags, category_id)
SELECT name, slug, description, short_description, price, compare_price, brand, sku, stock_qty, is_feat, rating, rating_cnt, sold, tags, cat.id FROM cat, (VALUES
  ('Instant Pot Duo 7-in-1', 'instant-pot-duo-7in1', 'The Instant Pot Duo is a 7-in-1 electric pressure cooker that combines pressure cooker, slow cooker, rice cooker, steamer, saute pan, yogurt maker and warmer. 6-quart capacity serves 4-6 people.', '7-in-1 multi-use pressure cooker for Indian cooking', 8999, 11999, 'Instant Pot', 'IPD-DUO60-6L', 45, true, 4.7, 3400, 1890, ARRAY['pressure-cooker', 'kitchen', 'cooking', 'appliance'], true::boolean),
  ('Dyson V11 Cordless Vacuum', 'dyson-v11-cordless-vacuum', 'Dyson V11 cordless vacuum cleaner with 185 AW suction power and up to 60 minutes runtime. Intelligently optimizes power and run time with LCD screen. Converts to handheld for quick clean-ups.', 'Powerful cordless vacuum with 60-min runtime', 44900, 49900, 'Dyson', 'DV11-ABS-NB', 18, false, 4.6, 890, 234, ARRAY['vacuum', 'cordless', 'cleaning', 'dyson'], false::boolean),
  ('Philips Air Fryer HD9252', 'philips-air-fryer-hd9252', 'Philips Essential Air Fryer with Rapid Air Technology for up to 90% less fat frying. 1400W power, 4.1L capacity, adjustable temperature up to 200°C. Perfect for fries, snacks and grills.', '4.1L air fryer with Rapid Air technology', 7995, 10995, 'Philips', 'PAHD9252-BK', 67, true, 4.5, 2100, 1200, ARRAY['air-fryer', 'kitchen', 'healthy-cooking', 'appliance'], false::boolean),
  ('Prestige Induction Cooktop', 'prestige-induction-cooktop-2000w', 'Prestige PIC 16.0+ 2000W induction cooktop with 7 preset cooking functions. Features Feather Touch Control, automatic voltage regulation, and automatic switch-off for safety.', '2000W induction cooktop with 7 cooking modes', 2299, 3299, 'Prestige', 'PIC16-2000W', 120, false, 4.3, 1567, 890, ARRAY['induction', 'kitchen', 'cooking', 'energy-efficient'], false::boolean),
  ('IKEA KALLAX Shelf Unit', 'ikea-kallax-shelf-unit', 'IKEA KALLAX shelf unit is a versatile storage solution. Can be used as room divider, TV bench or book shelf. Compatible with KALLAX inserts for customized storage.', 'Versatile 4-cube shelf unit for any room', 6999, 8499, 'IKEA', 'IKE-KAL-4W-WHT', 35, false, 4.2, 678, 234, ARRAY['furniture', 'storage', 'shelf', 'home-decor'], false::boolean)
) AS data(name, slug, description, short_description, price, compare_price, brand, sku, stock_qty, is_feat, rating, rating_cnt, sold, tags, dummy) ON CONFLICT (slug) DO NOTHING;

-- Sports Products
WITH cat AS (SELECT id FROM categories WHERE slug = 'sports-fitness')
INSERT INTO products (name, slug, description, short_description, price, compare_price, brand, sku, stock_quantity, is_featured, rating_average, rating_count, sold_count, tags, category_id)
SELECT name, slug, description, short_description, price, compare_price, brand, sku, stock_qty, is_feat, rating, rating_cnt, sold, tags, cat.id FROM cat, (VALUES
  ('Decathlon Yoga Mat 8mm', 'decathlon-yoga-mat-8mm', 'Premium 8mm thick yoga mat by Decathlon with superior cushioning for joints. Non-slip surface with alignment markings. Made from eco-friendly TPE material. Easy to clean and carry.', 'Premium 8mm non-slip yoga mat with alignment guides', 1499, 2199, 'Decathlon', 'DCT-YM8-PUR', 180, false, 4.4, 2340, 1456, ARRAY['yoga', 'fitness', 'mat', 'exercise'], true::boolean),
  ('Fitbit Charge 6', 'fitbit-charge-6', 'Fitbit Charge 6 fitness tracker with built-in GPS, heart rate monitoring, SpO2 sensor, and Google apps. 7-day battery life, 40+ exercise modes, stress management tools.', 'Advanced fitness tracker with built-in GPS and Google apps', 14999, 17999, 'Fitbit', 'FBC6-BK-S/L', 56, true, 4.3, 890, 345, ARRAY['fitness-tracker', 'smartwatch', 'health', 'gps'], false::boolean),
  ('Boldfit Adjustable Dumbbells', 'boldfit-adjustable-dumbbells-20kg', 'Boldfit adjustable dumbbell set with quick-change weight system from 2.5kg to 20kg per dumbbell. Space-saving design replacing 8 pairs of dumbbells. Premium quality with anti-slip grip.', 'Space-saving adjustable dumbbells 2.5-20kg', 7999, 12999, 'Boldfit', 'BFA-DB-20KG', 40, false, 4.5, 567, 234, ARRAY['dumbbells', 'fitness', 'strength-training', 'home-gym'], false::boolean),
  ('Cosco Football Size 5', 'cosco-football-size5', 'Cosco Platinum Football size 5 with 32 panel construction for enhanced aerodynamics. Features butyl rubber bladder for excellent air retention. Hand-stitched for durability. FIFA approved.', 'FIFA-approved size 5 professional football', 899, 1299, 'Cosco', 'CCF-PLT-5', 150, false, 4.2, 678, 445, ARRAY['football', 'sports', 'outdoor', 'team-sports'], false::boolean)
) AS data(name, slug, description, short_description, price, compare_price, brand, sku, stock_qty, is_feat, rating, rating_cnt, sold, tags, dummy) ON CONFLICT (slug) DO NOTHING;

-- Beauty Products
WITH cat AS (SELECT id FROM categories WHERE slug = 'beauty-health')
INSERT INTO products (name, slug, description, short_description, price, compare_price, brand, sku, stock_quantity, is_featured, rating_average, rating_count, sold_count, tags, category_id)
SELECT name, slug, description, short_description, price, compare_price, brand, sku, stock_qty, is_feat, rating, rating_cnt, sold, tags, cat.id FROM cat, (VALUES
  ('L''Oreal Revitalift Serum', 'loreal-revitalift-serum', 'L''Oreal Paris Revitalift 1.5% Pure Hyaluronic Acid Serum with 2% Niacinamide. Clinically proven to plump skin, reduce wrinkles and dark spots. Suitable for all skin types including sensitive skin.', 'Hydrating serum with 1.5% Hyaluronic Acid', 899, 1299, 'L''Oreal Paris', 'LOR-RVL-HA30', 200, true, 4.5, 3400, 2100, ARRAY['skincare', 'serum', 'hyaluronic-acid', 'anti-aging'], true::boolean),
  ('Mamaearth Vitamin C Face Wash', 'mamaearth-vitamin-c-facewash', 'Mamaearth Vitamin C Face Wash with Turmeric for skin illumination. Free from harmful chemicals. Dermatologically tested formula that gently cleanses while brightening the complexion.', 'Brightening face wash with Vitamin C & Turmeric', 349, 499, 'Mamaearth', 'MME-VCFW-100', 350, false, 4.3, 5600, 3400, ARRAY['face-wash', 'skincare', 'vitamin-c', 'natural'], false::boolean),
  ('The Ordinary Niacinamide 10%', 'the-ordinary-niacinamide-10', 'The Ordinary Niacinamide 10% + Zinc 1% serum for pore-reducing and sebum-control. Reduces appearance of blemishes, oil, and congestion. Lightweight formula suitable for all skin types.', 'Pore-minimizing serum with 10% Niacinamide', 699, 999, 'The Ordinary', 'TOR-NIA10-30', 180, false, 4.6, 4500, 3200, ARRAY['skincare', 'serum', 'niacinamide', 'pores'], false::boolean),
  ('Dove Intense Repair Shampoo', 'dove-intense-repair-shampoo', 'Dove Intense Repair Shampoo with Keratin Actives for damaged hair. Nutritive serum technology repairs hair deeply. Makes hair stronger, smoother and shinier with regular use. 1L family pack.', 'Repairing shampoo with Keratin for damaged hair', 449, 599, 'Dove', 'DOV-IRSH-1L', 250, false, 4.2, 2300, 1800, ARRAY['shampoo', 'haircare', 'repair', 'keratin'], false::boolean)
) AS data(name, slug, description, short_description, price, compare_price, brand, sku, stock_qty, is_feat, rating, rating_cnt, sold, tags, dummy) ON CONFLICT (slug) DO NOTHING;

-- Books
WITH cat AS (SELECT id FROM categories WHERE slug = 'books-stationery')
INSERT INTO products (name, slug, description, short_description, price, compare_price, brand, sku, stock_quantity, is_featured, rating_average, rating_count, sold_count, tags, category_id)
SELECT name, slug, description, short_description, price, compare_price, brand, sku, stock_qty, is_feat, rating, rating_cnt, sold, tags, cat.id FROM cat, (VALUES
  ('Atomic Habits by James Clear', 'atomic-habits-james-clear', 'Atomic Habits is a revolutionary system to get 1% better every day. James Clear, one of the world''s leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.', 'The #1 bestseller on habit formation and behavior change', 499, 799, 'Penguin Random House', 'BK-AH-JC-EN', 500, true, 4.8, 12000, 8900, ARRAY['self-help', 'habits', 'productivity', 'bestseller'], true::boolean),
  ('Rich Dad Poor Dad', 'rich-dad-poor-dad', 'Rich Dad Poor Dad by Robert T. Kiyosaki tells the story of Robert''s two dads: his real father and the father of his best friend (his ''rich dad'') and the ways in which both men shaped his thoughts about money and investing.', 'Personal finance classic that changed millions of lives', 299, 499, 'Robert Kiyosaki', 'BK-RDPD-EN', 450, false, 4.6, 9800, 7800, ARRAY['finance', 'investing', 'personal-finance', 'bestseller'], false::boolean),
  ('Pilot G2 Gel Pens Pack of 10', 'pilot-g2-gel-pens-10pack', 'Pilot G2 retractable gel pens with smooth, precise ink flow. 0.7mm point size for fine writing. Long-lasting ink, comfortable grip, and retractable tip. Pack of 10 in assorted colors.', 'Smooth writing gel pens - pack of 10 assorted colors', 649, 899, 'Pilot', 'PLT-G2-10PK-AST', 300, false, 4.7, 4500, 3200, ARRAY['pens', 'stationery', 'office', 'gel-pen'], false::boolean)
) AS data(name, slug, description, short_description, price, compare_price, brand, sku, stock_qty, is_feat, rating, rating_cnt, sold, tags, dummy) ON CONFLICT (slug) DO NOTHING;

-- Insert product images for all products
INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
SELECT p.id, img.url, p.name, img.sort_order, img.sort_order = 0
FROM products p
CROSS JOIN LATERAL (VALUES
  -- Electronics
  ('samsung-galaxy-s24-ultra', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600', 0),
  ('samsung-galaxy-s24-ultra', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600', 1),
  ('apple-iphone-15-pro', 'https://images.unsplash.com/photo-1695048133142-1a20484429be?w=600', 0),
  ('apple-iphone-15-pro', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600', 1),
  ('sony-wh-1000xm5', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', 0),
  ('dell-xps-15-laptop', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600', 0),
  ('dell-xps-15-laptop', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600', 1),
  ('oneplus-12-5g', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600', 0),
  ('samsung-55-qled-tv', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600', 0),
  ('apple-airpods-pro-3rd-gen', 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600', 0),
  ('canon-eos-r50', 'https://images.unsplash.com/photo-1617694993000-1e01dbecf501?w=600', 0),
  -- Fashion
  ('nike-air-max-270', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 0),
  ('nike-air-max-270', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', 1),
  ('levis-511-slim-jeans', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', 0),
  ('adidas-ultraboost-22', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', 0),
  ('hm-cotton-tshirt-pack', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', 0),
  ('woodland-leather-boots', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600', 0),
  ('fabindia-kurta-set', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600', 0),
  -- Home & Kitchen
  ('instant-pot-duo-7in1', 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600', 0),
  ('dyson-v11-cordless-vacuum', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 0),
  ('philips-air-fryer-hd9252', 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600', 0),
  ('prestige-induction-cooktop-2000w', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600', 0),
  ('ikea-kallax-shelf-unit', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', 0),
  -- Sports
  ('decathlon-yoga-mat-8mm', 'https://images.unsplash.com/photo-1601925228209-5e35c2b4b0e4?w=600', 0),
  ('fitbit-charge-6', 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600', 0),
  ('boldfit-adjustable-dumbbells-20kg', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600', 0),
  ('cosco-football-size5', 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600', 0),
  -- Beauty
  ('loreal-revitalift-serum', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600', 0),
  ('mamaearth-vitamin-c-facewash', 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600', 0),
  ('the-ordinary-niacinamide-10', 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=600', 0),
  ('dove-intense-repair-shampoo', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600', 0),
  -- Books
  ('atomic-habits-james-clear', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600', 0),
  ('rich-dad-poor-dad', 'https://images.unsplash.com/photo-1554774853-719586f82d77?w=600', 0),
  ('pilot-g2-gel-pens-10pack', 'https://images.unsplash.com/photo-1613212785433-aa98f6b51440?w=600', 0)
) AS img(product_slug, url, sort_order)
WHERE p.slug = img.product_slug
ON CONFLICT DO NOTHING;

-- Sample reviews
WITH user1 AS (SELECT id FROM users WHERE email = 'customer@smartcart.ai' LIMIT 1)
INSERT INTO reviews (product_id, user_id, rating, title, body, is_verified_purchase, helpful_count)
SELECT p.id, u1.id, rev.rating, rev.title, rev.body, true, rev.helpful
FROM products p, user1 u1,
(VALUES
  ('samsung-galaxy-s24-ultra', 5, 'Best Android phone ever!', 'The S24 Ultra is absolutely phenomenal. The S Pen integration is seamless, camera quality is outstanding, and performance is top-notch. Battery life could be slightly better but overall it''s a beast!', 45),
  ('apple-iphone-15-pro', 5, 'Premium experience as always', 'The titanium build feels incredible in hand. Camera improvements are significant, especially in low light. The Action Button is very useful once you configure it. Highly recommend for iOS users.', 67),
  ('sony-wh-1000xm5', 5, 'Noise cancellation is magical', 'These headphones are absolutely worth every rupee. The noise cancellation is so effective that I forget I''m in a noisy office. Sound quality is rich and balanced. Build quality feels premium.', 123),
  ('nike-air-max-270', 4, 'Comfortable for all-day wear', 'Very comfortable shoes for daily use. The Air unit provides excellent cushioning. Sizing runs slightly large so I''d suggest going half a size down. Looks great with both casual and semi-formal outfits.', 34),
  ('instant-pot-duo-7in1', 5, 'Changed my cooking routine!', 'This pressure cooker has made cooking dal and rice so much faster and easier. The preset functions work perfectly. Makes incredible yogurt too! Best kitchen investment I''ve made.', 89),
  ('loreal-revitalift-serum', 4, 'Noticeably hydrated skin', 'Used this for 3 weeks and can clearly see the difference in skin hydration. The serum absorbs quickly without feeling greasy. Mild scent is pleasant. Will definitely repurchase.', 56),
  ('atomic-habits-james-clear', 5, 'Life-changing book', 'This book completely changed how I approach building habits. The 1% better concept is simple but profound. Practical examples and actionable advice. A must-read for anyone wanting to improve their life.', 234),
  ('decathlon-yoga-mat-8mm', 5, 'Perfect thickness for yoga', 'Great quality mat at an affordable price. The 8mm thickness provides excellent cushioning for knee and hip exercises. Non-slip surface is very effective even during sweaty sessions.', 78)
) AS rev(product_slug, rating, title, body, helpful)
WHERE p.slug = rev.product_slug
ON CONFLICT (product_id, user_id) DO NOTHING;

-- Sample address for demo customer
WITH u AS (SELECT id FROM users WHERE email = 'customer@smartcart.ai' LIMIT 1)
INSERT INTO addresses (user_id, label, first_name, last_name, phone, address_line1, city, state, postal_code, country, is_default)
SELECT u.id, 'Home', 'Priya', 'Sharma', '+91-9876543211', '42 Green Park Colony, Banjara Hills', 'Hyderabad', 'Telangana', '500034', 'India', true
FROM u
ON CONFLICT DO NOTHING;
