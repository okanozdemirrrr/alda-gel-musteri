'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Plus, Minus, MessageSquare } from 'lucide-react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  unit: string
  image: string
  note?: string
}

export default function SepetPage() {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [tempNote, setTempNote] = useState('')

  // Örnek sepet verisi (gerçek uygulamada Context veya State Management kullanılmalı)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: '1', name: 'Süt 1L', price: 25.90, quantity: 2, unit: '1 Adet', image: '🥛' },
    { id: '2', name: 'Ekmek', price: 5.00, quantity: 3, unit: '1 Adet', image: '🍞' },
    { id: '16', name: 'Domates', price: 18.90, quantity: 1, unit: '1 Kg', image: '🍅' }
  ])

  const openNoteModal = (item: CartItem) => {
    setSelectedItem(item)
    setTempNote(item.note || '')
    setNoteModalOpen(true)
  }

  const saveNote = () => {
    if (selectedItem) {
      setCartItems(prev =>
        prev.map(item =>
          item.id === selectedItem.id
            ? { ...item, note: tempNote.trim() || undefined }
            : item
        )
      )
    }
    setNoteModalOpen(false)
    setSelectedItem(null)
    setTempNote('')
  }

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      ).filter(item => item.quantity > 0)
    )
  }

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const deliveryFee = 15.00
  const total = subtotal + deliveryFee

  const handleCheckout = () => {
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      router.push('/musteri')
    }, 2000)
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 h-[64px] flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Sepetim</h1>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sepetiniz Boş</h2>
          <p className="text-gray-600 mb-8 text-center">
            Market bölümünden ürün ekleyerek alışverişe başlayabilirsiniz
          </p>
          <button
            onClick={() => router.push('/musteri/market')}
            className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
          >
            Alışverişe Başla
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Sipariş Alındı!</h3>
            <p className="text-gray-600">
              Siparişiniz hazırlanıyor. Teşekkür ederiz!
            </p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 pb-32">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 h-[64px] flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sepetim</h1>
              <p className="text-xs text-gray-500">{cartItems.length} ürün</p>
            </div>
          </div>
        </header>

        {/* Cart Items */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-3 mb-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                onClick={() => openNoteModal(item)}
                className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-4 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all"
              >
                {/* Ürün Görseli */}
                <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">{item.image}</span>
                </div>

                {/* Ürün Bilgileri */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{item.unit}</p>
                  {item.note && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md inline-flex max-w-full">
                      <MessageSquare size={12} className="flex-shrink-0" />
                      <span className="truncate">{item.note}</span>
                    </div>
                  )}
                  <p className="text-lg font-bold text-orange-600 mt-1">₺{item.price.toFixed(2)}</p>
                </div>

                {/* Miktar Kontrolleri */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeItem(item.id)
                    }}
                    className="text-red-500 hover:text-red-600 p-1"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateQuantity(item.id, -1)
                      }}
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-bold text-gray-900 w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateQuantity(item.id, 1)
                      }}
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Özet */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Sipariş Özeti</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Ara Toplam</span>
                <span>₺{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Teslimat Ücreti</span>
                <span>₺{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Toplam</span>
                <span>₺{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Adres Bilgisi */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-orange-900 mb-1">Teslimat Adresi</p>
              <p className="text-sm text-orange-700">
                {localStorage.getItem('customer_address') || 'Adres seçilmedi'}
              </p>
            </div>

            {/* Ödeme Yöntemi */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Ödeme Yöntemi</p>
              <div className="grid grid-cols-2 gap-3">
                <button className="border-2 border-orange-500 bg-orange-50 rounded-lg p-3 text-center">
                  <span className="text-2xl block mb-1">💵</span>
                  <span className="text-sm font-semibold text-orange-900">Nakit</span>
                </button>
                <button className="border-2 border-gray-200 rounded-lg p-3 text-center hover:border-gray-300">
                  <span className="text-2xl block mb-1">💳</span>
                  <span className="text-sm font-semibold text-gray-700">Kart</span>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Floating Checkout Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={handleCheckout}
              className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors"
            >
              Siparişi Tamamla - ₺{total.toFixed(2)}
            </button>
            <p className="text-center text-sm text-gray-500 mt-2">
              💡 Not eklemek istediğiniz ürünün üstüne tıklayınız
            </p>
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {noteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedItem.name}
              </h2>
              <button
                onClick={() => {
                  setNoteModalOpen(false)
                  setSelectedItem(null)
                  setTempNote('')
                }}
                className="text-gray-400 hover:text-gray-900 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Ürün Bilgisi */}
              <div className="mb-6 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">{selectedItem.image}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{selectedItem.unit}</p>
                  <p className="text-2xl font-bold text-orange-600">₺{selectedItem.price.toFixed(2)}</p>
                </div>
              </div>

              {/* Not Alanı */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Ürün Notu (Opsiyonel)
                </label>
                <textarea
                  placeholder="Örn: Soğan istemiyorum, marul bol olsun vb."
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  className="w-full h-[120px] px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Bu not restorana iletilecektir
                </p>
              </div>

              {/* Butonlar */}
              <div className="flex gap-3">
                {tempNote.trim() && (
                  <button
                    onClick={() => {
                      setTempNote('')
                      saveNote()
                    }}
                    className="flex-1 h-14 border-2 border-red-500 text-red-500 rounded-lg font-bold hover:bg-red-50 transition-colors"
                  >
                    Notu Sil
                  </button>
                )}
                <button
                  onClick={saveNote}
                  className="flex-1 h-14 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
                >
                  {tempNote.trim() ? 'Notu Kaydet' : 'Kapat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

