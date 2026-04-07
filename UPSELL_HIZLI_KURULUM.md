# 🚀 Upsell Sistemi - Hızlı Kurulum Rehberi

## Adım 1: Veritabanı Kolonunu Ekle

Supabase SQL Editor'de çalıştır:

```sql
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS related_products TEXT[];

CREATE INDEX IF NOT EXISTS idx_products_related 
ON products USING GIN (related_products);
```

## Adım 2: Ürün ID'lerini Bul

Önce hangi ürünlere yan ürün ekleyeceğinizi belirleyin:

```sql
-- Tüm ürünleri listele
SELECT id, name, price, category_id 
FROM products 
ORDER BY name;
```

## Adım 3: Yan Ürün İlişkilerini Ekle

### Yöntem 1: İsme Göre Otomatik (Önerilen)

```sql
-- Hamburger'lere otomatik yan ürün ekle
UPDATE products 
SET related_products = ARRAY[
  (SELECT id FROM products WHERE name ILIKE '%patates%' LIMIT 1),
  (SELECT id FROM products WHERE name ILIKE '%kola%' LIMIT 1),
  (SELECT id FROM products WHERE name ILIKE '%soğan halkası%' LIMIT 1)
]
WHERE name ILIKE '%burger%' 
  AND related_products IS NULL;
```

### Yöntem 2: Manuel ID ile

```sql
-- 1. Önce ID'leri kopyala
SELECT id, name FROM products WHERE name IN ('Hamburger', 'Patates', 'Kola');

-- 2. Sonuç:
-- id: 123e4567-e89b-12d3-a456-426614174000 | name: Hamburger
-- id: 123e4567-e89b-12d3-a456-426614174001 | name: Patates
-- id: 123e4567-e89b-12d3-a456-426614174002 | name: Kola

-- 3. ID'leri kullanarak güncelle
UPDATE products 
SET related_products = ARRAY[
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174002'
]
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

## Adım 4: Kontrol Et

```sql
-- Yan ürünleri kontrol et
SELECT 
  p.name as "Ana Ürün",
  p.price as "Fiyat",
  (
    SELECT string_agg(name, ', ')
    FROM products 
    WHERE id = ANY(p.related_products)
  ) as "Yan Ürünler"
FROM products p
WHERE related_products IS NOT NULL 
  AND array_length(related_products, 1) > 0;
```

## Adım 5: Test Et

1. Uygulamayı aç
2. Yan ürünü olan bir ürünü sepete ekle
3. Upsell modal açılmalı
4. Yan ürünleri ekle
5. "Sepete Git" ile devam et

## 🎯 Hızlı Örnekler

### Örnek 1: Tek Ürün

```sql
-- Cheeseburger'e patates ve kola ekle
UPDATE products 
SET related_products = ARRAY[
  (SELECT id FROM products WHERE name = 'Patates Kızartması'),
  (SELECT id FROM products WHERE name = 'Kola')
]
WHERE name = 'Cheeseburger';
```

### Örnek 2: Kategori Bazlı

```sql
-- Tüm pizza kategorisine aynı yan ürünleri ekle
UPDATE products 
SET related_products = ARRAY[
  (SELECT id FROM products WHERE name = 'Çeşnili Ekmek'),
  (SELECT id FROM products WHERE name = 'Ayran')
]
WHERE category_id = (SELECT id FROM categories WHERE name = 'Pizza');
```

### Örnek 3: Toplu Güncelleme

```sql
-- Tüm ana yemeklere içecek ekle
UPDATE products 
SET related_products = ARRAY[
  (SELECT id FROM products WHERE name = 'Kola' LIMIT 1),
  (SELECT id FROM products WHERE name = 'Ayran' LIMIT 1)
]
WHERE category_id IN (
  SELECT id FROM categories 
  WHERE name IN ('Burger', 'Pizza', 'Kebap')
);
```

## ⚠️ Önemli Notlar

1. **UUID Format**: ID'ler UUID formatında olmalı
2. **Mevcut Ürünler**: Yan ürünler mutlaka products tablosunda olmalı
3. **Görünürlük**: Yan ürünlerin `is_visible = true` olması önerilir
4. **Sepet Kontrolü**: Sistem otomatik olarak sepetteki ürünleri filtreler
5. **Performans**: Çok fazla yan ürün (5+) kullanıcı deneyimini olumsuz etkiler

## 🔍 Sorun Giderme

### Hata: "invalid input syntax for type uuid"
**Çözüm**: Gerçek UUID kullanın, örnek ID'leri değiştirin

### Upsell Modal Açılmıyor
**Kontrol Et**:
```sql
-- Ürünün yan ürünleri var mı?
SELECT name, related_products 
FROM products 
WHERE id = 'ÜRÜN-ID-BURAYA';

-- Yan ürünler görünür mü?
SELECT * FROM products 
WHERE id = ANY(
  (SELECT related_products FROM products WHERE id = 'ÜRÜN-ID-BURAYA')
);
```

### Yan Ürünler Görünmüyor
**Kontrol Et**:
- Yan ürünler `is_visible = true` mi?
- Yan ürünler zaten sepette mi?
- Restoran `is_active = true` mu?

## 📊 Önerilen Yan Ürün Stratejisi

| Ana Ürün | Yan Ürünler |
|----------|-------------|
| Hamburger | Patates, Kola, Soğan Halkası |
| Pizza | Çeşnili Ekmek, Ayran, Tatlı |
| Kebap | Ayran, Turşu, Baklava |
| Kahve | Kurabiye, Kek, Croissant |
| Makarna | Salata, Ekmek, İçecek |

## 🎉 Başarı!

Sistem kuruldu! Artık müşterileriniz ürün eklerken yan ürün önerileri görecek.
