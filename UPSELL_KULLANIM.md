# 🎯 Birlikte İyi Gider (Upsell) Sistemi - Kullanım Kılavuzu

## 📋 Genel Bakış

Müşteri bir ürünü sepete eklediğinde, o ürünle birlikte iyi giden yan ürünleri öneren akıllı bir upsell sistemi.

## 🎨 Özellikler

✅ **Akıllı Tetikleme**: Ürün sepete eklendiğinde otomatik açılır
✅ **Şık Animasyon**: Bottom sheet tarzı yumuşak geçişler
✅ **Yatay Kaydırma**: Yan ürünler horizontal scroll ile gösterilir
✅ **Sepet Kontrolü**: Sepette olan ürünler tekrar gösterilmez
✅ **Hızlı Ekleme**: Modal kapanmadan ürün eklenebilir
✅ **Kolay Çıkış**: "Hayır, İstemiyorum" veya "Sepete Git" seçenekleri

## 🔧 Teknik Kurulum

### 1. Veritabanı Yapısı

`products` tablosuna `related_products` kolonu ekleyin:

```sql
ALTER TABLE products 
ADD COLUMN related_products TEXT[];
```

### 2. Yan Ürün Tanımlama

Supabase'de bir ürüne yan ürünler eklemek için:

```sql
-- Örnek: Hamburger'e patates kızartması ve kola ekle
UPDATE products 
SET related_products = ARRAY['product-id-1', 'product-id-2']
WHERE id = 'hamburger-product-id';
```

### 3. Örnek Veri

```sql
-- Hamburger Menü Örneği
UPDATE products 
SET related_products = ARRAY[
  'patates-kizartmasi-id',
  'kola-id',
  'soğan-halkasi-id'
]
WHERE name = 'Cheeseburger';

-- Pizza Örneği
UPDATE products 
SET related_products = ARRAY[
  'cesnili-ekmek-id',
  'ayran-id',
  'tiramisu-id'
]
WHERE name = 'Margarita Pizza';
```

## 🎯 Kullanım Senaryoları

### Senaryo 1: Hızlı Ekleme (Quick Add)
1. Müşteri menüden "Ekle" butonuna basar
2. Ürün sepete eklenir
3. Yan ürünler varsa upsell modal açılır
4. Müşteri istediği yan ürünleri ekler
5. "Sepete Git" ile devam eder

### Senaryo 2: Detaylı Ekleme (Product Modal)
1. Müşteri ürüne tıklar
2. Ürün detay modalı açılır
3. Miktar ve not ekler
4. "Sepete Ekle" butonuna basar
5. Yan ürünler varsa upsell modal açılır
6. Müşteri yan ürünleri inceler ve ekler

### Senaryo 3: Yan Ürün Yok
1. Müşteri ürünü sepete ekler
2. Yan ürün tanımlı değilse direkt sepete eklenir
3. Upsell modal açılmaz

### Senaryo 4: Yan Ürünler Sepette
1. Müşteri ürünü sepete ekler
2. Yan ürünler zaten sepetteyse
3. Upsell modal açılmaz (akıllı filtreleme)

## 🎨 UI/UX Detayları

### Modal Başlıkları
- "✨ Yanına da İyi Gider"
- Alt başlık: "[Ürün Adı] ile birlikte bunları denemek ister misiniz?"

### Ürün Kartları
- 200px genişlik
- Ürün görseli (140px yükseklik)
- Ürün adı (2 satır max)
- Açıklama (2 satır max)
- Fiyat
- "Ekle" butonu

### Butonlar
1. **Ekle Butonu**: Turuncu, ürünü sepete ekler
2. **Eklendi Durumu**: Yeşil, ✓ işareti ile 1 saniye gösterilir
3. **Sepete Git**: Ana buton, sepet sidebar'ı açar
4. **Hayır, İstemiyorum**: İkincil buton, modalı kapatır

## 📊 Performans İpuçları

### Yan Ürün Stratejileri

**Hamburger için:**
- Patates kızartması
- İçecekler (Kola, Ayran)
- Soğan halkası
- Sos çeşitleri

**Pizza için:**
- Çeşnili ekmek
- İçecekler
- Tatlılar
- Salata

**Kebap için:**
- Ayran
- Turşu
- Közlenmiş biber
- Baklava

**Kahve için:**
- Kurabiye
- Kek
- Croissant
- Su

## 🔍 Test Senaryoları

### Test 1: Temel Akış
```
1. Hamburger'i sepete ekle
2. Upsell modal açılmalı
3. Patates ve kola gösterilmeli
4. Patates ekle
5. "Eklendi" animasyonu görünmeli
6. "Sepete Git" ile sepet açılmalı
```

### Test 2: Sepet Filtresi
```
1. Kola'yı sepete ekle
2. Hamburger'i sepete ekle
3. Upsell modal açılmalı
4. Kola gösterilMEMELİ (zaten sepette)
5. Sadece patates gösterilmeli
```

### Test 3: Yan Ürün Yok
```
1. Yan ürünü olmayan bir ürün ekle
2. Upsell modal açılmamalı
3. Direkt sepete eklenip bildirim gösterilmeli
```

## 🎯 Satış Artırma İpuçları

1. **Tamamlayıcı Ürünler**: Ana ürünü tamamlayan ürünler seçin
2. **Fiyat Dengesi**: Yan ürünler ana üründen daha ucuz olmalı
3. **3-5 Ürün**: Çok fazla seçenek müşteriyi bunaltır
4. **Popüler Ürünler**: En çok satılan yan ürünleri önceliklendirin
5. **Mevsimsel**: Mevsime göre yan ürünleri güncelleyin

## 🚀 Gelecek Geliştirmeler

- [ ] AI tabanlı otomatik yan ürün önerisi
- [ ] Müşteri geçmişine göre kişiselleştirme
- [ ] A/B test desteği
- [ ] Analitik dashboard (conversion rate)
- [ ] Combo/paket indirimleri
- [ ] "Sık birlikte alınanlar" önerisi

## 📞 Destek

Sorularınız için: support@aldagel.com
