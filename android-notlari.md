# Android WebView - Konum İzinleri Notları

> Bu doküman, Alda-Gel müşteri panelinin Android APK'sındaki (Capacitor WebView) konum yapılandırmasını açıklar.
> **Tüm değişiklikler koda entegre edilmiştir.**

---

## 1. AndroidManifest.xml İzinleri ✅ YAPILDI

`android/app/src/main/AndroidManifest.xml` dosyasına eklendi:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

## 2. Runtime Permission ✅ YAPILDI

`MainActivity.java` → `onCreate()` içinde `requestLocationPermissionIfNeeded()` çağrılıyor.
Uygulama ilk açıldığında Android'in standart **"Alda-Gel konumunuza erişmek istiyor"** pop-up'ı gösteriliyor.

- Android 6.0+ (API 23) için `ActivityCompat.requestPermissions()` kullanılıyor.
- İzin verildiğinde `onRequestPermissionsResult()` callback'i tetikleniyor ve WebView köprüsü yeniden kuruluyor.

## 3. WebChromeClient Köprüsü ✅ YAPILDI

`MainActivity.java` → `onResume()` içinde `setupGeolocationBridge()` çağrılıyor.

- `getBridge().getWebView()` ile Capacitor'ın WebView'ına erişiliyor.
- `setGeolocationEnabled(true)` ile konum API'si aktif ediliyor.
- `onGeolocationPermissionsShowPrompt()` override edilerek web sayfasından gelen konum isteği Android izin durumuna göre `callback.invoke(origin, true/false, false)` ile yanıtlanıyor.
- İzin verilmişse → otomatik onay. Verilmemişse → tekrar istek.

## 4. HTTPS Zorunluluğu

`navigator.geolocation` API'si yalnızca **HTTPS** üzerinden çalışır. Production URL (`musteri-nine.vercel.app`) zaten HTTPS. `capacitor.config.ts`'te `cleartext: true` var ama bu sadece HTTP fallback içindir.

## 5. Akış Özeti

```
Kullanıcı uygulamayı açar
    → onCreate(): Runtime permission pop-up
    → Kullanıcı "İzin Ver" der
    → onResume(): WebChromeClient köprüsü kurulur
    → Web sayfası navigator.geolocation.getCurrentPosition() çağırır
    → onGeolocationPermissionsShowPrompt() tetiklenir
    → Android izni zaten verilmiş → callback.invoke(origin, true, false)
    → Konum web sayfasına ulaşır ✅
```

---

**Dosyalar:**
- `android/app/src/main/AndroidManifest.xml` — izin satırları
- `android/app/src/main/java/com/mergen/aldagel/MainActivity.java` — runtime permission + WebChromeClient
