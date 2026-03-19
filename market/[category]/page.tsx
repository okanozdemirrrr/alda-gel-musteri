'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'

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

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const categoryInfo = categoryNames[resolvedParams.category]

  useEffect(() => {
    fetchProducts()
    setupRealtime()
  }, [resolvedParams.category])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('market_products')
        .select('*')
        .eq('category', resolvedParams.category)
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
      .channel(`customer-market-${resolvedParams.category}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_products',
          filter: `category=eq.${resolvedParams.category}`
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
      <div className="min-h-screen bg-white flex items-center justify-center">
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
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-[64px] flex items-center justify-between">
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
            onClick={() => router.push('/musteri/sepet')}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Yükleniyor...</p>
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
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all relative"
                >
                  {/* İndirim Badge */}
                  {product.discount_percentage && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                      %{product.discount_percentage}
                    </div>
                  )}

                  {/* Ürün Görseli */}
                  <div className="w-full aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl">{product.emoji}</span>
                    )}
                  </div>

                  {/* Ürün Bilgileri */}
                  <h5 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[40px]">
                    {product.name}
                  </h5>
                  <p className="text-xs text-gray-500 mb-2">{product.unit}</p>

                  {/* Fiyat */}
                  <div className="mb-3">
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
              )
            })}
          </div>
        )}
      </main>

      {/* Floating Cart Summary */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{cartCount} ürün</p>
                <p className="text-2xl font-bold text-gray-900">₺{cartTotal.toFixed(2)}</p>
              </div>
              <button
                onClick={() => router.push('/musteri/sepet')}
                className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center gap-2"
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
