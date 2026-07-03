'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { Category, Product } from '@/types/menu'
import { useCart } from '@/app/context/CartContext'
import ProductModal from './components/ProductModal'
import CartSidebar from './components/CartSidebar'
import { productHasOptionGroups } from '@/app/lib/productOptions'
import AddressModal from '../../components/AddressModal'
import ReviewsSection from './components/ReviewsSection'
import GuestLoginPrompt from '@/app/components/GuestLoginPrompt'
import { Clock, Wallet } from 'lucide-react'
import { isMobile } from '@/app/lib/platform'
import { RestaurantMenuSkeleton } from '@/app/components/Skeleton'
import StableImage from '@/app/components/StableImage'

interface Restaurant {
  id: string
  name: string
  minimum_order_value: number
  delivery_fee: number
  rating: number
  estimated_delivery_time: string
  logo_url?: string
  cover_image_url?: string
  is_active?: boolean
}

export default function RestaurantMenuPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.id as string
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCart, setShowCart] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu')
  const [averageRating, setAverageRating] = useState<number | null>(null)
  
  const { addToCart, getCartItemCount, getCartTotal, updateQuantity, cart } = useCart()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState<string>('')
  const [quickAddCheckingId, setQuickAddCheckingId] = useState<string | null>(null)
  const [addedToast, setAddedToast] = useState<string | null>(null)
  const [showGuestPrompt, setShowGuestPrompt] = useState(false)
  const scrollSpyRef = useRef(true)

  useEffect(() => {
    fetchRestaurantData()
    fetchAverageRating()
    
    const address = localStorage.getItem('customer_address')
    if (address) {
      setSelectedAddress(address)
    }

    // 30 saniyelik polling - restoran durumunu güncelle
    const interval = setInterval(() => {
      fetchRestaurantData()
    }, 30000)

    return () => clearInterval(interval)
  }, [restaurantId])

  const fetchAverageRating = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating_taste, rating_delivery')
        .eq('restaurant_id', restaurantId)

      if (error) throw error

      if (data && data.length > 0) {
        const avg = data.reduce((acc, review) => {
          return acc + (review.rating_taste + review.rating_delivery) / 2
        }, 0) / data.length
        setAverageRating(avg)
      }
    } catch (error) {
      console.error('Ortalama puan yüklenemedi:', error)
    }
  }

  const fetchRestaurantData = async () => {
    try {
      // Restoran bilgilerini çek
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single()

      if (restaurantError) throw restaurantError
      setRestaurant(restaurantData)

      // Kategorileri çek
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('display_order')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Ürünleri çek
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('display_order')

      if (productsError) throw productsError
      setProducts(productsData || [])
    } catch (error) {
      console.error('Veri yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  // Scroll Spy - aktif kategoriyi takip et
  useEffect(() => {
    if (activeTab !== 'menu' || categories.length === 0) return
    const handleScroll = () => {
      if (!scrollSpyRef.current) return
      let current = ''
      for (const cat of categories) {
        const el = document.getElementById(`category-${cat.id}`)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 160) current = cat.id
        }
      }
      if (current && current !== activeCategoryId) setActiveCategoryId(current)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeTab, categories, activeCategoryId])

  useEffect(() => {
    if (!addedToast) return
    const timer = setTimeout(() => setAddedToast(null), 2500)
    return () => clearTimeout(timer)
  }, [addedToast])

  const handleQuickAdd = async (product: Product) => {
    if (restaurant?.is_active === false || product.is_available === false) return
    if (quickAddCheckingId) return

    if (typeof window !== 'undefined' && !localStorage.getItem('customer_id')) {
      setShowGuestPrompt(true)
      return
    }

    setQuickAddCheckingId(product.id)
    try {
      const hasOptions = await productHasOptionGroups(product.id, product.option_groups)
      if (hasOptions) {
        setSelectedProduct(product)
        return
      }
      addToCart(product, 1)
      setAddedToast(product.name)
    } finally {
      setQuickAddCheckingId(null)
    }
  }

  const handleProductClick = (product: Product) => {
    if (restaurant?.is_active === false || product.is_available === false) return
    setSelectedProduct(product)
  }

  const handleAddressSelect = (address: string) => {
    setSelectedAddress(address)
    setShowAddressModal(false)
  }

  if (loading) {
    return <RestaurantMenuSkeleton />
  }

  if (!restaurant) {
    return (
      <div className="app-page bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[20px] font-bold text-[#3c4043] mb-2">Restoran bulunamadı</h2>
          <button
            onClick={() => router.back()}
            className="text-[#f59e0b] hover:underline"
          >
            Geri Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page bg-[#f7f7f7] pb-32">
      {showGuestPrompt && (
        <GuestLoginPrompt
          onClose={() => setShowGuestPrompt(false)}
          onLoginSuccess={() => {
            // Login sonrası localStorage güncellendi; sayfa yeniden render edilir
          }}
        />
      )}
      {addedToast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[70] pointer-events-none">
          <div className="flex items-center gap-2.5 bg-[#1f2937] text-white text-[13px] font-medium px-4 py-3 rounded-xl shadow-2xl">
            <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            Sepete Eklendi
          </div>
        </div>
      )}

      {/* Hero Section - Cover Image + Logo */}
      {/* overflow-visible burada zorunlu: logo -bottom-N ile banner dışına taşıyor */}
      <div className={`relative w-full gpu-layer overflow-visible ${isMobile() ? 'h-[200px]' : 'h-[280px]'} bg-gradient-to-br from-[#fef3c7] to-[#fde68a]`}>
        {/* Cover görseli ayrı overflow-hidden container içinde */}
        <div className="absolute inset-0 overflow-hidden">
          <StableImage
            src={restaurant.cover_image_url}
            alt={restaurant.name}
            fixedHeight={isMobile() ? 200 : 280}
            containerClassName="w-full"
            fallback={<div className={`w-full h-full flex items-center justify-center ${isMobile() ? 'text-6xl' : 'text-8xl'}`}>🍽️</div>}
            priority
          />
        </div>{/* /cover overflow-hidden */}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
        
        {/* Kapalı Overlay */}
        {restaurant.is_active === false && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center px-4">
              <span className={`bg-white text-[#3c4043] ${isMobile() ? 'px-4 py-2 text-[14px]' : 'px-6 py-3 text-[18px]'} rounded-xl font-bold shadow-2xl`}>
                🔒 Restoran Şu An Kapalı
              </span>
            </div>
          </div>
        )}
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className={`absolute ${isMobile() ? 'top-2 left-2 w-11 h-11 min-w-[44px] min-h-[44px]' : 'top-4 left-4 w-10 h-10'} bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#3c4043] hover:bg-white transition-all shadow-lg`}
          style={{
            top: isMobile() ? 'max(8px, env(safe-area-inset-top))' : undefined,
            left: isMobile() ? 'max(8px, env(safe-area-inset-left))' : undefined,
          }}
        >
          <svg width={isMobile() ? '18' : '20'} height={isMobile() ? '18' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        {/* Cart Button - Fixed Floating */}
        <button
          onClick={() => setShowCart(true)}
          className={`fixed lg:hidden ${isMobile() ? 'top-2 right-2 px-3 py-2.5 min-h-[44px] text-[12px]' : 'top-4 right-4 px-5 py-2.5 text-[14px]'} z-50 bg-[#f59e0b] text-white rounded-full font-bold hover:bg-[#d97706] transition-all shadow-lg flex items-center gap-1.5`}
          style={{
            top: isMobile() ? 'max(8px, env(safe-area-inset-top))' : undefined,
            right: isMobile() ? 'max(8px, env(safe-area-inset-right))' : undefined,
          }}
        >
          <svg width={isMobile() ? '16' : '18'} height={isMobile() ? '16' : '18'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {getCartItemCount() > 0 && (
            <span className={`bg-white text-[#f59e0b] ${isMobile() ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'} font-bold rounded-full`}>
              {getCartItemCount()}
            </span>
          )}
        </button>
        
        {/* Logo Overlap */}
        <div className={`absolute ${isMobile() ? '-bottom-8 left-4' : '-bottom-12 left-6'}`}>
          <div className={`${isMobile() ? 'w-16 h-16' : 'w-24 h-24'} bg-white rounded-full shadow-lg border-4 border-white overflow-hidden gpu-layer`}>
            <StableImage
              src={restaurant.logo_url}
              alt={restaurant.name}
              fixedWidth={isMobile() ? 64 : 96}
              fixedHeight={isMobile() ? 64 : 96}
              containerClassName="w-full h-full"
              objectFit="cover"
              fallback={
                <div className={`w-full h-full bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center text-white ${isMobile() ? 'text-xl' : 'text-3xl'} font-bold`}>
                  {restaurant.name.charAt(0)}
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className={`bg-white border-b border-[#e8e8e8] ${isMobile() ? 'pt-10 pb-2' : 'pt-16 pb-4'}`}>
        <div className={`max-w-7xl mx-auto ${isMobile() ? 'px-3' : 'px-6'}`}>
          {/* Kapalı Uyarısı */}
          {restaurant.is_active === false && (
            <div className={`mb-2 ${isMobile() ? 'p-2' : 'p-3'} bg-red-50 border-2 border-red-500 rounded-xl flex items-center gap-2`}>
              <span className={isMobile() ? 'text-lg' : 'text-xl'}>⚠️</span>
              <div>
                <p className={`${isMobile() ? 'text-[11px]' : 'text-[15px]'} font-bold text-red-900`}>Restoran Şu An Sipariş Almıyor</p>
                <p className={`${isMobile() ? 'text-[10px]' : 'text-[13px]'} text-red-700`}>Lütfen daha sonra tekrar deneyin</p>
              </div>
            </div>
          )}
          
          <div className={`flex items-start ${isMobile() ? 'flex-col gap-1.5' : 'justify-between'} mb-2`}>
            <div className="flex-1 min-w-0 w-full">
              <h1 className={`${isMobile() ? 'text-[17px] mb-1.5' : 'text-[28px] mb-2'} font-bold text-[#3c4043] truncate`} style={{ fontFamily: 'Open Sans, sans-serif' }}>
                {restaurant.name}
              </h1>
              
              {/* Rating + Badges - Tek satırda */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Rating */}
                <span className={`flex items-center gap-1 ${isMobile() ? 'text-[11px]' : 'text-[13px]'}`}>
                  <span className="text-[#f59e0b]">⭐</span>
                  <span className="font-semibold text-[#3c4043]">
                    {averageRating ? averageRating.toFixed(1) : restaurant.rating}
                  </span>
                </span>

                {/* Teslimat Süresi Badge */}
                <div className={`flex items-center gap-1 ${isMobile() ? 'px-1.5 py-0.5' : 'px-2 py-1'} bg-orange-50 rounded-full whitespace-nowrap`}>
                  <Clock size={isMobile() ? 10 : 12} className="text-orange-600 flex-shrink-0" strokeWidth={2.5} />
                  <span className={`${isMobile() ? 'text-[9px]' : 'text-[10px]'} font-medium text-gray-700`}>
                    {restaurant.estimated_delivery_time}
                  </span>
                </div>

                {/* Minimum Tutar Badge */}
                <div className={`flex items-center gap-1 ${isMobile() ? 'px-1.5 py-0.5' : 'px-2 py-1'} bg-gray-100 rounded-full whitespace-nowrap`}>
                  <Wallet size={isMobile() ? 10 : 12} className="text-gray-600 flex-shrink-0" strokeWidth={2.5} />
                  <span className={`${isMobile() ? 'text-[9px]' : 'text-[10px]'} font-medium text-gray-700`}>
                    Min. {restaurant.minimum_order_value}₺
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddressModal(true)}
              className={`flex items-center gap-2 ${isMobile() ? 'mt-2 px-2.5 py-1.5 w-full' : 'px-4 py-2'} bg-[#f7f7f7] border border-[#e8e8e8] rounded-lg hover:border-[#f59e0b] transition-colors`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className={`${isMobile() ? 'text-[11px]' : 'text-[12px]'} font-semibold text-[#3c4043] truncate`}>
                {selectedAddress || 'Adresini Seç'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Category Navigation */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#e8e8e8] shadow-sm overflow-x-hidden">
        {/* Tab Navigation */}
        <div className={`max-w-7xl mx-auto ${isMobile() ? 'px-2' : 'px-6'} border-b border-[#e8e8e8]`}>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('menu')}
              className={`${isMobile() ? 'py-2.5 px-3 text-[12px] min-h-[40px]' : 'py-3 px-2 text-[14px]'} font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'menu'
                  ? 'border-[#f59e0b] text-[#f59e0b]'
                  : 'border-transparent text-[#6f6f6f] hover:text-[#3c4043]'
              }`}
            >
              🍽️ Menü
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`${isMobile() ? 'py-2.5 px-3 text-[12px] min-h-[40px]' : 'py-3 px-2 text-[14px]'} font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'border-[#f59e0b] text-[#f59e0b]'
                  : 'border-transparent text-[#6f6f6f] hover:text-[#3c4043]'
              }`}
            >
              ⭐ Yorumlar
            </button>
          </div>
        </div>

        {/* Category Bar (only show on menu tab) */}
        {activeTab === 'menu' && (
          <div className={`max-w-7xl mx-auto ${isMobile() ? 'px-2 py-2' : 'px-6 py-3'}`}>
            <div className="relative mb-2">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Menüde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${isMobile() ? 'h-[36px] pl-9 pr-3 text-[12px]' : 'h-[40px] pl-10 pr-4 text-[13px]'} bg-[#f7f7f7] border border-[#e8e8e8] rounded-lg focus:outline-none focus:border-[#f59e0b] transition-colors`}
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              />
            </div>
            <div className="overflow-x-auto scrollbar-hide scroll-surface gpu-layer">
            <div className="flex gap-2">
              {categories.map(category => {
                const categoryProducts = products.filter(p => p.category_id === category.id)
                if (categoryProducts.length === 0) return null
                
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      scrollSpyRef.current = false
                      setActiveCategoryId(category.id)
                      const element = document.getElementById(`category-${category.id}`)
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      setTimeout(() => { scrollSpyRef.current = true }, 800)
                    }}
                    className={`flex-shrink-0 ${isMobile() ? 'px-3 py-2 text-[11px] min-h-[36px]' : 'px-4 py-2 text-[13px]'} rounded-full font-semibold transition-all ${
                      activeCategoryId === category.id
                        ? 'bg-[#f59e0b] text-white shadow-sm'
                        : 'bg-[#f7f7f7] text-gray-600 hover:bg-[#e8e8e8]'
                    }`}
                  >
                    {category.icon_url && <span className="mr-1">{category.icon_url}</span>}
                    {category.name}
                  </button>
                )
              })}
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto ${isMobile() ? 'px-2' : 'px-6'} lg:flex lg:gap-6`}>
        <div className="flex-1 min-w-0">
        {activeTab === 'menu' ? (
        <main className="py-3 lg:py-6">
        {categories.map(category => {
          const categoryProducts = products.filter(p => p.category_id === category.id && p.is_visible !== false && (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())))
          const availableCount = categoryProducts.filter(p => p.is_available !== false).length
          
          if (categoryProducts.length === 0) return null

          return (
            <div key={category.id} id={`category-${category.id}`} className={`${isMobile() ? 'mb-6' : 'mb-12'} scroll-mt-24`}>
              <h2 className={`${isMobile() ? 'text-[16px] mb-3 px-1' : 'text-[24px] mb-6'} font-bold text-[#3c4043]`} style={{ fontFamily: 'Open Sans, sans-serif' }}>
                {category.name}
              </h2>

              {/* Mobil: Liste Görünümü / Desktop: Grid */}
              {isMobile() ? (
                <div className="space-y-2">
                  {categoryProducts.map(product => {
                    const soldOut = product.is_available === false
                    const disabled = restaurant?.is_active === false || soldOut
                    return (
                      <div
                        key={product.id}
                        onClick={() => !disabled && handleProductClick(product)}
                        className={`flex items-center gap-3 bg-white border border-[#e8e8e8] rounded-xl p-2 transition-all ${
                          disabled ? 'opacity-60' : 'hover:border-[#f59e0b] cursor-pointer group'
                        }`}
                      >
                        <div className="relative flex-shrink-0 w-[88px] h-[88px] rounded-xl overflow-hidden bg-gray-100">
                          <StableImage
                            src={product.image_url}
                            alt={product.name}
                            fixedWidth={88}
                            fixedHeight={88}
                            containerClassName="w-full h-full"
                            objectFit="cover"
                            fallback={<span className="text-2xl">🍽️</span>}
                          />
                          {soldOut && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                              <span className="bg-white text-[#3c4043] text-[10px] font-bold px-2 py-0.5 rounded-full">Tükendi</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <h3 className="text-[13px] font-bold text-[#3c4043] line-clamp-2 leading-tight mb-1 group-hover:text-[#f59e0b] transition-colors" style={{ fontFamily: 'Open Sans, sans-serif' }}>{product.name}</h3>
                          {product.description && <p className="text-[11px] text-[#9e9e9e] line-clamp-1 mb-1.5">{product.description}</p>}
                          <div className="flex items-center justify-between">
                            <span className="text-[15px] font-bold text-[#f59e0b]">{product.price}₺</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleQuickAdd(product) }}
                              disabled={disabled || quickAddCheckingId === product.id}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                disabled || quickAddCheckingId === product.id
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-[#f59e0b] text-white hover:bg-[#d97706]'
                              }`}
                            >
                              {quickAddCheckingId === product.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryProducts.map(product => {
                    const soldOut = product.is_available === false
                    const disabled = restaurant?.is_active === false || soldOut
                    return (
                      <div
                        key={product.id}
                        onClick={() => !disabled && handleProductClick(product)}
                        className={`bg-white border border-[#e8e8e8] rounded-xl overflow-hidden transition-all relative ${
                          disabled ? 'opacity-60' : 'hover:shadow-lg hover:border-[#f59e0b] cursor-pointer group'
                        }`}
                      >
                        <div className="relative overflow-hidden bg-gray-100">
                          <StableImage
                            src={product.image_url}
                            alt={product.name}
                            aspectRatio="4/3"
                            containerClassName="w-full"
                            fallback={<span className="text-4xl">🍽️</span>}
                          />
                          {soldOut && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="bg-white text-[#3c4043] text-[11px] font-bold px-3 py-1 rounded-full shadow">Stokta Yok</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-[13px] mb-1 min-h-[32px] font-bold text-[#3c4043] line-clamp-2 leading-tight group-hover:text-[#f59e0b] transition-colors" style={{ fontFamily: 'Open Sans, sans-serif' }}>{product.name}</h3>
                          {product.description && <p className="text-[10px] text-[#9e9e9e] mb-2 line-clamp-1 leading-tight">{product.description}</p>}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[16px] font-bold text-[#f59e0b]">{product.price}₺</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleQuickAdd(product) }}
                              disabled={disabled || quickAddCheckingId === product.id}
                              className={`px-3 py-1.5 text-[11px] rounded-md font-semibold transition-all flex items-center gap-1 ${
                                disabled || quickAddCheckingId === product.id
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-[#f59e0b] text-white hover:bg-[#d97706] hover:scale-105'
                              }`}
                              style={{ fontFamily: 'Open Sans, sans-serif' }}
                            >
                              {quickAddCheckingId === product.id ? (
                                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              )}
                              {soldOut ? 'Tükendi' : quickAddCheckingId === product.id ? '...' : 'Ekle'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        
        {/* Boş Durum */}
        {categories.every(cat => products.filter(p => p.category_id === cat.id && p.is_visible !== false).length === 0) && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-[20px] font-bold text-[#3c4043] mb-2">
              Menü Henüz Hazır Değil
            </h3>
            <p className="text-[14px] text-[#6f6f6f]">
              Restoran menüsünü yakında ekleyecek
            </p>
          </div>
        )}
      </main>
      ) : (
        <ReviewsSection restaurantId={restaurantId} />
      )}
        </div>

        {/* Desktop Sabit Sepet Paneli */}
        <aside className="hidden lg:block w-[360px] flex-shrink-0 py-6">
          <div className="sticky top-24">
            <div className="bg-white rounded-xl border border-[#e8e8e8] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#e8e8e8] flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-[#3c4043]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Sepetim
                </h3>
                {cart.length > 0 && (
                  <span className="text-[12px] font-semibold text-[#f59e0b]">{getCartItemCount()} ürün</span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">🛒</div>
                  <p className="text-[13px] text-[#6f6f6f]">Sepetiniz boş</p>
                  <p className="text-[11px] text-[#9e9e9e] mt-1">Menüden ürün ekleyerek başlayın</p>
                </div>
              ) : (
                <>
                  <div className="max-h-[400px] overflow-y-auto divide-y divide-[#f0f0f0]">
                    {cart.map(item => (
                      <div key={item.product.id} className="p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#3c4043] truncate">{item.product.name}</p>
                          <p className="text-[13px] text-[#f59e0b] font-bold">{(item.product.price * item.quantity).toFixed(2)}₺</p>
                          {item.note && <p className="text-[10px] text-[#9e9e9e] truncate mt-0.5">📝 {item.note}</p>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 bg-[#f7f7f7] rounded-md flex items-center justify-center text-[14px] font-bold text-[#3c4043] hover:bg-[#e8e8e8] transition-colors"
                          >−</button>
                          <span className="text-[13px] font-bold text-[#3c4043] w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 bg-[#f7f7f7] rounded-md flex items-center justify-center text-[14px] font-bold text-[#3c4043] hover:bg-[#e8e8e8] transition-colors"
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#e8e8e8] p-4 space-y-2 bg-[#fafafa]">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6f6f6f]">Ara Toplam</span>
                      <span className="font-semibold text-[#3c4043]">{getCartTotal().toFixed(2)}₺</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6f6f6f]">Teslimat</span>
                      <span className="font-semibold text-[#3c4043]">{restaurant.delivery_fee.toFixed(2)}₺</span>
                    </div>
                    <div className="flex justify-between text-[15px] font-bold pt-2 border-t border-[#e8e8e8]">
                      <span className="text-[#3c4043]">Toplam</span>
                      <span className="text-[#f59e0b]">{(getCartTotal() + restaurant.delivery_fee).toFixed(2)}₺</span>
                    </div>

                    {getCartTotal() < restaurant.minimum_order_value && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 mt-1">
                        <p className="text-[11px] text-orange-700 font-medium text-center">
                          Min. sipariş tutarına {(restaurant.minimum_order_value - getCartTotal()).toFixed(2)}₺ kaldı
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => setShowCart(true)}
                      disabled={getCartTotal() < restaurant.minimum_order_value}
                      className="w-full min-h-[48px] bg-[#f59e0b] text-white rounded-lg font-bold text-[14px] hover:bg-[#d97706] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                      style={{ fontFamily: 'Open Sans, sans-serif' }}
                    >
                      {getCartTotal() < restaurant.minimum_order_value ? 'Minimum tutara ulaşın' : 'Siparişi Tamamla'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          allProducts={products}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <CartSidebar
          restaurant={restaurant}
          onClose={() => setShowCart(false)}
        />
      )}

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
