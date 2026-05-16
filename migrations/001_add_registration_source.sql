-- ============================================================
-- Migration: customers.registration_source alanı ekleme
-- Amaç: Restoranın elle eklediği müşteriler ile
--       uygulamadan kayıt olan global müşterileri ayırmak
-- ============================================================

-- 1) Kolonu ekle (eğer yoksa), eski kayıtlar 'restaurant_manual' olsun
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS registration_source TEXT DEFAULT 'restaurant_manual';

-- 2) Check Constraint: Sadece izin verilen değerler
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS chk_registration_source;

ALTER TABLE customers
ADD CONSTRAINT chk_registration_source
CHECK (registration_source IN ('restaurant_manual', 'app_user'));

-- 3) Mevcut tüm kayıtları 'restaurant_manual' yap (default zaten öyle,
--    ama explicit olarak garanti altına alalım)
UPDATE customers
SET registration_source = 'restaurant_manual'
WHERE registration_source IS NULL;

-- 4) Kolonu NOT NULL yap (artık her kaydın bir kaynağı var)
ALTER TABLE customers
ALTER COLUMN registration_source SET NOT NULL;

-- 5) (Opsiyonel) Index: Sorgu performansı için registration_source üzerine
CREATE INDEX IF NOT EXISTS idx_customers_registration_source
ON customers(registration_source);

-- 6) (Opsiyonel) Kolon yorumu
COMMENT ON COLUMN customers.registration_source IS
'restaurant_manual = Restoran panelinden elle eklendi. app_user = Alda-Gel uygulamasından kendi kaydoldu.';
