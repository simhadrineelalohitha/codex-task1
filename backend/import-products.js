/**
 * SmartCart AI — Full Excel Product Importer
 * Reads complete_product_database_3500_products.xlsx
 * Maps categories, assigns product-specific Unsplash images, imports to PostgreSQL
 */
require('dotenv').config();
const ExcelJS = require('exceljs');
const path = require('path');

// ─── Category Image Map ──────────────────────────────────────────────────────
const CATEGORY_IMAGES = {
  'Groceries': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
  'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
  'Electrical Appliances': 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400',
  'Accessories': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
  'Home & Kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  'Toys': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  'Travel': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400',
  'Beauty & Personal Care': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  'Fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
  'Baby Products': 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400',
  'Stationery & Office': 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=400',
  'Tools & Hardware': 'https://images.unsplash.com/photo-1581147036324-c17ac41bfca0?w=400',
  'Mobile & Computer Accessories': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
  'Automotive': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400',
  'Home Interior & Decor': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
  'Fitness & Sports': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400',
  'Gardening': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  'Pet Supplies': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400',
};

// ─── Subcategory → product-specific Unsplash image pool ─────────────────────
// Each subcategory has a pool of unique image IDs to avoid repeats
const SUBCATEGORY_IMAGES = {
  // Electronics
  'Wireless Earbuds':   ['photo-1590658268037-6bf12165cd8e','photo-1484704849700-f032a568e944','photo-1505740420928-5e560c06d30e','photo-1578319439584-104c94d37305','photo-1572636583399-b02a0af84f15'],
  'Bluetooth Speaker':  ['photo-1608043152269-423dbba4e7e1','photo-1545454675-3531b543be5d','photo-1507003211169-0a1dd7228f2d','photo-1589003077984-894e133dabab','photo-1558618666-fcd25c85cd64'],
  'Keyboard':           ['photo-1587829741301-dc798b83add3','photo-1541140532154-b024d705b90a','photo-1496181133206-80ce9b88a853','photo-1525547719571-a2d4ac8945e2','photo-1602080858428-57174f9431cf'],
  'Wireless Mouse':     ['photo-1527864550417-7fd91fc51a46','photo-1622483767028-3f66f32aef97','photo-1563770660941-20978e870e26','photo-1615750185825-9e3b1c1b1c2f','photo-1526406915894-7bcd65f60845'],
  'Webcam':             ['photo-1587825140708-dfaf72ae4b04','photo-1516321497487-e288fb19713f','photo-1611532736597-de2d4265fba3','photo-1593642632559-0c6d3fc62b89','photo-1569144157591-c60f3f82f137'],
  'Power Bank':         ['photo-1609091839311-d5365f9ff1c5','photo-1585771724684-38269d6639fd','photo-1603899122634-f086ca5f5ddd','photo-1610034564797-1d9f8c22e0f6','photo-1619602913604-1c9e6e9d7b34'],
  'Mobile Charger':     ['photo-1583863788434-e58a36330cf0','photo-1601999009162-2459b39386c9','photo-1585771724684-38269d6639fd','photo-1610034564797-1d9f8c22e0f6','photo-1568772585407-9361f9bf3a87'],
  'Laptop':             ['photo-1496181133206-80ce9b88a853','photo-1517336714731-489689fd1ca8','photo-1525547719571-a2d4ac8945e2','photo-1541807084-5c52b6b3adef','photo-1593642632559-0c6d3fc62b89'],
  'Smartphone':         ['photo-1511707171634-5f897ff02aa9','photo-1592750475338-74b7b21085ab','photo-1601784551446-20c9e07cdbdb','photo-1565849904461-04a58ad377e0','photo-1546027658-7aa750153465'],
  'Tablet':             ['photo-1544244015-0df4b3ffc6b0','photo-1587033411391-5d9e51cce126','photo-1561154464-82e9adf32764','photo-1468495244123-6c6c332eeece','photo-1523275335684-37898b6baf30'],
  'Laptop Sleeve':      ['photo-1553062407-98eeb64c6a62','photo-1548036328-c9fa89d128fa','photo-1491553895911-0055eca6402d','photo-1622560480605-d83c853bc5c3','photo-1553829897-fbe0e21c98ac'],
  'Cable Organizer':    ['photo-1585771724684-38269d6639fd','photo-1601765588860-c7dd566c11df','photo-1583863788434-e58a36330cf0','photo-1572635196237-14b3f281503f','photo-1603899122634-f086ca5f5ddd'],
  // Home & Kitchen
  'Water Bottle':       ['photo-1602143407151-7111542de6e8','photo-1561560052-4d80a98e7f72','photo-1586300247476-e0aacd69e10e','photo-1556909172-4c78d8d53e8b','photo-1583947215259-38e31be8751f'],
  'Storage Container':  ['photo-1558618666-fcd25c85cd64','photo-1585032226651-759b368d7246','photo-1556909172-4c78d8d53e8b','photo-1567620905732-2d1ec7ab7445','photo-1484983586685-0d85788a3bc3'],
  'Mug':                ['photo-1514228742587-6b1558fcca3d','photo-1499744937866-d7e566a20a61','photo-1567620905732-2d1ec7ab7445','photo-1495474472287-4d71bcdd2085','photo-1532323544230-7191fd51bc1b'],
  'Lunch Box':          ['photo-1567620905732-2d1ec7ab7445','photo-1568702846914-96b305d2aaeb','photo-1484983586685-0d85788a3bc3','photo-1556909172-4c78d8d53e8b','photo-1585032226651-759b368d7246'],
  'Kitchen Knife':      ['photo-1585032226651-759b368d7246','photo-1593642632559-0c6d3fc62b89','photo-1484983586685-0d85788a3bc3','photo-1547592166-23ac45744acd','photo-1567620905732-2d1ec7ab7445'],
  'Non-Stick Pan':      ['photo-1585032226651-759b368d7246','photo-1484983586685-0d85788a3bc3','photo-1556909172-4c78d8d53e8b','photo-1547592166-23ac45744acd','photo-1599579434769-0ade15ae6b64'],
  'Cutting Board':      ['photo-1547592166-23ac45744acd','photo-1484983586685-0d85788a3bc3','photo-1585032226651-759b368d7246','photo-1567620905732-2d1ec7ab7445','photo-1556909172-4c78d8d53e8b'],
  // Electrical Appliances
  'Table Fan':          ['photo-1551434678-e076c223a692','photo-1574269909862-7e1d70bb8078','photo-1558618666-fcd25c85cd64','photo-1588776814546-daab30f310ce','photo-1601996785773-ff5c6aff47d9'],
  'Induction Cooktop':  ['photo-1574269909862-7e1d70bb8078','photo-1599579434769-0ade15ae6b64','photo-1547592166-23ac45744acd','photo-1588776814546-daab30f310ce','photo-1551434678-e076c223a692'],
  'Room Heater':        ['photo-1588776814546-daab30f310ce','photo-1574269909862-7e1d70bb8078','photo-1551434678-e076c223a692','photo-1601996785773-ff5c6aff47d9','photo-1558618666-fcd25c85cd64'],
  'Rice Cooker':        ['photo-1599579434769-0ade15ae6b64','photo-1574269909862-7e1d70bb8078','photo-1547592166-23ac45744acd','photo-1588776814546-daab30f310ce','photo-1556909172-4c78d8d53e8b'],
  'Electric Kettle':    ['photo-1558618666-fcd25c85cd64','photo-1574269909862-7e1d70bb8078','photo-1551434678-e076c223a692','photo-1599579434769-0ade15ae6b64','photo-1501339847302-ac426a4a7cbb'],
  'Iron':               ['photo-1574269909862-7e1d70bb8078','photo-1588776814546-daab30f310ce','photo-1551434678-e076c223a692','photo-1556909172-4c78d8d53e8b','photo-1601996785773-ff5c6aff47d9'],
  // Fashion & Accessories
  'Wallet':             ['photo-1627123424574-724758594913','photo-1553062407-98eeb64c6a62','photo-1548036328-c9fa89d128fa','photo-1614251050889-98a3e3c3ef9c','photo-1491553895911-0055eca6402d'],
  'Belt':               ['photo-1553062407-98eeb64c6a62','photo-1627123424574-724758594913','photo-1548036328-c9fa89d128fa','photo-1491553895911-0055eca6402d','photo-1614251050889-98a3e3c3ef9c'],
  'Sunglasses':         ['photo-1511499767150-a48a237f0083','photo-1508296695146-257a814070b4','photo-1572635196237-14b3f281503f','photo-1623800042127-09eca0d5a93e','photo-1574258495973-f010dfbb5371'],
  'Backpack':           ['photo-1553062407-98eeb64c6a62','photo-1491553895911-0055eca6402d','photo-1548036328-c9fa89d128fa','photo-1622560480605-d83c853bc5c3','photo-1553829897-fbe0e21c98ac'],
  'Travel Pouch':       ['photo-1491553895911-0055eca6402d','photo-1553062407-98eeb64c6a62','photo-1622560480605-d83c853bc5c3','photo-1548036328-c9fa89d128fa','photo-1553829897-fbe0e21c98ac'],
  'Keychain':           ['photo-1563170351-be82bc888aa4','photo-1553062407-98eeb64c6a62','photo-1548036328-c9fa89d128fa','photo-1614251050889-98a3e3c3ef9c','photo-1491553895911-0055eca6402d'],
  // Groceries
  'Wheat Flour':        ['photo-1574323347407-f5e1c5a1ec21','photo-1589927986089-35812388d1f4','photo-1509440159596-0249088772ff','photo-1558618666-fcd25c85cd64','photo-1542838132-92c53300491e'],
  'Cooking Oil':        ['photo-1474979266404-7eaacbcd87c5','photo-1542838132-92c53300491e','photo-1574323347407-f5e1c5a1ec21','photo-1589927986089-35812388d1f4','photo-1509440159596-0249088772ff'],
  'Toor Dal':           ['photo-1589927986089-35812388d1f4','photo-1574323347407-f5e1c5a1ec21','photo-1542838132-92c53300491e','photo-1509440159596-0249088772ff','photo-1474979266404-7eaacbcd87c5'],
  'Basmati Rice':       ['photo-1536304447766-da0ed4ce1b73','photo-1589927986089-35812388d1f4','photo-1542838132-92c53300491e','photo-1574323347407-f5e1c5a1ec21','photo-1509440159596-0249088772ff'],
  'Coffee':             ['photo-1495474472287-4d71bcdd2085','photo-1514228742587-6b1558fcca3d','photo-1532323544230-7191fd51bc1b','photo-1567620905732-2d1ec7ab7445','photo-1483648969698-5e7dcaa3444f'],
  'Oats':               ['photo-1489824904134-891ab64532f1','photo-1574323347407-f5e1c5a1ec21','photo-1589927986089-35812388d1f4','photo-1542838132-92c53300491e','photo-1509440159596-0249088772ff'],
  'Biscuits':           ['photo-1558961363-fa8fdf82db35','photo-1542838132-92c53300491e','photo-1589927986089-35812388d1f4','photo-1474979266404-7eaacbcd87c5','photo-1509440159596-0249088772ff'],
  'Spices':             ['photo-1596040033229-a9821ebd058d','photo-1474979266404-7eaacbcd87c5','photo-1542838132-92c53300491e','photo-1589927986089-35812388d1f4','photo-1574323347407-f5e1c5a1ec21'],
  // Toys
  'Puzzle Set':         ['photo-1566576912321-d58ddd7a6088','photo-1558618666-fcd25c85cd64','photo-1515488042361-ee00e0ddd4e4','photo-1559454403-b8fb88521f11','photo-1605559424843-9073c6e102e8'],
  'Building Blocks':    ['photo-1559454403-b8fb88521f11','photo-1515488042361-ee00e0ddd4e4','photo-1566576912321-d58ddd7a6088','photo-1605559424843-9073c6e102e8','photo-1558618666-fcd25c85cd64'],
  'Remote Control Car': ['photo-1599834562135-b6fc90e642ca','photo-1558618666-fcd25c85cd64','photo-1515488042361-ee00e0ddd4e4','photo-1566576912321-d58ddd7a6088','photo-1605559424843-9073c6e102e8'],
  'Toy Musical Set':    ['photo-1515488042361-ee00e0ddd4e4','photo-1566576912321-d58ddd7a6088','photo-1559454403-b8fb88521f11','photo-1558618666-fcd25c85cd64','photo-1605559424843-9073c6e102e8'],
  'STEM Learning Kit':  ['photo-1581092921461-eab62e97a780','photo-1581092160607-ee22621dd758','photo-1566576912321-d58ddd7a6088','photo-1515488042361-ee00e0ddd4e4','photo-1605559424843-9073c6e102e8'],
  // Beauty
  'Shampoo':            ['photo-1585751119414-ef2636f8aede','photo-1596462502278-27bfdc403348','photo-1571781926291-c477ebfd024b','photo-1522337360788-8b13dee7a37e','photo-1599577180513-07b8e7871d23'],
  'Face Wash':          ['photo-1596462502278-27bfdc403348','photo-1585751119414-ef2636f8aede','photo-1571781926291-c477ebfd024b','photo-1512290923902-8a9f81dc236c','photo-1522337360788-8b13dee7a37e'],
  'Moisturizer':        ['photo-1571781926291-c477ebfd024b','photo-1596462502278-27bfdc403348','photo-1585751119414-ef2636f8aede','photo-1522337360788-8b13dee7a37e','photo-1512290923902-8a9f81dc236c'],
  'Perfume':            ['photo-1522337360788-8b13dee7a37e','photo-1596462502278-27bfdc403348','photo-1585751119414-ef2636f8aede','photo-1571781926291-c477ebfd024b','photo-1566977776052-6e61e35bf9be'],
  // Fitness
  'Yoga Mat':           ['photo-1592432678016-e910b452f9a2','photo-1571902943202-507ec2618e8f','photo-1518611012118-696072aa579a','photo-1470468969717-61d5d54fd036','photo-1517836357463-d25dfeac3438'],
  'Dumbbell':           ['photo-1571902943202-507ec2618e8f','photo-1592432678016-e910b452f9a2','photo-1517836357463-d25dfeac3438','photo-1518611012118-696072aa579a','photo-1547919307-1ecb10702e6f'],
  'Resistance Band':    ['photo-1518611012118-696072aa579a','photo-1571902943202-507ec2618e8f','photo-1592432678016-e910b452f9a2','photo-1517836357463-d25dfeac3438','photo-1547919307-1ecb10702e6f'],
  // Gardening
  'Plant Pot':          ['photo-1416879595882-3373a0480b5b','photo-1463936575829-25148e1db1b8','photo-1470058869958-2a77ade41c02','photo-1503435980610-a51f3ddfee50','photo-1466692476868-aef1dfb1e735'],
  'Seeds':              ['photo-1463936575829-25148e1db1b8','photo-1416879595882-3373a0480b5b','photo-1470058869958-2a77ade41c02','photo-1466692476868-aef1dfb1e735','photo-1503435980610-a51f3ddfee50'],
  'Gardening Gloves':   ['photo-1503435980610-a51f3ddfee50','photo-1416879595882-3373a0480b5b','photo-1463936575829-25148e1db1b8','photo-1470058869958-2a77ade41c02','photo-1466692476868-aef1dfb1e735'],
  // Pet Supplies
  'Dog Food':           ['photo-1450778869180-41d0601e046e','photo-1587300003388-59208cc962cb','photo-1586671267731-da2cf3ceeb80','photo-1548681528-6a5c45b66063','photo-1514984879728-be0aff75a6e8'],
  'Cat Food':           ['photo-1514984879728-be0aff75a6e8','photo-1450778869180-41d0601e046e','photo-1587300003388-59208cc962cb','photo-1548681528-6a5c45b66063','photo-1586671267731-da2cf3ceeb80'],
  'Pet Toy':            ['photo-1548681528-6a5c45b66063','photo-1587300003388-59208cc962cb','photo-1450778869180-41d0601e046e','photo-1514984879728-be0aff75a6e8','photo-1586671267731-da2cf3ceeb80'],
  // Stationery
  'Notebook':           ['photo-1531346878377-a5be20888e57','photo-1497032628192-86f99bcd76bc','photo-1513542789411-b6a5d4f31634','photo-1455390582262-044cdead277a','photo-1423592707957-3b212afa6733'],
  'Pen':                ['photo-1455390582262-044cdead277a','photo-1531346878377-a5be20888e57','photo-1497032628192-86f99bcd76bc','photo-1513542789411-b6a5d4f31634','photo-1423592707957-3b212afa6733'],
  // Tools
  'Screwdriver Set':    ['photo-1581147036324-c17ac41bfca0','photo-1504148455328-c376907d081c','photo-1572981779307-38b8cabb2407','photo-1609219013284-e19e1c68cffa','photo-1530124566582-a618bc2615dc'],
  'Drill':              ['photo-1504148455328-c376907d081c','photo-1581147036324-c17ac41bfca0','photo-1609219013284-e19e1c68cffa','photo-1572981779307-38b8cabb2407','photo-1530124566582-a618bc2615dc'],
  // Automotive
  'Car Charger':        ['photo-1492144534655-ae79c964c9d7','photo-1503376780353-7e6692767b70','photo-1593642632559-0c6d3fc62b89','photo-1611348524140-53c9a25263d6','photo-1578683010236-d716f9a3f461'],
  'Car Mat':            ['photo-1503376780353-7e6692767b70','photo-1492144534655-ae79c964c9d7','photo-1578683010236-d716f9a3f461','photo-1611348524140-53c9a25263d6','photo-1593642632559-0c6d3fc62b89'],
  // Baby Products
  'Baby Clothes':       ['photo-1555252333-9f8e92e65df9','photo-1522771739844-6a9f6d5f14af','photo-1503944583220-a55c47b3e10c','photo-1519689680058-324335c77eba','photo-1584634731339-252c581abfc5'],
  'Baby Bottle':        ['photo-1519689680058-324335c77eba','photo-1555252333-9f8e92e65df9','photo-1522771739844-6a9f6d5f14af','photo-1584634731339-252c581abfc5','photo-1503944583220-a55c47b3e10c'],
  'Diapers':            ['photo-1584634731339-252c581abfc5','photo-1555252333-9f8e92e65df9','photo-1519689680058-324335c77eba','photo-1522771739844-6a9f6d5f14af','photo-1503944583220-a55c47b3e10c'],
  // Home Decor
  'Wall Art':           ['photo-1586023492125-27b2c045efd7','photo-1513519245088-0e12902e5a38','photo-1555041469-a586c61ea9bc','photo-1616486338812-3dadae4b4ace','photo-1549497538-303791108851'],
  'Cushion':            ['photo-1555041469-a586c61ea9bc','photo-1586023492125-27b2c045efd7','photo-1513519245088-0e12902e5a38','photo-1616486338812-3dadae4b4ace','photo-1549497538-303791108851'],
  'Photo Frame':        ['photo-1513519245088-0e12902e5a38','photo-1586023492125-27b2c045efd7','photo-1555041469-a586c61ea9bc','photo-1616486338812-3dadae4b4ace','photo-1549497538-303791108851'],
};

