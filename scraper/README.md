# Alda-Gel Menü Scraper

Trendyol Yemek veya Yemeksepeti restoran linkinden ürün menüsünü kazıyıp JSON'a aktarır.

## Kurulum

```bash
cd scraper
npm install
```

## Kullanım

```bash
# Trendyol Yemek
node scrape-menu.js "https://www.trendyolyemek.com/restaurants/restoran-adi/..."

# Yemeksepeti
node scrape-menu.js "https://www.yemeksepeti.com/restaurant/restoran-adi/..."
```

## Çıktı

`scraper/output/menu_<timestamp>.json` dosyasına kaydedilir:

```json
{
  "source_url": "...",
  "scraped_at": "2026-05-23T...",
  "total_products": 42,
  "products": [
    {
      "name": "Karışık Pizza",
      "description": "Sucuk, sosis, mantar, biber",
      "price": 189.90,
      "image_url": "https://...",
      "category": "Pizzalar"
    }
  ]
}
```

## Notlar

- **Stealth Plugin**: Cloudflare/bot korumasını aşmak için `puppeteer-extra-plugin-stealth` kullanılır.
- **Auto Scroll**: Lazy loading resimleri tetiklemek için sayfa otomatik kaydırılır.
- **Resim URL'leri**: Doğrudan kullanılmamalıdır! Supabase Storage'a yüklenip oradan servis edilmelidir.

## Sonraki Adım

JSON çıktısını aldıktan sonra:
1. Resimleri bilgisayara indir
2. Supabase Storage `product-images` bucket'ına yükle
3. Public URL'ler ile `products` tablosuna INSERT at
