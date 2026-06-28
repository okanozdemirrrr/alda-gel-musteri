'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, FileText, User, Clock, Wallet } from 'lucide-react'
import { calculateDistance, formatDistance } from '@/app/lib/distanceUtils'
import { fetchUserAddressCoordinates } from '@/app/lib/addressService'
import AddressModal from '../components/AddressModal'
import NotificationBell from '../components/NotificationBell'
import { RestaurantListSkeleton } from '../components/Skeleton'
import StableImage from '../components/StableImage'
import { isMobile } from '../lib/platform'

interface Restaurant {
  id: string
  name: string
  logo_url?: string
  cover_image_url?: string
  delivery_fee?: number
  min_order_amount?: number
  rating?: number
  estimated_delivery_time?: string
  categories?: string[]
  is_open?: boolean
  is_active?: boolean
  has_campaign?: boolean
  latitude?: number
  longitude?: number
}

const CATEGORIES = [
  { name: 'Tümü', icon: '🍽️' },
  { name: 'Burger', icon: '🍔' },
  { name: 'Döner', icon: '🥙' },
  { name: 'Tavuk', icon: '🍗' },
  { name: 'Kebap', icon: '🍖' },
  { name: 'Pizza', icon: '🍕' },
  { name: 'Tantuni', icon: '🌯' },
  { name: 'Çiğköfte', icon: '�' },
  { name: 'Ev Yemekleri', icon: '🥘' },
  { name: 'Pide', icon: '🫓' },
  { name: 'Lahmacun', icon: '🫔' },
  { name: 'Izgara', icon: '🥩' }
]

const MAX_DISTANCE_METERS = 10000 // 10 km

const STORE_REVIEW_EMAIL = 'review@aldagel.com'
// 19 Mayıs, Samsun — Apple inceleme cihazının varsayılan konumu
const APPLE_TEST_LAT = 41.492892
const APPLE_TEST_LNG = 36.081592

