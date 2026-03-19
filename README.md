# 📱 Müşteri Paneli - Alda Gel

Bu klasör, Alda Gel uygulamasının müşteri panelinin tüm dosyalarını içerir.

## 📁 Klasör Yapısı

```
musteri/
├── lib/                          # Yardımcı kütüphaneler
│   ├── supabase.ts              # Supabase client
│   ├── addressData.ts           # Adres veritabanı
│   ├── distanceUtils.ts         # Mesafe hesaplama
│   └── platformUtils.ts         # Platform yardımcıları
│
├── context/                      # State yönetimi
│   └── CartContext.tsx          # Sepet context
│
├── components/                   # Paylaşılan componentler
│   ├── AddressModal.tsx         # Adres seçme modalı
│   ├── AuthModal.tsx            # Giriş/Kayıt modalı
│   ├── AutocompleteInput.tsx    # Otomatik tamamlama input
│   ├── DropdownSelect.tsx       # Dropdown seçici
│   ├── MapComponent.tsx         # Harita componenti
│   ├── NotificationBell.tsx     # Bildirim ikonu
│   ├── PushNotificationPrompt.tsx # Push bildirim istemi
│   └── WelcomeSplash.tsx        # Hoşgeldin ekranı
│
├── bildirimler/                  # Bildirimler sayfası
│   └── page.tsx
│
├── market/                       # Market modülü
│   ├── page.tsx                 # Market ana sayfa
│   └── [category]/              # Kategori sayfası
│       └── page.tsx
│
├── profil/                       # Profil sayfası
│   └── page.tsx
│
├── restoran/                     # Restoran modülü
│   └── [id]/                    # Restoran detay sayfası
│       ├── page.tsx             # Menü sayfası
│       └── components/
│           ├── CartSidebar.tsx  # Sepet sidebar
│           ├── ProductModal.tsx # Ürün detay modalı
│           └── ReviewsSection.tsx # Yorumlar bölümü
│
├── restoranlar/                  # Restoran listesi
│   └── page.tsx
│
├── sepet/                        # Sepet sayfası
│   └── page.tsx
│
├── siparislerim/                 # Sipariş geçmişi
│   └── page.tsx
│
├── yardim/                       # Yardım sayfası
│   └── page.tsx
│
└── page.tsx                      # Müşteri ana sayfası
```

## 🎯 Özellikler

### 🍔 Restoran Modülü
- Restoran listesi ve filtreleme
- Restoran menüsü görüntüleme
- Ürün detayları ve açıklamaları
- Sepete ürün ekleme
- Ürün notları ekleme
- Yorum görüntüleme

### 🛒 Sepet Yönetimi
- Ürün ekleme/çıkarma
- Miktar güncelleme
- Ürün notları
- Sipariş özeti
- Ödeme yöntemi seçimi

### 🏪 Market Modülü
- Kategori bazlı ürün listeleme
- Ürün arama ve filtreleme
- Sepete ekleme
- Stok durumu

### 📦 Sipariş Takibi
- Aktif siparişler
- Sipariş geçmişi
- Sipariş detayları
- Durum güncellemeleri

### 👤 Profil Yönetimi
- Kullanıcı bilgileri
- Adres yönetimi
- Sipariş geçmişi
- Ayarlar

### 🔔 Bildirimler
- Sipariş bildirimleri
- Promosyon bildirimleri
- Sistem bildirimleri

## 🔧 Kullanılan Teknolojiler

- **Next.js 15** - React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling
- **Supabase** - Backend ve veritabanı
- **Framer Motion** - Animasyonlar
- **Leaflet** - Harita
- **Lucide React** - İkonlar

## 📱 Mobil Uygulamaya Dönüştürme

Bu klasördeki tüm dosyalar bağımsız bir mobil uygulamaya dönüştürülebilir:

1. Yeni Next.js projesi oluştur
2. Bu klasörü kopyala
3. `lib/` ve `context/` klasörlerini root'a taşı
4. Import yollarını güncelle
5. Capacitor ekle
6. Android/iOS build al

Detaylı talimatlar için proje root'undaki dokümantasyona bakın.

## 🔗 Bağımlılıklar

### Internal
- `@/types/menu` - Menü tipleri
- `@/types/index` - Genel tipler

### External
- `@supabase/supabase-js` - Supabase client
- `framer-motion` - Animasyonlar
- `lucide-react` - İkonlar
- `leaflet` - Harita
- `react-leaflet` - React harita wrapper

## 🚀 Geliştirme

```bash
# Development server
npm run dev

# Production build
npm run build

# Lint
npm run lint
```

## 📝 Notlar

- Tüm sayfalar client-side rendering kullanır (`'use client'`)
- Sepet localStorage'da saklanır
- Adres bilgileri localStorage'da tutulur
- Supabase realtime ile canlı güncellemeler
- Responsive tasarım (mobil öncelikli)

## 🔐 Güvenlik

- Supabase Row Level Security (RLS) kullanılır
- Müşteri sadece kendi verilerine erişebilir
- API anahtarları environment variables'da
- XSS koruması aktif

## 🐛 Bilinen Sorunlar

Şu anda bilinen bir sorun yok.

## 📞 Destek

Herhangi bir sorun için proje sahibiyle iletişime geçin.