// fallback pool keyed by category
const CATEGORY_FALLBACK_POOL = {
  'Electronics':               ['photo-1518770660439-4636190af475','photo-1519389950473-47ba0277781c','photo-1498049794561-7780e7231661','photo-1593642632559-0c6d3fc62b89','photo-1616486338812-3dadae4b4ace'],
  'Electrical Appliances':     ['photo-1574269909862-7e1d70bb8078','photo-1588776814546-daab30f310ce','photo-1551434678-e076c223a692','photo-1601996785773-ff5c6aff47d9','photo-1599579434769-0ade15ae6b64'],
  'Groceries':                 ['photo-1542838132-92c53300491e','photo-1474979266404-7eaacbcd87c5','photo-1509440159596-0249088772ff','photo-1589927986089-35812388d1f4','photo-1574323347407-f5e1c5a1ec21'],
  'Home & Kitchen':            ['photo-1556909172-4c78d8d53e8b','photo-1484983586685-0d85788a3bc3','photo-1567620905732-2d1ec7ab7445','photo-1547592166-23ac45744acd','photo-1585032226651-759b368d7246'],
  'Accessories':               ['photo-1553062407-98eeb64c6a62','photo-1627123424574-724758594913','photo-1548036328-c9fa89d128fa','photo-1491553895911-0055eca6402d','photo-1622560480605-d83c853bc5c3'],
  'Fashion':                   ['photo-1445205170230-053b83016050','photo-1483985988355-763728e1935b','photo-1469334031218-e382a71b716b','photo-1490481651871-ab68de25d43d','photo-1516762689617-e1cffcef479d'],
  'Toys':                      ['photo-1558618666-fcd25c85cd64','photo-1515488042361-ee00e0ddd4e4','photo-1566576912321-d58ddd7a6088','photo-1559454403-b8fb88521f11','photo-1605559424843-9073c6e102e8'],
  'Beauty & Personal Care':    ['photo-1596462502278-27bfdc403348','photo-1571781926291-c477ebfd024b','photo-1585751119414-ef2636f8aede','photo-1522337360788-8b13dee7a37e','photo-1512290923902-8a9f81dc236c'],
  'Fitness & Sports':          ['photo-1571902943202-507ec2618e8f','photo-1592432678016-e910b452f9a2','photo-1517836357463-d25dfeac3438','photo-1518611012118-696072aa579a','photo-1547919307-1ecb10702e6f'],
  'Travel':                    ['photo-1501785888041-af3ef285b470','photo-1476514525535-07fb3b4ae5f1','photo-1507608616759-54f48f0af0ee','photo-1488646953014-85cb44e25828','photo-1469854523086-cc02fe5d8800'],
  'Baby Products':             ['photo-1555252333-9f8e92e65df9','photo-1522771739844-6a9f6d5f14af','photo-1519689680058-324335c77eba','photo-1503944583220-a55c47b3e10c','photo-1584634731339-252c581abfc5'],
  'Stationery & Office':       ['photo-1497032628192-86f99bcd76bc','photo-1531346878377-a5be20888e57','photo-1455390582262-044cdead277a','photo-1513542789411-b6a5d4f31634','photo-1423592707957-3b212afa6733'],
  'Tools & Hardware':          ['photo-1581147036324-c17ac41bfca0','photo-1504148455328-c376907d081c','photo-1572981779307-38b8cabb2407','photo-1609219013284-e19e1c68cffa','photo-1530124566582-a618bc2615dc'],
  'Mobile & Computer Accessories':['photo-1585771724684-38269d6639fd','photo-1601765588860-c7dd566c11df','photo-1583863788434-e58a36330cf0','photo-1603899122634-f086ca5f5ddd','photo-1609091839311-d5365f9ff1c5'],
  'Automotive':                ['photo-1492144534655-ae79c964c9d7','photo-1503376780353-7e6692767b70','photo-1578683010236-d716f9a3f461','photo-1611348524140-53c9a25263d6','photo-1593642632559-0c6d3fc62b89'],
  'Home Interior & Decor':     ['photo-1586023492125-27b2c045efd7','photo-1513519245088-0e12902e5a38','photo-1555041469-a586c61ea9bc','photo-1616486338812-3dadae4b4ace','photo-1549497538-303791108851'],
  'Gardening':                 ['photo-1416879595882-3373a0480b5b','photo-1463936575829-25148e1db1b8','photo-1470058869958-2a77ade41c02','photo-1503435980610-a51f3ddfee50','photo-1466692476868-aef1dfb1e735'],
  'Pet Supplies':              ['photo-1450778869180-41d0601e046e','photo-1587300003388-59208cc962cb','photo-1514984879728-be0aff75a6e8','photo-1548681528-6a5c45b66063','photo-1586671267731-da2cf3ceeb80'],
};

