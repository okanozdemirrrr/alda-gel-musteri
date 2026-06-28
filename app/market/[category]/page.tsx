'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import StableImage from '@/app/components/StableImage'

interface Product {
  id: number
  name: string
  category: string
  price: number
  discount_price: number | null
  discount_percentage: number | null
  unit: string
  description: string | null
  image_url: string | null
  emoji: string
  stock_status: 'active' | 'out_of_stock' | 'inactive'
  is_featured: boolean
  sort_order: number
}

const categoryNames: { [key: string]: { name: string; icon: string } } = {
  firsatlar: { name: 'Haftanın Fırsatları', icon: '🔥' },
  yemeklik: { name: 'Yemeklik Malzemeler', icon: '🍝' },
  et: { name: 'Et & Tavuk & Şarküteri', icon: '🥩' },
  meyve: { name: 'Meyve & Sebze', icon: '🥬' },
  sut: { name: 'Süt & Süt Ürünleri', icon: '🥛' },
  kahvalti: { name: 'Kahvaltılık', icon: '🍳' },
  atistirmalik: { name: 'Atıştırmalık', icon: '🍿' },
  icecek: { name: 'İçecek', icon: '🥤' },
  ekmek: { name: 'Ekmek & Pastane', icon: '🍞' },
  dondurulmus: { name: 'Dondurulmuş Ürünler', icon: '🧊' }
}

export default function CategoryPage() {
  const params = useParams()
  const category = params.category as string
  const router = useRouter()
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const categoryInfo = categoryNames[category]

  useEffect(() => {
    fetchProducts()
    setupRealtime()
  }, [category])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('market_products')
        .select('*')
        .eq('category', category)
        .eq('stock_status', 'active')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      console.error('Ürünler yüklenemedi:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtime = () => {
    const channel = supabase
      .channel(`customer-market-${category}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_products',
          filter: `category=eq.${category}`
        },
        () => {
          fetchProducts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  if (!categoryInfo) {
    return (
      <div className="app-page bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">🤷‍♂️</p>
          <p className="text-gray-600">Kategori bulunamadı</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg"
          >
            Geri Dön
          </button>
        </div>
      </div>
    )
  }

  const addToCart = (productId: string) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[productId] > 1) {
        newCart[productId]--
      } else {
        delete newCart[productId]
      }
      return newCart
    })
  }

  const cartCount = Object.values(cart).reduce((sum, count) => sum + count, 0)
  const cartTotal = products.reduce((sum, product) => {
    const count = cart[product.id] || 0
    const price = product.discount_price || product.price
    return sum + (price * count)
  }, 0)

  return (
    <div className="app-page bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm safe-area-header">
        <div className="app-container px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{categoryInfo.name}</h1>
              <p className="text-xs text-gray-500">{products.length} ürün</p>
            </div>
          </div>

          {/* Sepet */}
          <button
            onClick={() => router.push('/sepet')}
            className="relative p-2 rounded-lg transition-colors touch-press"
          >
            <ShoppingCart size={24} className="text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Products Grid */}
      <main className="app-container scroll-surface gpu-layer px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-44 rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📦</p>
            <p className="text-gray-600 text-lg">Bu kategoride henüz ürün bulunmuyor</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Geri Dön
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => {
              const quantity = cart[product.id] || 0
              const finalPrice = product.discount_price || product.price

              return (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all relative flex flex-col"
                >
                  {/* İndirim Badge */}
                  {product.discount_percentage && (
                    <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                      %{product.discount_percentage}
                    </div>
                  )}

                  {/* Ürün Görseli — sabit oran, asla yamulmaz */}
                  <div className="overflow-hidden bg-gray-100">
                    <StableImage
                      src={product.image_url}
                      alt={product.name}
                      aspectRatio="1/1"
                      containerClassName="w-full"
                      objectFit="cover"
                      fallback={<span className="text-5xl">{product.emoji}</span>}
                    />
                  </div>

                  {/* Ürün Bilgileri */}
                  <div className="p-3 flex flex-col flex-1">
                    <h5 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[40px]">
                      {product.name}
                    </h5>
                    <p className="text-xs text-gray-500 mb-2 truncate">{product.unit}</p>

                    {/* Fiyat */}
                    <div className="mb-3 mt-auto">
                      {product.discount_price ? (
                        <div>
                          <p className="text-xs text-gray-400 line-through">₺{product.price.toFixed(2)}</p>
                          <p className="text-lg font-bold text-orange-600">₺{finalPrice.toFixed(2)}</p>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-orange-600">₺{product.price.toFixed(2)}</p>
                      )}
                    </div>

                    {/* Sepet Kontrolleri */}
                    {quantity === 0 ? (
                      <button
                        onClick={() => addToCart(product.id.toString())}
                        className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={18} />
                        Sepete Ekle
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-orange-50 rounded-lg p-2">
                        <button
                          onClick={() => removeFromCart(product.id.toString())}
                          className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-gray-900">{quantity}</span>
                        <button
                          onClick={() => addToCart(product.id.toString())}
                          className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Floating Cart Summary */}
      {cartCount > 0 && (
        <div
          className="fixed left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40 safe-area-footer"
          style={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="app-container px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-gray-600">{cartCount} ürün</p>
                <p className="text-xl font-bold text-gray-900">₺{cartTotal.toFixed(2)}</p>
              </div>
              <button
                onClick={() => router.push('/sepet')}
                className="touch-press bg-orange-500 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 flex-shrink-0"
              >
                <ShoppingCart size={20} />
                Sepete Git
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
