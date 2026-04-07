-- ============================================
-- UPSELL SİSTEMİ - TEST VERİSİ
-- ============================================
-- Bu script gerçek ID'lerinizi kullanarak test verisi oluşturur

-- ============================================
-- ADIM 1: Mevcut Ürünleri Listele
-- ============================================

-- Tüm ürünleri göster (ID'leri kopyalayın)
SELECT 
  id,
  name,
  price,
  (SELECT name FROM categories WHERE id = products.category_id) as kategori
FROM products
ORDER BY name;

-- ============================================
-- ADIM 2: Otomatik İlişkilendirme (Güvenli)
-- ============================================

-- Hamburger kategorisine otomatik yan ürün ekle
DO $$
DECLARE
  patates_id uuid;
  kola_id uuid;
  sogan_id uuid;
BEGIN
  -- Yan ürün ID'lerini bul
  SELECT id INTO patates_id FROM products WHERE name ILIKE '%patates%' LIMIT 1;
  SELECT id INTO kola_id FROM products WHERE name ILIKE '%kola%' OR name ILIKE '%cola%' LIMIT 1;
  SELECT id INTO sogan_id FROM products WHERE name ILIKE '%soğan%' OR name ILIKE '%onion%' LIMIT 1;
  
  -- Hamburger'lere ekle
  IF patates_id IS NOT NULL OR kola_id IS NOT NULL THEN
    UPDATE products 
    SET related_products = ARRAY_REMOVE(ARRAY[patates_id, kola_id, sogan_id], NULL)
    WHERE (name ILIKE '%burger%' OR name ILIKE '%hamburger%')
      AND related_products IS NULL;
    
    RAISE NOTICE 'Hamburger ürünlerine yan ürünler eklendi';
  ELSE
    RAISE NOTICE 'Yan ürünler bulunamadı';
  END IF;
END $$;

-- Pizza kategorisine otomatik yan ürün ekle
DO $$
DECLARE
  ekmek_id uuid;
  ayran_id uuid;
  tatli_id uuid;
BEGIN
  SELECT id INTO ekmek_id FROM products WHERE name ILIKE '%ekmek%' OR name ILIKE '%bread%' LIMIT 1;
  SELECT id INTO ayran_id FROM products WHERE name ILIKE '%ayran%' LIMIT 1;
  SELECT id INTO tatli_id FROM products WHERE name ILIKE '%tatlı%' OR name ILIKE '%tiramisu%' LIMIT 1;
  
  IF ekmek_id IS NOT NULL OR ayran_id IS NOT NULL THEN
    UPDATE products 
    SET related_products = ARRAY_REMOVE(ARRAY[ekmek_id, ayran_id, tatli_id], NULL)
    WHERE name ILIKE '%pizza%'
      AND related_products IS NULL;
    
    RAISE NOTICE 'Pizza ürünlerine yan ürünler eklendi';
  END IF;
END $$;

-- Kebap/Döner kategorisine otomatik yan ürün ekle
DO $$
DECLARE
  ayran_id uuid;
  tursu_id uuid;
  tatli_id uuid;
BEGIN
  SELECT id INTO ayran_id FROM products WHERE name ILIKE '%ayran%' LIMIT 1;
  SELECT id INTO tursu_id FROM products WHERE name ILIKE '%turşu%' OR name ILIKE '%pickle%' LIMIT 1;
  SELECT id INTO tatli_id FROM products WHERE name ILIKE '%baklava%' OR name ILIKE '%künefe%' LIMIT 1;
  
  IF ayran_id IS NOT NULL THEN
    UPDATE products 
    SET related_products = ARRAY_REMOVE(ARRAY[ayran_id, tursu_id, tatli_id], NULL)
    WHERE (name ILIKE '%kebap%' OR name ILIKE '%döner%' OR name ILIKE '%doner%')
      AND related_products IS NULL;
    
    RAISE NOTICE 'Kebap/Döner ürünlerine yan ürünler eklendi';
  END IF;
END $$;

-- Kahve kategorisine otomatik yan ürün ekle
DO $$
DECLARE
  kurabiye_id uuid;
  kek_id uuid;
  croissant_id uuid;
BEGIN
  SELECT id INTO kurabiye_id FROM products WHERE name ILIKE '%kurabiye%' OR name ILIKE '%cookie%' LIMIT 1;
  SELECT id INTO kek_id FROM products WHERE name ILIKE '%kek%' OR name ILIKE '%cake%' LIMIT 1;
  SELECT id INTO croissant_id FROM products WHERE name ILIKE '%croissant%' LIMIT 1;
  
  IF kurabiye_id IS NOT NULL OR kek_id IS NOT NULL THEN
    UPDATE products 
    SET related_products = ARRAY_REMOVE(ARRAY[kurabiye_id, kek_id, croissant_id], NULL)
    WHERE (name ILIKE '%kahve%' OR name ILIKE '%coffee%' OR name ILIKE '%latte%' OR name ILIKE '%cappuccino%')
      AND related_products IS NULL;
    
    RAISE NOTICE 'Kahve ürünlerine yan ürünler eklendi';
  END IF;
END $$;

-- ============================================
-- ADIM 3: Sonuçları Kontrol Et
-- ============================================

-- Yan ürünlü ürünleri listele
SELECT 
  p.name as "Ana Ürün",
  p.price as "Fiyat (₺)",
  array_length(p.related_products, 1) as "Yan Ürün Sayısı",
  (
    SELECT string_agg(name || ' (' || price || '₺)', ', ')
    FROM products 
    WHERE id = ANY(p.related_products)
  ) as "Yan Ürünler"
FROM products p
WHERE related_products IS NOT NULL 
  AND array_length(related_products, 1) > 0
ORDER BY p.name;

-- İstatistikler
SELECT 
  'Toplam Ürün' as "Metrik",
  COUNT(*)::text as "Değer"
FROM products
UNION ALL
SELECT 
  'Yan Ürünlü Ürün',
  COUNT(*)::text
FROM products
WHERE related_products IS NOT NULL AND array_length(related_products, 1) > 0
UNION ALL
SELECT 
  'Yan Ürünsüz Ürün',
  COUNT(*)::text
FROM products
WHERE related_products IS NULL OR array_length(related_products, 1) = 0;

-- ============================================
-- ADIM 4: Manuel Düzenleme (Gerekirse)
-- ============================================

-- Belirli bir ürünün yan ürünlerini güncelle
-- 1. Önce ID'leri bul:
-- SELECT id, name FROM products WHERE name IN ('Ana Ürün', 'Yan Ürün 1', 'Yan Ürün 2');

-- 2. Sonra güncelle (ID'leri değiştir):
/*
UPDATE products 
SET related_products = ARRAY[
  'YAN-ÜRÜN-1-UUID-BURAYA',
  'YAN-ÜRÜN-2-UUID-BURAYA'
]
WHERE id = 'ANA-ÜRÜN-UUID-BURAYA';
*/

-- ============================================
-- TEMİZLEME (Gerekirse)
-- ============================================

-- Tüm yan ürün ilişkilerini sil
-- UPDATE products SET related_products = NULL;

-- Belirli kategorideki yan ürünleri sil
-- UPDATE products SET related_products = NULL 
-- WHERE category_id = (SELECT id FROM categories WHERE name = 'Burger');

-- ============================================
-- HATA AYIKLAMA
-- ============================================

-- Geçersiz ID'li yan ürünleri bul
SELECT 
  p.name,
  p.related_products,
  (
    SELECT COUNT(*)
    FROM unnest(p.related_products) as rp
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = rp)
  ) as "Geçersiz ID Sayısı"
FROM products p
WHERE related_products IS NOT NULL
  AND array_length(related_products, 1) > 0;

-- Görünür olmayan yan ürünleri bul
SELECT 
  p1.name as "Ana Ürün",
  p2.name as "Görünmez Yan Ürün"
FROM products p1
CROSS JOIN LATERAL unnest(p1.related_products) as rp
JOIN products p2 ON p2.id = rp
WHERE p1.related_products IS NOT NULL
  AND p2.is_visible = false;