// Track usage counters to cycle through pools and avoid repeats
const usageCounters = {};
function getImage(subcategory, category, productIndex) {
  const pool = SUBCATEGORY_IMAGES[subcategory] || CATEGORY_FALLBACK_POOL[category] || CATEGORY_FALLBACK_POOL['Electronics'];
  const key = subcategory || category;
  if (!usageCounters[key]) usageCounters[key] = 0;
  const photoId = pool[usageCounters[key] % pool.length];
  usageCounters[key]++;
  return `https://images.unsplash.com/${photoId}?w=600&q=80`;
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'string' && val.includes('T')) return val.split('T')[0];
  return null;
}

async function getCategoryId(client, name) {
  const slug = slugify(name);
  const imgUrl = CATEGORY_IMAGES[name] || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400';
  const existing = await client.query('SELECT id FROM categories WHERE slug=$1', [slug]);
  if (existing.rows.length > 0) return existing.rows[0].id;
  const res = await client.query(
    `INSERT INTO categories(name,slug,description,image_url,is_active)
     VALUES($1,$2,$3,$4,true) RETURNING id`,
    [name, slug, `Products in ${name}`, imgUrl]
  );
  return res.rows[0].id;
}

async function importProducts() {
  const { pool } = require('./config/database');
  const client = await pool.connect();
  try {
    console.log('📂 Reading Excel file...');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('C:/Users/joshi/OneDrive/Documents/LOHI/complete_product_database_3500_products.xlsx');
    const ws = wb.worksheets[0];
    
    const totalRows = ws.rowCount - 1; // exclude header
    console.log(`📊 Found ${totalRows} product rows`);

    // Pre-cache category IDs
    const categoryCache = {};

    let imported = 0, skipped = 0, failed = 0, updated = 0;
    const errors = [];

    await client.query('BEGIN');

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const get = (col) => { const v = row.getCell(col).value; return v === null || v === undefined ? null : v; };

      const productId  = get(1);
      const name       = get(2);
      const category   = get(3);
      const subcategory= get(4);
      const brand      = get(5);
      const variant    = get(6);
      const description= get(7);
      const mrp        = parseFloat(get(8)) || 0;
      const discount   = parseFloat(get(9)) || 0;
      const price      = parseFloat(get(10)) || mrp;
      const quality    = get(11);
      const rating     = parseFloat(get(12)) || 0;
      const reviewCount= parseInt(get(13)) || 0;
      const mfgDate    = toDate(get(14));
      const expiry     = toDate(get(15));
      const voltage    = get(16);
      const power      = get(17);
      const ageRange   = get(18);
      const warranty   = get(19);
      const stock      = parseInt(get(20)) || 0;
      const seller     = get(21);
      const country    = get(22);
      const returnDays = parseInt(get(23)) || 0;
      const status     = get(24);

      if (!name || !price) { skipped++; continue; }

      try {
        // Get/create category
        const catName = category || 'General';
        if (!categoryCache[catName]) {
          categoryCache[catName] = await getCategoryId(client, catName);
        }
        const categoryId = categoryCache[catName];

        // Slug: name + product ID for uniqueness
        const baseSlug = slugify(name);
        const sku = productId || `SKU-${r}`;
        const slug = `${baseSlug}-${sku.toLowerCase()}`;

        // Image
        const imageUrl = getImage(subcategory, catName, r);

        // Metadata
        const metadata = {
          variant_spec: variant,
          quality,
          manufacturing_date: mfgDate,
          expiry_date: expiry,
          voltage,
          power_rating: power,
          age_range: ageRange,
          warranty,
          seller,
          country_of_origin: country,
          return_period_days: returnDays,
          discount_percent: discount,
          original_product_id: productId,
        };

        // Stock status
        const isActive = status !== 'Discontinued';
        const isFeatured = rating >= 4.5 && reviewCount > 10000;
        const lowStockThreshold = 10;
        const stockQty = status === 'Out of Stock' ? 0 : stock;

        // Upsert: if product with this SKU exists, update; else insert
        const upsertRes = await client.query(`
          INSERT INTO products (
            name, slug, description, short_description, price, compare_price,
            category_id, brand, sku, stock_quantity, low_stock_threshold,
            is_active, is_featured, rating_average, rating_count,
            images, tags, metadata
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
          ON CONFLICT (sku) DO UPDATE SET
            name=EXCLUDED.name, price=EXCLUDED.price, compare_price=EXCLUDED.compare_price,
            stock_quantity=EXCLUDED.stock_quantity, rating_average=EXCLUDED.rating_average,
            rating_count=EXCLUDED.rating_count, is_active=EXCLUDED.is_active,
            metadata=EXCLUDED.metadata, updated_at=NOW()
          RETURNING id, (xmax = 0) AS inserted
        `, [
          name,
          slug,
          description || `${name} - ${subcategory || category}`,
          variant ? `${variant}${warranty ? ` | Warranty: ${warranty}` : ''}` : (description || '').substring(0, 200),
          price,
          mrp > price ? mrp : null,
          categoryId,
          brand,
          sku,
          stockQty,
          lowStockThreshold,
          isActive,
          isFeatured,
          Math.min(5, Math.max(0, rating)),
          reviewCount,
          JSON.stringify([{ url: imageUrl, alt_text: name, is_primary: true, sort_order: 0 }]),
          subcategory ? [slugify(subcategory), slugify(catName)] : [slugify(catName)],
          metadata,
        ]);

        const productDbId = upsertRes.rows[0].id;
        const wasInserted = upsertRes.rows[0].inserted;

        // Upsert primary image in product_images table
        await client.query(`
          INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
          VALUES ($1, $2, $3, 0, true)
          ON CONFLICT DO NOTHING
        `, [productDbId, imageUrl, name]);

        if (wasInserted) imported++;
        else updated++;

      } catch (err) {
        failed++;
        if (errors.length < 10) errors.push(`Row ${r} (${name}): ${err.message}`);
      }
    }

    await client.query('COMMIT');

    console.log('\n✅ Import complete!');
    console.log(`   Inserted: ${imported}`);
    console.log(`   Updated:  ${updated}`);
    console.log(`   Skipped:  ${skipped} (missing name/price)`);
    console.log(`   Failed:   ${failed}`);

    // Verify
    const countRes = await client.query('SELECT COUNT(*) FROM products WHERE is_active=true');
    const catCountRes = await client.query('SELECT COUNT(*) FROM categories');
    console.log(`\n📊 Database now has:`);
    console.log(`   ${countRes.rows[0].count} active products`);
    console.log(`   ${catCountRes.rows[0].count} categories`);

    if (errors.length > 0) {
      console.log('\n⚠️  Sample errors:');
      errors.forEach(e => console.log('  ', e));
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Import failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = {
  CATEGORY_IMAGES,
  CATEGORY_FALLBACK_POOL,
  SUBCATEGORY_IMAGES,
};

if (require.main === module) {
  require('./import-products-safe').main().catch((error) => {
    console.error(`Product import failed: ${error.message}`);
    process.exitCode = 1;
  });
}
