'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingCart, Search } from 'lucide-react'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

const categories: Category[] = [
  { id: 'firsatlar', name: 'Haftanın Fırsatları', icon: '🔥', color: 'bg-red-500' },
  { id: 'yemeklik', name: 'Yemeklik Malzemeler', icon: '🍝', color: 'bg-orange-500' },
  { id: 'et', name: 'Et & Tavuk & Şarküteri', icon: '🥩', color: 'bg-red-600' },
  { id: 'meyve', name: 'Meyve & Sebze', icon: '🥬', color: 'bg-green-500' },
  { id: 'sut', name: 'Süt & Süt Ürünleri', icon: '🥛', color: 'bg-blue-400' },
  { id: 'kahvalti', name: 'Kahvaltılık', icon: '🍳', color: 'bg-yellow-500' },
  { id: 'atistirmalik', name: 'Atıştırmalık', icon: '🍿', color: 'bg-purple-500' },
  { id: 'icecek', name: 'İçecek', icon: '🥤', color: 'bg-cyan-500' },
  { id: 'ekmek', name: 'Ekmek & Pastane', icon: '🍞', color: 'bg-amber-600' },
  { id: 'dondurulmus', name: 'Dondurulmuş Ürünler', icon: '🧊', color: 'bg-blue-600' }
]

export default function MarketPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/musteri/market/${categoryId}`)
  }

  return (
    <div className="min-h-screen bg-white">
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
            <h1 className="text-xl font-bold text-gray-900">Market</h1>
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

        {/* Arama Çubuğu */}
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ürün, kategori veya marka ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Banner - Haftanın Fırsatları */}
        <div className="mb-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black mb-1">🔥 Haftanın Fırsatları</h2>
              <p className="text-red-100 text-sm">Kaçırılmayacak indirimler!</p>
            </div>
            <button
              onClick={() => handleCategoryClick('firsatlar')}
              className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors shadow-md"
            >
              İncele
            </button>
          </div>
        </div>

        {/* Kategoriler Grid */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Kategoriler</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.slice(1).map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-orange-500 hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                {/* İkon */}
                <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                  {category.icon}
                </div>
                
                {/* Kategori Adı */}
                <h4 className="font-bold text-gray-900 text-sm leading-tight">
                  {category.name}
                </h4>
              </div>
            </button>
          ))}
        </div>

        {/* Popüler Ürünler Bölümü (Placeholder) */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Popüler Ürünler</h3>
            <button className="text-orange-500 text-sm font-semibold hover:text-orange-600">
              Tümünü Gör →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer"
              >
                {/* Ürün Görseli Placeholder */}
                <div className="w-full aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-4xl">🛒</span>
                </div>

                {/* Ürün Bilgileri */}
                <h5 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                  Örnek Ürün {item}
                </h5>
                <p className="text-xs text-gray-500 mb-2">1 Adet</p>
                
                {/* Fiyat ve Sepet */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-orange-600">₺{(item * 10).toFixed(2)}</span>
                  <button className="bg-orange-500 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-orange-600 transition-colors">
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bilgilendirme Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">ℹ️</div>
            <div>
              <h4 className="font-bold text-blue-900 mb-2">Market Modülü Aktif!</h4>
              <p className="text-blue-700 text-sm leading-relaxed">
                Samsun 19 Mayıs bölgesinde market alışverişi artık mümkün. 
                Kategorilerden ürünleri seçin, sepete ekleyin ve hızlı teslimatın keyfini çıkarın.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