export default function RestoranlarPage() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAppleTestAccount, setIsAppleTestAccount] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [customerLat, setCustomerLat] = useState<number | null>(null)
  const [customerLng, setCustomerLng] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('Tümü')
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const name = localStorage.getItem('customer_name')
    const address = localStorage.getItem('customer_address')

    const customerId = localStorage.getItem('customer_id')
    setIsLoggedIn(!!customerId)
    setCustomerName(name || '')
    setSelectedAddress(address || '')

    // Apple test hesabı kontrolü — mesafe filtresini bypass etmek için
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email === STORE_REVIEW_EMAIL) {
        setIsAppleTestAccount(true)
        // Test hesabı için koordinatları doğrudan Samsun 19 Mayıs'a sabitle
        setCustomerLat(APPLE_TEST_LAT)
        setCustomerLng(APPLE_TEST_LNG)
      } else {
        fetchCustomerLocation()
      }
    })

    fetchRestaurants()

    const interval = setInterval(() => {
      fetchRestaurants()
    }, 30000)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  // Menü dışına tıklama kontrolü
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const fetchCustomerLocation = async () => {
    try {
      const data = await fetchUserAddressCoordinates()

      if (data?.latitude && data?.longitude) {
        setCustomerLat(data.latitude)
        setCustomerLng(data.longitude)
      } else {
        // Varsayılan: Samsun 19 Mayıs
        setCustomerLat(41.492892)
        setCustomerLng(36.081592)
      }
    } catch (error) {
      console.error('Müşteri konumu alınamadı:', error)
      // Varsayılan konum
      setCustomerLat(41.492892)
      setCustomerLng(36.081592)
    }
  }

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name')

      if (error) throw error
      setRestaurants(data || [])
    } catch (error) {
      console.error('Restoranlar yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mesafe ve kategori filtreleme
  const filteredRestaurants = useMemo(() => {
    // Apple test hesabı: mesafe/konum filtresi tamamen devre dışı — tüm restoranlar görünür
    if (isAppleTestAccount) {
      return restaurants
        .map(r => ({ ...r, distance: 0 }))
        .filter(restaurant => {
          if (selectedCategory !== 'Tümü') {
            const cats = restaurant.categories || []
            if (!cats.includes(selectedCategory)) return false
          }
          return true
        })
        .sort((a, b) => {
          if (a.is_open && !b.is_open) return -1
          if (!a.is_open && b.is_open) return 1
          return 0
        })
    }

    if (!customerLat || !customerLng) return restaurants

    return restaurants
      .map(restaurant => {
        if (!restaurant.latitude || !restaurant.longitude) {
          return { ...restaurant, distance: 0 }
        }

        const distance = calculateDistance(
          customerLat,
          customerLng,
          restaurant.latitude,
          restaurant.longitude
        )

        return { ...restaurant, distance }
      })
      .filter(restaurant => {
        // 10 km sınırı (sadece normal kullanıcılar için)
        if (restaurant.distance > MAX_DISTANCE_METERS) return false

        // Kategori filtresi
        if (selectedCategory !== 'Tümü') {
          const cats = restaurant.categories || []
          if (!cats.includes(selectedCategory)) return false
        }

        return true
      })
      .sort((a, b) => {
        if (a.is_open && !b.is_open) return -1
        if (!a.is_open && b.is_open) return 1
        return a.distance - b.distance
      })
  }, [restaurants, customerLat, customerLng, selectedCategory, isAppleTestAccount])

  // Açık ve kapalı restoranları ayır (is_active kontrolü de ekle)
  const openRestaurants = filteredRestaurants.filter(r => r.is_open !== false && r.is_active !== false)
  const closedRestaurants = filteredRestaurants.filter(r => r.is_open === false || r.is_active === false)

  const handleLogout = () => {
    localStorage.removeItem('customer_id')
    localStorage.removeItem('customer_name')
    localStorage.removeItem('customer_address')
    router.push('/')
  }

  const handleAddressSelect = (address: string) => {
    setSelectedAddress(address)
    setShowAddressModal(false)
    // Sayfayı yenile (yeni adrese göre restoranları filtrele)
    window.location.reload()
  }

  if (loading) {
    return <RestaurantListSkeleton />
  }

  return (
    <div className="app-page bg-white">
      {/* Header */}
      <header 
        className="bg-white border-b border-[#e8e8e8] sticky top-0 z-50"
        style={{
          paddingTop: isMobile() ? 'max(env(safe-area-inset-top), 8px)' : '0',
          paddingLeft: isMobile() ? 'max(env(safe-area-inset-left), 12px)' : '0',
          paddingRight: isMobile() ? 'max(env(safe-area-inset-right), 12px)' : '0'
        }}
      >
        {isMobile() ? (
          // Mobil Header - Tek satır ultra kompakt
          <div className="w-full px-3 py-2">
            <div className="flex items-center justify-between gap-1.5 w-full">
              {/* Sol: Logo + Adres */}
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <button
                  onClick={() => router.push('/')}
                  className="flex-shrink-0 flex items-center"
                >
                  <Image
                    src="/logo.png"
                    alt="Alda-Gel Logo"
                    width={102}
                    height={34}
                    className="object-contain w-[54px] md:w-[68px] h-auto"
                    priority
                  />
                </button>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg transition-colors min-w-0 flex-1 overflow-hidden touch-press"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" className="flex-shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span className="text-[11px] font-semibold text-[#3c4043] truncate" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    {selectedAddress || 'Adres Seç'}
                  </span>
                </button>
              </div>

              {/* Sağ: Kullanıcı + Menü + Bildirim */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isLoggedIn ? (
                  <>
                    {/* Kullanıcı Avatar */}
                    <div className="w-7 h-7 bg-[#f59e0b] rounded-full flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                      {customerName.charAt(0).toUpperCase() || '?'}
                    </div>
                    
                    {/* Hamburger Menu */}
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 text-gray-400 hover:text-[#f59e0b] transition-colors flex-shrink-0"
                      >
                        <Menu size={18} />
                      </button>

                      <AnimatePresence>
                        {showMenu && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full right-0 z-[60] mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                          >
                            <button
                              onClick={() => { setShowMenu(false); router.push('/siparislerim') }}
                              className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-orange-50 hover:text-amber-600 transition-colors text-left"
                            >
                              <FileText size={18} className="text-amber-500" />
                              <span className="text-[14px] font-medium">📜 Geçmiş Siparişlerim</span>
                            </button>
                            <button
                              onClick={() => { setShowMenu(false); router.push('/profil') }}
                              className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-orange-50 hover:text-amber-600 transition-colors text-left"
                            >
                              <User size={18} className="text-amber-500" />
                              <span className="text-[14px] font-medium">👤 Profilim</span>
                            </button>
                            <button
                              onClick={() => { setShowMenu(false); router.push('/yardim') }}
                              className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-orange-50 hover:text-amber-600 transition-colors text-left border-t border-gray-100"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                              </svg>
                              <span className="text-[14px] font-medium">🆘 Yardım Merkezi</span>
                            </button>
                            <button
                              onClick={() => { setShowMenu(false); handleLogout() }}
                              className="w-full px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                              </svg>
                              <span className="text-[14px] font-medium">🚪 Çıkış Yap</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Notification Bell */}
                    <NotificationBell />
                  </>
                ) : (
                  <button
                    onClick={() => router.push('/')}
                    className="px-3 py-1.5 bg-[#f59e0b] text-white text-[12px] font-bold rounded-lg hover:bg-[#d97706] transition-colors"
                  >
                    Giriş Yap
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Web Header - Orijinal tasarım
          <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex-shrink-0 flex items-center"
              >
                <Image
                  src="/logo.png"
                  alt="Alda-Gel Logo"
                  width={102}
                  height={34}
                  className="object-contain w-20 md:w-24 lg:w-[108px] h-auto"
                  priority
                />
              </button>
              
              <button
                onClick={() => setShowAddressModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#f59e0b] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="text-[14px] font-semibold text-[#3c4043]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  {selectedAddress || 'Adresini Seç'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <div className="text-[14px] text-[#6f6f6f]">
                    Hoş geldin, <span className="font-semibold text-[#3c4043]">{customerName}</span>
                  </div>
                  <div className="w-8 h-8 bg-[#f59e0b] rounded-full flex items-center justify-center text-white font-bold text-[14px]">
                    {customerName.charAt(0).toUpperCase() || '?'}
                  </div>

                  {/* Hamburger Menu */}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 text-gray-300 hover:text-[#f59e0b] transition-colors cursor-pointer"
                    >
                      <Menu size={20} />
                    </button>

                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full right-0 z-[60] mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                        >
                          <button
                            onClick={() => { setShowMenu(false); router.push('/siparislerim') }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-orange-50 hover:text-amber-600 transition-colors text-left"
                          >
                            <FileText size={18} className="text-amber-500" />
                            <span className="text-[14px] font-medium">📜 Geçmiş Siparişlerim</span>
                          </button>
                          <button
                            onClick={() => { setShowMenu(false); router.push('/profil') }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-orange-50 hover:text-amber-600 transition-colors text-left"
                          >
                            <User size={18} className="text-amber-500" />
                            <span className="text-[14px] font-medium">👤 Profilim</span>
                          </button>
                          <button
                            onClick={() => { setShowMenu(false); router.push('/yardim') }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-orange-50 hover:text-amber-600 transition-colors text-left border-t border-gray-100"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <span className="text-[14px] font-medium">🆘 Yardım Merkezi</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <NotificationBell />

                  <button
                    onClick={handleLogout}
                    className="text-[13px] text-[#6f6f6f] hover:text-[#f59e0b] transition-colors"
                  >
                    Çıkış
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push('/')}
                  className="px-5 py-2 bg-[#f59e0b] text-white text-[14px] font-bold rounded-lg hover:bg-[#d97706] transition-colors"
                >
                  Giriş Yap / Kayıt Ol
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="app-container scroll-surface gpu-layer px-3 sm:px-4 py-4 sm:py-6">
        {/* Kategori Barı */}
        <div className="mb-6 overflow-x-auto scrollbar-hide scroll-surface gpu-layer">
          <div className="flex gap-3 pb-2">
            {CATEGORIES.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex-shrink-0 px-4 py-2.5 sm:py-2 rounded-full text-[13px] sm:text-[14px] font-semibold transition-all min-h-[40px] ${
                  selectedCategory === category.name
                    ? 'bg-[#f59e0b] text-white shadow-md'
                    : 'bg-[#f7f7f7] text-[#3c4043] hover:bg-[#e8e8e8]'
                }`}
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Açık Restoranlar */}
        {openRestaurants.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[20px] font-bold text-[#3c4043] mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Restoranlar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {openRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} router={router} />
              ))}
            </div>
          </div>
        )}

        {/* Kapalı Restoranlar */}
        {closedRestaurants.length > 0 && (
          <div>
            <h2 className="text-[18px] font-bold text-[#6f6f6f] mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Geçici Olarak Kapalı
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {closedRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} router={router} isClosed />
              ))}
            </div>
          </div>
        )}

        {/* Sonuç Bulunamadı */}
        {filteredRestaurants.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-[20px] font-bold text-[#3c4043] mb-2">
              Restoran Bulunamadı
            </h3>
            <p className="text-[14px] text-[#6f6f6f]">
              Bu kategoride veya konumunuzda restoran bulunmuyor
            </p>
          </div>
        )}
      </main>
      
      {/* Address Modal */}
      {showAddressModal && (
        <AddressModal
          onClose={() => setShowAddressModal(false)}
          onAddressSelect={handleAddressSelect}
        />
      )}
    </div>
  )
}

// Restoran Kartı Komponenti
function RestaurantCard({ 
  restaurant, 
  router, 
  isClosed = false 
}: { 
  restaurant: Restaurant & { distance?: number }
  router: any
  isClosed?: boolean
}) {
  return (
    <div
      onClick={() => !isClosed && router.push(`/restoran/${restaurant.id}`)}
      className={`gpu-layer touch-press bg-white border border-[#e8e8e8] rounded-xl overflow-hidden transition-all cursor-pointer ${
        isClosed ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#f59e0b]'
      }`}
    >
      {/* Kapak Fotoğrafı */}
      <div className="relative overflow-hidden bg-gray-100">
        <StableImage
          src={restaurant.cover_image_url}
          alt={restaurant.name}
          aspectRatio="16/9"
          containerClassName="w-full"
          fallback={<span className="text-6xl">🍽️</span>}
        />
        {restaurant.has_campaign && !isClosed && (
          <div className="absolute top-3 left-3 z-10 bg-[#f59e0b] text-white px-3 py-1 rounded-full text-[11px] font-bold">
            Fırsat
          </div>
        )}
        {isClosed && (
          <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-[#3c4043] px-4 py-2 rounded-lg font-bold text-[14px]">
              Şu an Kapalı
            </span>
          </div>
        )}
      </div>

      {/* İçerik */}
      <div className="p-4">
        <h3 className="text-[16px] font-bold text-[#3c4043] mb-2 line-clamp-1" style={{ fontFamily: 'Open Sans, sans-serif' }}>
          {restaurant.name}
        </h3>

        {/* Rating ve Mesafe */}
        <div className="flex items-center gap-2 text-[13px] text-[#6f6f6f] mb-3">
          <span className="flex items-center gap-1">
            ⭐ {restaurant.rating?.toFixed(1) || '0.0'}
          </span>
          {restaurant.distance !== undefined && restaurant.distance > 0 && (
            <>
              <span>•</span>
              <span>{formatDistance(restaurant.distance)}</span>
            </>
          )}
        </div>

        {/* Badges: Teslimat Süresi ve Minimum Tutar */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* Teslimat Süresi Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 rounded-full whitespace-nowrap">
            <Clock size={12} className="text-orange-600 flex-shrink-0" strokeWidth={2.5} />
            <span className="text-xs font-medium text-gray-700">
              {restaurant.estimated_delivery_time || '20-30 dk'}
            </span>
          </div>

          {/* Minimum Tutar Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-full whitespace-nowrap">
            <Wallet size={12} className="text-gray-600 flex-shrink-0" strokeWidth={2.5} />
            <span className="text-xs font-medium text-gray-700">
              Min. {restaurant.min_order_amount || 0}₺
            </span>
          </div>
        </div>

        {/* Teslimat Ücreti */}
        {restaurant.delivery_fee !== undefined && (
          <div className="text-[12px]">
            <span className="text-[#f59e0b] font-semibold">
              {restaurant.delivery_fee === 0 ? '🎉 Ücretsiz Teslimat' : `${restaurant.delivery_fee}₺ Teslimat`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

