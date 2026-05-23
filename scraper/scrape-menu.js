/**
 * Alda-Gel Menü Scraper
 * ─────────────────────
 * Trendyol Yemek veya Yemeksepeti restoran linkinden
 * ürünleri çekip JSON dosyasına kaydeder.
 *
 * Kullanım:
 *   node scrape-menu.js "https://www.trendyolyemek.com/restaurants/xxx"
 *   node scrape-menu.js "https://www.yemeksepeti.com/restaurant/xxx"
 *
 * Gereksinimler:
 *   npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs')
const path = require('path')

puppeteer.use(StealthPlugin())

// ═══════════════════════════════════════════════════════════════
// KONFİGÜRASYON
// ═══════════════════════════════════════════════════════════════
const CONFIG = {
  headless: true,           // false yaparak tarayıcıyı görebilirsin
  scrollDelay: 800,         // Her scroll arası bekleme (ms)
  scrollStep: 400,          // Piksel cinsinden scroll adımı
  pageTimeout: 60000,       // Sayfa yükleme zaman aşımı
  outputDir: path.join(__dirname, 'output')
}

// ═══════════════════════════════════════════════════════════════
// ANA FONKSİYON
// ═══════════════════════════════════════════════════════════════
async function scrapeMenu(url) {
  if (!url) {
    console.error('❌ Kullanım: node scrape-menu.js <URL>')
    process.exit(1)
  }

  console.log(`\n🔍 Hedef URL: ${url}`)
  console.log('─'.repeat(60))

  let browser
  try {
    // 1) Tarayıcıyı başlat
    browser = await puppeteer.launch({
      headless: CONFIG.headless ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080'
      ]
    })

    const page = await browser.newPage()

    // Bot tespitine karşı ek önlemler
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    // 2) Sayfaya git
    console.log('📄 Sayfa yükleniyor...')
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: CONFIG.pageTimeout
    })

    // Sayfa yüklendikten sonra ekstra bekleme (JS render)
    await sleep(3000)

    // 3) Lazy loading için sayfayı tamamen kaydır
    console.log('📜 Sayfa kaydırılıyor (lazy load tetikleme)...')
    await autoScroll(page)

    // 4) Platforma göre veri çek
    console.log('🧲 Veriler ayıklanıyor...')
    let products = []

    if (url.includes('trendyol')) {
      products = await extractTrendyolYemek(page)
    } else if (url.includes('yemeksepeti')) {
      products = await extractYemeksepeti(page)
    } else {
      // Genel amaçlı çıkarım
      products = await extractGeneric(page)
    }

    console.log(`✅ ${products.length} ürün bulundu!`)

    // 5) JSON dosyasına kaydet
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true })
    }

    const timestamp = Date.now()
    const outputFile = path.join(CONFIG.outputDir, `menu_${timestamp}.json`)

    const output = {
      source_url: url,
      scraped_at: new Date().toISOString(),
      total_products: products.length,
      products
    }

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf8')
    console.log(`💾 Kaydedildi: ${outputFile}`)
    console.log('─'.repeat(60))

    // Özet
    const categories = [...new Set(products.map(p => p.category))]
    console.log(`\n📊 ÖZET:`)
    console.log(`   Toplam Ürün: ${products.length}`)
    console.log(`   Kategori: ${categories.length}`)
    categories.forEach(cat => {
      const count = products.filter(p => p.category === cat).length
      console.log(`     • ${cat || 'Kategorisiz'} (${count} ürün)`)
    })

    return output

  } catch (error) {
    console.error('❌ Scraping hatası:', error.message)
    throw error
  } finally {
    if (browser) await browser.close()
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTO SCROLL — Lazy loading tetikleyici
// ═══════════════════════════════════════════════════════════════
async function autoScroll(page) {
  await page.evaluate(async (config) => {
    await new Promise((resolve) => {
      let totalHeight = 0
      const distance = config.scrollStep
      const delay = config.scrollDelay

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance

        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          // En üste dön (bazı siteler üstteki kategorileri gizler)
          window.scrollTo(0, 0)
          resolve()
        }
      }, delay)
    })
  }, { scrollStep: CONFIG.scrollStep, scrollDelay: CONFIG.scrollDelay })

  // Scroll bittikten sonra resimlerin yüklenmesini bekle
  await sleep(2000)
}

// ═══════════════════════════════════════════════════════════════
// TRENDYOL YEMEK EXTRACTOR
// ═══════════════════════════════════════════════════════════════
async function extractTrendyolYemek(page) {
  return await page.evaluate(() => {
    const products = []
    let currentCategory = ''

    // Trendyol Yemek yapısı: kategori başlıkları + ürün kartları
    const allElements = document.querySelectorAll(
      '[class*="category-title"], [class*="product-card"], [class*="menu-item"], h2, h3, [data-testid]'
    )

    // Kategori başlıklarını ve ürünleri sırayla tara
    const sections = document.querySelectorAll('[class*="category"], [class*="menu-section"], section')

    sections.forEach(section => {
      // Kategori başlığını bul
      const heading = section.querySelector('h2, h3, [class*="title"], [class*="header"]')
      if (heading) {
        currentCategory = heading.innerText.trim()
      }

      // Ürün kartlarını bul
      const cards = section.querySelectorAll('[class*="product"], [class*="item"], [class*="card"]')
      cards.forEach(card => {
        const nameEl = card.querySelector('h3, h4, [class*="name"], [class*="title"]')
        const descEl = card.querySelector('p, [class*="desc"], [class*="description"], [class*="content"]')
        const priceEl = card.querySelector('[class*="price"], [class*="amount"], span[class*="₺"]')
        const imgEl = card.querySelector('img')

        const name = nameEl?.innerText?.trim()
        if (!name) return // İsimsiz öğeyi atla

        // Fiyatı sayıya çevir
        let price = 0
        if (priceEl) {
          const priceText = priceEl.innerText.replace(/[^\d.,]/g, '').replace(',', '.')
          price = parseFloat(priceText) || 0
        }

        // Resim URL'si
        let imageUrl = ''
        if (imgEl) {
          imageUrl = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-original') || ''
        }
        // Background image fallback
        if (!imageUrl) {
          const bgEl = card.querySelector('[style*="background"]')
          if (bgEl) {
            const match = bgEl.style.backgroundImage.match(/url\(["']?(.+?)["']?\)/)
            if (match) imageUrl = match[1]
          }
        }

        products.push({
          name,
          description: descEl?.innerText?.trim() || '',
          price,
          image_url: imageUrl,
          category: currentCategory
        })
      })
    })

    // Eğer section-based yaklaşım boş döndüyse, flat yaklaşım dene
    if (products.length === 0) {
      const allCards = document.querySelectorAll('[class*="product"], [class*="menu-item"]')
      allCards.forEach(card => {
        const nameEl = card.querySelector('h3, h4, [class*="name"]')
        const priceEl = card.querySelector('[class*="price"]')
        const imgEl = card.querySelector('img')
        const descEl = card.querySelector('p, [class*="desc"]')

        const name = nameEl?.innerText?.trim()
        if (!name) return

        let price = 0
        if (priceEl) {
          price = parseFloat(priceEl.innerText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
        }

        products.push({
          name,
          description: descEl?.innerText?.trim() || '',
          price,
          image_url: imgEl?.src || '',
          category: ''
        })
      })
    }

    return products
  })
}

// ═══════════════════════════════════════════════════════════════
// YEMEKSEPETİ EXTRACTOR
// ═══════════════════════════════════════════════════════════════
async function extractYemeksepeti(page) {
  return await page.evaluate(() => {
    const products = []
    let currentCategory = ''

    // Yemeksepeti: kategori grupları içinde ürünler
    const categoryGroups = document.querySelectorAll(
      '[class*="menu-category"], [class*="category-group"], [data-testid*="category"]'
    )

    if (categoryGroups.length > 0) {
      categoryGroups.forEach(group => {
        const heading = group.querySelector('h2, h3, [class*="category-name"], [class*="title"]')
        if (heading) currentCategory = heading.innerText.trim()

        const items = group.querySelectorAll('[class*="product"], [class*="item"], [class*="dish"]')
        items.forEach(item => {
          const nameEl = item.querySelector('h3, h4, [class*="name"], [class*="title"]')
          const descEl = item.querySelector('[class*="desc"], [class*="info"], p')
          const priceEl = item.querySelector('[class*="price"], [class*="amount"]')
          const imgEl = item.querySelector('img')

          const name = nameEl?.innerText?.trim()
          if (!name) return

          let price = 0
          if (priceEl) {
            price = parseFloat(priceEl.innerText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
          }

          let imageUrl = imgEl?.src || imgEl?.getAttribute('data-src') || ''

          products.push({
            name,
            description: descEl?.innerText?.trim() || '',
            price,
            image_url: imageUrl,
            category: currentCategory
          })
        })
      })
    }

    // Fallback: genel DOM tarama
    if (products.length === 0) {
      const headings = document.querySelectorAll('h2, h3')
      headings.forEach(heading => {
        const cat = heading.innerText.trim()
        let sibling = heading.nextElementSibling

        while (sibling && !['H2', 'H3'].includes(sibling.tagName)) {
          const nameEl = sibling.querySelector('[class*="name"], h4, strong')
          const priceEl = sibling.querySelector('[class*="price"], [class*="₺"]')
          const imgEl = sibling.querySelector('img')
          const descEl = sibling.querySelector('[class*="desc"], p')

          const name = nameEl?.innerText?.trim()
          if (name) {
            let price = 0
            if (priceEl) {
              price = parseFloat(priceEl.innerText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
            }

            products.push({
              name,
              description: descEl?.innerText?.trim() || '',
              price,
              image_url: imgEl?.src || '',
              category: cat
            })
          }
          sibling = sibling.nextElementSibling
        }
      })
    }

    return products
  })
}

// ═══════════════════════════════════════════════════════════════
// GENERİK EXTRACTOR (Diğer siteler için)
// ═══════════════════════════════════════════════════════════════
async function extractGeneric(page) {
  return await page.evaluate(() => {
    const products = []

    // Sayfadaki tüm olası ürün kartlarını bul
    const cards = document.querySelectorAll(
      '[class*="product"], [class*="item"], [class*="card"], [class*="menu"], article'
    )

    cards.forEach(card => {
      const nameEl = card.querySelector('h2, h3, h4, [class*="name"], [class*="title"]')
      const priceEl = card.querySelector('[class*="price"], [class*="amount"]')
      const imgEl = card.querySelector('img')
      const descEl = card.querySelector('p, [class*="desc"]')

      const name = nameEl?.innerText?.trim()
      if (!name || name.length > 100) return // Çok uzun başlıkları atla

      let price = 0
      if (priceEl) {
        price = parseFloat(priceEl.innerText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
      }

      if (price === 0) return // Fiyatsız öğeleri atla

      products.push({
        name,
        description: descEl?.innerText?.trim() || '',
        price,
        image_url: imgEl?.src || '',
        category: ''
      })
    })

    return products
  })
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE STORAGE YÜKLEME (Şablon)
// ═══════════════════════════════════════════════════════════════
/**
 * ⚠️ SUPABASE DEPOLAMA UYARISI
 * ─────────────────────────────
 * Çekilen resim URL'leri doğrudan kullanılmamalıdır!
 * Trendyol/Yemeksepeti CDN linkleri zamanla kırılır veya erişim engellenir.
 *
 * Uygulama akışı:
 * 1. Yukarıdaki JSON çıktısından her ürünün image_url'sini al
 * 2. Her resmi bilgisayara indir (fetch/axios ile)
 * 3. İndirilen dosyayı Supabase Storage bucket'ına yükle
 * 4. Supabase'den dönen public URL'yi JSON'daki image_url ile değiştir
 * 5. Güncellenmiş JSON'ı Supabase products tablosuna INSERT et
 *
 * Örnek:
 *   const { data } = await supabase.storage
 *     .from('product-images')
 *     .upload(`restaurants/${restaurantId}/${fileName}`, fileBuffer, {
 *       contentType: 'image/webp',
 *       upsert: true
 *     })
 *   const publicUrl = supabase.storage
 *     .from('product-images')
 *     .getPublicUrl(data.path).data.publicUrl
 */

async function uploadImagesToSupabase(products, restaurantId) {
  // Bu fonksiyon ileride aktif edilecek
  console.log('⚠️  Resim yükleme henüz aktif değil. JSON\'daki URL\'ler kaynak site URL\'leridir.')
  console.log('    Supabase Storage\'a yüklemek için bu fonksiyonu tamamlayın.')
  return products
}

// ═══════════════════════════════════════════════════════════════
// YARDIMCI
// ═══════════════════════════════════════════════════════════════
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ═══════════════════════════════════════════════════════════════
// ÇALIŞTIR
// ═══════════════════════════════════════════════════════════════
const targetUrl = process.argv[2]
scrapeMenu(targetUrl)
  .then(() => {
    console.log('\n✅ Scraping tamamlandı!\n')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n💥 Fatal:', err.message)
    process.exit(1)
  })
