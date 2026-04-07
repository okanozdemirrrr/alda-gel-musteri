-- ============================================
-- UPSELL SİSTEMİ - VERİTABANI KURULUM
-- ============================================

-- 1. Products tablosuna related_products kolonu ekle
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS related_products TEXT[];

-- 2. Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_products_related 
ON products USING GIN (related_products);

-- ============================================
-- ÖRNEK VERİ - HAMBURGER MENÜSÜ
-- ============================================

-- Önce ürün ID'lerini alalım (örnek)
-- Not: Gerçek ID'lerinizi kullanın

-- Hamburger'e yan ürünler ekle
UPDATE products 
SET related_products = ARRAY[
  (SELECT id FROM products WHERE name ILIKE '%patates%' LIMIT 1),
  (SELECT id FROM products WHERE name ILIKE '%kola%' LIMIT 1),
  (SELECT id FROM products WHERE name ILIKE '%soğan halkası%' LIMIT 1)
]
WHERE name ILIKE '%burger%';

-- ============================================
-- ÖRNEK VERİ - PİZZA MENÜSÜ
-- ============================================

UPDATE products 
SET related_products = ARRAY[
  (SELECT id FROM products WHERE name ILIKE '%çeşnili ekmek%' LIMIT 1),
  (SELECT id FROM products WHERE name ILIKE '%ayran%' LIMIT 1),
  (SELECT id FROM products WHERE name ILIKE '%tiramisu%' LIMIT 1)
]
WHERE name ILIKE '%pizza%';

-- ============================================
-- ÖRNEK VERİ - KEBAP MENÜSÜ
-- ============================================

UPDATE products 
SET related_products = ARRAY[
  (SELECT id FROM products WHERE name ILIKE '%ayran%' LIMIT 1),
  (SELECT id FROM products WHERE name ILIKE '%turşu%' LIMIT 1),
  (SELECT id FROM products WHERE name ILIKE '%közlenmiş biber%' LIMIT 1),
  (SELECT id FROM products WHERE name ILIKE '%baklava%' LIMIT 1)
]
WHERE name ILIKE '%kebap%' OR name ILIKE '%döner%';

-- ============================================
-- ÖRNEK VERİ - KAHVE MENÜSÜ
-- ============================================

UPDATE products 
SET related_products = ARRAY[
  (SELECT id FROM products WHERE name ILIKE '%kurabiye%' LIMIT 1),
  (SELECT id FROM products WHERE name ILIKE '%kek%' LIMIT 1),
  (SELECT id FROM products WHERE name ILIKE '%croissant%' LIMIT 1)
]
WHERE name ILIKE '%kahve%' OR name ILIKE '%latte%' OR name ILIKE '%cappuccino%';

-- ============================================
-- MANUEL EKLEME ÖRNEĞİ (ID ile)
-- ============================================

-- Belirli bir ürüne ID ile yan ürün ekle
-- NOT: Aşağıdaki UUID'leri kendi gerçek UUID'lerinizle değiştirin
-- Örnek UUID formatı: '550e8400-e29b-41d4-a716-446655440000'

UPDATE products 
SET related_products = ARRAY[
  '550e8400-e29b-41d4-a716-446655440001'::uuid,  -- Patates ID'si
  '550e8400-e29b-41d4-a716-446655440002'::uuid,  -- Kola ID'si
  '550e8400-e29b-41d4-a716-446655440003'::uuid   -- Sos ID'si
]
WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid;  -- Hamburger ID'si

-- ============================================
-- TOPLU GÜNCELLEME - KATEGORİ BAZLI
-- ============================================

-- Tüm burger kategorisindeki ürünlere aynı yan ürünleri ekle
UPDATE products 
SET related_products = ARRAY[
  (SELECT id FROM products WHERE name = 'Patates Kızartması' LIMIT 1),
  (SELECT id FROM products WHERE name = 'Kola' LIMIT 1)
]
WHERE category_id = (SELECT id FROM categories WHERE name = 'Burger');

-- ============================================
-- KONTROL SORGUSU
-- ============================================

-- Yan ürünü olan ürünleri listele
SELECT 
  p.name as "Ürün",
  p.price as "Fiyat",
  array_length(p.related_products, 1) as "Yan Ürün Sayısı",
  (
    SELECT string_agg(name, ', ')
    FROM products 
    WHERE id = ANY(p.related_products)
  ) as "Yan Ürünler"
FROM products p
WHERE related_products IS NOT NULL 
  AND array_length(related_products, 1) > 0
ORDER BY p.name;

-- ============================================
-- TEMİZLEME (GEREKİRSE)
-- ============================================

-- Tüm yan ürün ilişkilerini sil
-- UPDATE products SET related_products = NULL;

-- Belirli bir üründen yan ürünleri kaldır
-- UPDATE products SET related_products = NULL WHERE id = 'uuid';

-- ============================================
-- PERFORMANS ANALİZİ
-- ============================================

-- En çok yan ürünü olan ürünler
SELECT 
  name,
  array_length(related_products, 1) as yan_urun_sayisi
FROM products
WHERE related_products IS NOT NULL
ORDER BY yan_urun_sayisi DESC
LIMIT 10;

-- Yan ürünü olmayan ürünler
SELECT 
  name,
  category_id,
  price
FROM products
WHERE related_products IS NULL 
  OR array_length(related_products, 1) = 0
ORDER BY name;
