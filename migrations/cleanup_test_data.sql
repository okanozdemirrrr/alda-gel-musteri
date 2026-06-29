-- ============================================================
-- SAHTE / TEST VERİ TEMİZLEME SCRIPTİ
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- ÖNCE SELECT sorgularıyla neyin silineceğini kontrol edin,
-- sonra DELETE bloklarını çalıştırın.
-- ============================================================


-- ============================================================
-- 1. TEST / SAHTE ÜRÜNLERİ GÖRÜNTÜLE
-- ============================================================

-- a) Adında test/sahte anahtar kelimeler geçen ürünler
SELECT id, name, price, restaurant_id, created_at
FROM products
WHERE
  name ILIKE '%test%'
  OR name ILIKE '%deneme%'
  OR name ILIKE '%sahte%'
  OR name ILIKE '%fake%'
  OR name ILIKE '%dummy%'
  OR name ILIKE '%örnek%'
  OR name ILIKE '%sample%'
  OR name ILIKE '%xxx%'
  OR name ILIKE '%aaaa%'
  OR name ILIKE '%1234%'
ORDER BY created_at DESC;

-- b) Fiyatı 0 veya çok düşük olan ürünler (şüpheli)
SELECT id, name, price, restaurant_id, created_at
FROM products
WHERE price <= 0 OR price IS NULL
ORDER BY created_at DESC;

-- c) Açıklaması olmayan veya anlamsız çok kısa isimli ürünler
SELECT id, name, price, restaurant_id, created_at
FROM products
WHERE LENGTH(name) <= 2
ORDER BY created_at DESC;

-- d) Son 24 saat içinde oluşturulmuş ürünler (yeni test kayıtları?)
SELECT id, name, price, restaurant_id, created_at
FROM products
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;


-- ============================================================
-- 2. TEST / SAHTE MÜŞTERİLERİ GÖRÜNTÜLE
-- ============================================================

-- a) Test e-posta adresleriyle kayıtlı müşteriler
SELECT id, full_name, email, phone, created_at
FROM customers
WHERE
  email ILIKE '%test%'
  OR email ILIKE '%deneme%'
  OR email ILIKE '%fake%'
  OR email ILIKE '%dummy%'
  OR email ILIKE '%example.com%'
  OR email ILIKE '%mailinator%'
  OR email ILIKE '%yopmail%'
ORDER BY created_at DESC;

-- b) Adı/soyadı anlamsız olan müşteriler
SELECT id, full_name, email, phone, created_at
FROM customers
WHERE
  full_name ILIKE '%test%'
  OR full_name ILIKE '%deneme%'
  OR full_name ILIKE '%sahte%'
  OR full_name ILIKE '%fake%'
  OR full_name ILIKE '%aaa%'
  OR full_name ILIKE '%xxx%'
ORDER BY created_at DESC;


-- ============================================================
-- 3. TEST SİPARİŞLERİNİ GÖRÜNTÜLE
-- ============================================================

-- a) 0 TL tutarındaki siparişler
SELECT id, customer_id, total_amount, status, created_at
FROM orders
WHERE total_amount <= 0
ORDER BY created_at DESC;

-- b) Adı test olan müşterilere ait siparişler
SELECT o.id, o.total_amount, o.status, c.email, c.full_name, o.created_at
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE
  c.email ILIKE '%test%'
  OR c.full_name ILIKE '%test%'
  OR c.full_name ILIKE '%deneme%'
ORDER BY o.created_at DESC;


-- ============================================================
-- 4. SİLME İŞLEMLERİ
-- Dikkat: Önce SELECT ile doğrulayın, sonra yorumları kaldırın!
-- ============================================================

-- Test ürünleri sil
/*
DELETE FROM products
WHERE
  name ILIKE '%test%'
  OR name ILIKE '%deneme%'
  OR name ILIKE '%sahte%'
  OR name ILIKE '%fake%'
  OR name ILIKE '%dummy%'
  OR price <= 0;
*/

-- Test müşterilerini ve ilişkili tüm verilerini sil
-- (Önce ilişkili tabloları temizle, sonra customers'ı sil)
/*
-- Önce silinecek müşteri ID'lerini belirle
WITH test_customers AS (
  SELECT id FROM customers
  WHERE
    email ILIKE '%test%'
    OR email ILIKE '%deneme%'
    OR email ILIKE '%fake%'
    OR email ILIKE '%example.com%'
    OR email ILIKE '%mailinator%'
    OR full_name ILIKE '%test%'
    OR full_name ILIKE '%deneme%'
)
-- Siparişlerini sil
DELETE FROM orders WHERE customer_id IN (SELECT id FROM test_customers);

WITH test_customers AS (
  SELECT id FROM customers
  WHERE
    email ILIKE '%test%'
    OR email ILIKE '%deneme%'
    OR email ILIKE '%fake%'
    OR email ILIKE '%example.com%'
    OR email ILIKE '%mailinator%'
    OR full_name ILIKE '%test%'
    OR full_name ILIKE '%deneme%'
)
-- Bildirimleri sil
DELETE FROM notifications WHERE customer_id IN (SELECT id FROM test_customers);

WITH test_customers AS (
  SELECT id FROM customers
  WHERE
    email ILIKE '%test%'
    OR email ILIKE '%deneme%'
    OR email ILIKE '%fake%'
    OR email ILIKE '%example.com%'
    OR email ILIKE '%mailinator%'
    OR full_name ILIKE '%test%'
    OR full_name ILIKE '%deneme%'
)
-- Değerlendirmeleri sil
DELETE FROM reviews WHERE customer_id IN (SELECT id FROM test_customers);

-- Son olarak müşteri kaydını sil
DELETE FROM customers
WHERE
  email ILIKE '%test%'
  OR email ILIKE '%deneme%'
  OR email ILIKE '%fake%'
  OR email ILIKE '%example.com%'
  OR email ILIKE '%mailinator%'
  OR full_name ILIKE '%test%'
  OR full_name ILIKE '%deneme%';
*/


-- ============================================================
-- 5. ÖZET / SAYIM SORGUSU
-- Her tabloda kaç test kaydı var?
-- ============================================================

SELECT
  'products'     AS tablo,
  COUNT(*)       AS test_kayit_sayisi
FROM products
WHERE name ILIKE '%test%' OR name ILIKE '%deneme%' OR name ILIKE '%fake%' OR price <= 0

UNION ALL

SELECT
  'customers'    AS tablo,
  COUNT(*)       AS test_kayit_sayisi
FROM customers
WHERE email ILIKE '%test%' OR email ILIKE '%deneme%' OR email ILIKE '%example.com%'
  OR full_name ILIKE '%test%' OR full_name ILIKE '%deneme%'

UNION ALL

SELECT
  'orders'       AS tablo,
  COUNT(*)       AS test_kayit_sayisi
FROM orders
WHERE total_amount <= 0;
