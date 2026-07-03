'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Trash2, Plus, Minus, MessageSquare, ShoppingBag, MapPin, CreditCard, Banknote, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/app/context/CartContext'
import { supabase } from '@/app/lib/supabase'
import { fetchUserAddressCoordinates } from '@/app/lib/addressService'
import { isMobile } from '@/app/lib/platform'
import StableImage from '@/app/components/StableImage'
import AuthModal from '@/app/components/AuthModal'
import Portal from '@/app/components/Portal'

const shouldAnimate = !isMobile()

export default function SepetPage() {
  const router = useRouter()
  const { cart, updateQuantity, updateNote, removeFromCart, getCartTotal, clearCart } = useCart()

  const [selectedItem, setSelectedItem] = useState<typeof cart[0] | null>(null)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [tempNote, setTempNote] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [checkoutError, setCheckoutError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Teslimat bilgisi toplama modal state'leri
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoPhone, setInfoPhone] = useState('')
  const [infoPhoneError, setInfoPhoneError] = useState('')
  const [infoAddress, setInfoAddress] = useState('')
  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [infoError, setInfoError] = useState('')
  // Kullanıcı ve adres bilgilerini yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const customerId = localStorage.getItem('customer_id')
      setIsLoggedIn(!!customerId)
      setCustomerAddress(localStorage.getItem('customer_address') || '')
    }
  }, [])

  const subtotal = getCartTotal()
  const deliveryFee = cart.length > 0 ? 15.0 : 0
  const total = subtotal + deliveryFee

  const openNoteModal = (item: typeof cart[0]) => {
    setSelectedItem(item)
    setTempNote(item.note || '')
    setNoteModalOpen(true)
  }

  const saveNote = () => {
    if (selectedItem) {
      updateNote(selectedItem.product.id, tempNote.trim())
    }
    setNoteModalOpen(false)
    setSelectedItem(null)
    setTempNote('')
  }

  const handleQuantityChange = (productId: string, delta: number) => {
    const item = cart.find(c => c.product.id === productId)
    if (!item) return
    const newQty = item.quantity + delta
    if (newQty <= 0) {
      removeFromCart(productId)
    } else {
      updateQuantity(productId, newQty)
    }
  }

  // ─── TELSEFİN DOĞRULAMA ────────────────────────────────────────
  const validateInfoPhone = (value: string): boolean => {
    if (!value) { setInfoPhoneError('Telefon numarası zorunludur'); return false }
    if (!/^\d+$/.test(value)) { setInfoPhoneError('Sadece rakam girebilirsiniz'); return false }
    if (value.startsWith('0')) { setInfoPhoneError('Başında 0 olmadan yazın'); return false }
    if (value.length !== 10) { setInfoPhoneError('10 hane olmalıdır'); return false }
    if (!value.startsWith('5')) { setInfoPhoneError('5 ile başlamalıdır'); return false }
    setInfoPhoneError('')
    return true
  }

  // ─── TESLİMAT BİLGİSİ KAYDET + SİPARİŞ BAŞLAT ───────────────
  const handleSaveInfoAndCheckout = async () => {
    const currentNeedsPhone = !localStorage.getItem('customer_phone')
    const currentNeedsAddress = !localStorage.getItem('customer_address')

    if (currentNeedsPhone && !validateInfoPhone(infoPhone)) return
    if (currentNeedsAddress && !infoAddress.trim()) {
      setInfoError('Teslimat adresi zorunludur')
      return
    }

    setIsSavingInfo(true)
    setInfoError('')

    try {
      const customerId = localStorage.getItem('customer_id')

      // Telefonu customers tablosuna kaydet
      if (currentNeedsPhone && infoPhone && customerId) {
        await supabase
          .from('customers')
          .update({ phone: infoPhone })
          .eq('id', customerId)
        localStorage.setItem('customer_phone', infoPhone)
      }

      // Adresi user_addresses tablosuna kaydet
      if (currentNeedsAddress && infoAddress.trim()) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('user_addresses').insert([{
            user_id: user.id,
            title: 'Teslimat Adresim',
            full_address: infoAddress.trim(),
            latitude: 41.492892,
            longitude: 36.081592,
          }])
        }
        localStorage.setItem('customer_address', infoAddress.trim())
        setCustomerAddress(infoAddress.trim())
      }

      setShowInfoModal(false)
      await handleCheckout()
    } catch (err: any) {
      setInfoError('Bilgiler kaydedilemedi: ' + (err.message || 'Hata oluştu'))
    } finally {
      setIsSavingInfo(false)
    }
  }

  // ─── SİPARİŞ BUTONU BASIN ─────────────────────────────────────
  const handleOrderButtonClick = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true)
      return
    }

    const phone = localStorage.getItem('customer_phone') || ''
    const address = localStorage.getItem('customer_address') || ''

    if (!phone || !address) {
      setInfoPhone(phone)
      setInfoAddress(address)
      setInfoPhoneError('')
      setInfoError('')
      setShowInfoModal(true)
      return
    }

    handleCheckout()
  }

  // ═══════════════════════════════════════════════════════════════
  // GERÇEK SİPARİŞ OLUŞTURMA — DB'ye INSERT
  // ═══════════════════════════════════════════════════════════════
  const handleCheckout = async () => {
    if (cart.length === 0) return
    setCheckoutError('')

    // 1) Kullanıcı bilgilerini localStorage'dan çek
    const customerId = localStorage.getItem('customer_id')
    const customerName = localStorage.getItem('customer_name')
    const storedAddress = localStorage.getItem('customer_address')
    const customerPhone = localStorage.getItem('customer_phone') || ''

    if (!customerId) {
      setCheckoutError('Lütfen giriş yapın.')
      return
    }
    if (!storedAddress) {
      setCheckoutError('Lütfen teslimat adresi seçin.')
      return
    }

    setIsProcessing(true)

    try {
      // 2) Müşteri koordinatlarını çek
      const addressData = await fetchUserAddressCoordinates()

      const customerLat = addressData?.latitude
      const customerLng = addressData?.longitude

      // 3) Sepetteki ürünleri restaurant_id'ye göre grupla
      const groups = new Map<string, typeof cart[0][]>()
      for (const item of cart) {
        const rid = item.product.restaurant_id || 'unknown'
        if (!groups.has(rid)) groups.set(rid, [])
        groups.get(rid)!.push(item)
      }

      // 4) Her restoran için ayrı sipariş oluştur
      for (const [restaurantId, items] of Array.from(groups.entries())) {
        if (restaurantId === 'unknown') continue

        // Restoranın gerçek delivery_fee'sini çek
        const { data: restData } = await supabase
          .from('restaurants')
          .select('delivery_fee')
          .eq('id', restaurantId)
          .single()

        const orderNumber = `AG${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`

        const groupSubtotal = items.reduce((s: number, i: typeof cart[0]) => s + (i.unit_price || i.product.price) * i.quantity, 0)
        const groupDeliveryFee = restData?.delivery_fee ?? 15.0
        const groupTotal = groupSubtotal + groupDeliveryFee

        const orderItems = items.map((item: typeof cart[0]) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.unit_price || item.product.price,
          base_price: item.product.price,
          selected_options: item.selected_options || [],
          item_note: item.note || null
        }))

        const { error } = await supabase
          .from('packages')
          .insert([{
            restaurant_id: restaurantId,
            customer_id: customerId,
            customer_name: customerName || 'Müşteri',
            customer_phone: customerPhone,
            delivery_address: storedAddress,
            latitude: customerLat ? parseFloat(customerLat.toString()) : null,
            longitude: customerLng ? parseFloat(customerLng.toString()) : null,
            amount: groupTotal,
            subtotal: groupSubtotal,
            delivery_fee: groupDeliveryFee,
            payment_method: paymentMethod,
            status: 'new_order',
            order_number: orderNumber,
            items: orderItems,
            platform: 'web'
          }])

        if (error) throw error
      }

      // 5) BAŞARILI → sepeti temizle ve yönlendir
      clearCart()
      setShowCheckoutSuccess(true)

      setTimeout(() => {
        setShowCheckoutSuccess(false)
        router.push('/siparislerim')
      }, 2000)

    } catch (err: any) {
      console.error('Sipariş oluşturma hatası:', err)
      setCheckoutError('Sipariş oluşturulurken hata: ' + (err.message || 'Bilinmeyen hata'))
    } finally {
      setIsProcessing(false)
    }
  }

  // ─── BOŞ SEPET ──────────────────────────────────────────────
  if (cart.length === 0 && !showCheckoutSuccess) {
    return (
      <div className="app-page bg-stone-50">
        <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-40 safe-area-header">
          <div className="max-w-4xl mx-auto px-4 min-h-16 py-2 flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-stone-100 rounded-full transition-colors">
              <ArrowLeft size={22} className="text-stone-600" />
            </button>
            <h1 className="text-xl font-bold text-stone-800">Sepetim</h1>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[60dvh] px-4">
          <motion.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : {}}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : {}}
            className="text-center"
          >
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-stone-400" />
            </div>
            <h2 className="text-2xl font-black text-stone-800 mb-2">Sepetiniz Boş</h2>
            <p className="text-stone-500 mb-8 max-w-xs mx-auto">
              Restoranlardan veya marketten ürün ekleyerek alışverişe başlayabilirsiniz
            </p>
            <button
              onClick={() => router.push('/restoranlar')}
              className="px-8 py-3 min-h-[48px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Restoranlara Göz At
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Sipariş Başarı Modalı */}
      <Portal>
      <AnimatePresence>
        {showCheckoutSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center h-[100dvh] w-screen bg-black/50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : {}}
              animate={shouldAnimate ? { scale: 1, opacity: 1 } : {}}
              exit={shouldAnimate ? { scale: 0.8, opacity: 0 } : {}}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-stone-800 mb-2">Sipariş Alındı!</h3>
              <p className="text-stone-500">Siparişiniz hazırlanıyor. Siparişlerim sayfasına yönlendiriliyorsunuz...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>

      <div className="app-page bg-stone-50 pb-44">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-40 safe-area-header">
          <div className="max-w-4xl mx-auto px-4 min-h-16 py-2 flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-stone-100 rounded-full transition-colors">
              <ArrowLeft size={22} className="text-stone-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-stone-800">Sepetim</h1>
              <p className="text-xs text-stone-500">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} ürün
              </p>
            </div>
          </div>
        </header>

        {/* Ürün Listesi */}
        <main className="max-w-4xl mx-auto px-4 py-6 min-w-0">
          <div className="space-y-3 mb-6">
            {cart.map((item) => (
              <motion.div
                key={item.product.id}
                layout
                initial={shouldAnimate ? { opacity: 0, y: 10 } : {}}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
                className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-100 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow"
              >
                {/* Ürün Görseli */}
                <div onClick={() => openNoteModal(item)} className="flex-shrink-0">
                  <StableImage
                    src={item.product.image_url}
                    alt={item.product.name}
                    fixedWidth={80}
                    fixedHeight={80}
                    containerClassName="rounded-xl cursor-pointer"
                    fallback={<span className="text-3xl">🍽️</span>}
                  />
                </div>

                {/* Ürün Bilgileri */}
                <div className="flex-1 min-w-0" onClick={() => openNoteModal(item)}>
                  <h3 className="font-bold text-stone-800 mb-0.5 truncate text-sm sm:text-base">{item.product.name}</h3>
                  {item.product.category && (
                    <p className="text-xs text-stone-400 mb-1">{item.product.category}</p>
                  )}
                  {item.note && (
                    <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md inline-flex max-w-full mb-1">
                      <MessageSquare size={12} className="flex-shrink-0" />
                      <span className="truncate">{item.note}</span>
                    </div>
                  )}
                  <p className="text-base sm:text-lg font-black text-amber-600">₺{item.product.price.toFixed(2)}</p>
                </div>

                {/* Miktar + Sil */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-stone-400 hover:text-red-500 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl p-1">
                    <button
                      onClick={() => handleQuantityChange(item.product.id, -1)}
                      className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold text-stone-800 w-7 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.product.id, 1)}
                      className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Özet Paneli */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm">
            <h3 className="font-bold text-stone-800 mb-4 text-lg">Sipariş Özeti</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-stone-600 text-sm">
                <span>Ara Toplam</span>
                <span className="font-semibold">₺{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600 text-sm">
                <span>Teslimat Ücreti</span>
                <span className="font-semibold">₺{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-stone-100 pt-3 flex justify-between text-lg font-black text-stone-800">
                <span>Toplam</span>
                <span className="text-amber-600">₺{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Adres */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} className="text-amber-600 flex-shrink-0" />
                <p className="text-sm font-bold text-amber-900">Teslimat Adresi</p>
              </div>
              <p className="text-sm text-amber-700 pl-6">
                {customerAddress || 'Henüz adres seçilmedi'}
              </p>
            </div>

            {/* Ödeme Yöntemi */}
            <div className="mb-2">
              <p className="text-sm font-bold text-stone-800 mb-3">Ödeme Yöntemi</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`border-2 rounded-xl p-3 min-h-[72px] text-center transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <Banknote size={24} className={`mx-auto mb-1 ${paymentMethod === 'cash' ? 'text-amber-600' : 'text-stone-400'}`} />
                  <span className={`text-sm font-bold ${paymentMethod === 'cash' ? 'text-amber-900' : 'text-stone-700'}`}>Nakit</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`border-2 rounded-xl p-3 min-h-[72px] text-center transition-all ${
                    paymentMethod === 'card'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <CreditCard size={24} className={`mx-auto mb-1 ${paymentMethod === 'card' ? 'text-amber-600' : 'text-stone-400'}`} />
                  <span className={`text-sm font-bold ${paymentMethod === 'card' ? 'text-amber-900' : 'text-stone-700'}`}>Kart</span>
                </button>
              </div>
            </div>

            {/* Hata mesajı */}
            {checkoutError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
                {checkoutError}
              </div>
            )}
          </div>
        </main>

        {/* Alt Checkout Bar — Portal ile viewport'a sabitlendi */}
        <Portal><div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-[9998] safe-area-footer">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
            <button
              onClick={handleOrderButtonClick}
              disabled={cart.length === 0 || isProcessing}
              className="group w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white min-h-[48px] py-3 sm:py-4 rounded-xl font-black text-base sm:text-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  İşleniyor...
                </span>
              ) : (
                <>
                  <span>Siparişi Tamamla</span>
                  <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-bold">₺{total.toFixed(2)}</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-stone-400 mt-2">
              💡 Not eklemek için ürünün üzerine tıklayın
            </p>
          </div>
        </div></Portal>
      </div>

      {/* Teslimat Bilgileri Modalı */}
      <Portal>
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center h-[100dvh] w-screen bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={shouldAnimate ? { scale: 0.9, opacity: 0 } : {}}
              animate={shouldAnimate ? { scale: 1, opacity: 1 } : {}}
              exit={shouldAnimate ? { scale: 0.9, opacity: 0 } : {}}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4">
                <h2 className="text-[17px] font-bold text-white">Teslimat Bilgileri</h2>
                <p className="text-[12px] text-white/80 mt-0.5">
                  Siparişinizi tamamlamak için lütfen bilgilerinizi girin
                </p>
              </div>

              <div className="p-5 space-y-4">
                {/* Telefon Alanı */}
                {!localStorage.getItem('customer_phone') && (
                  <div>
                    <label className="flex items-center gap-2 text-[13px] font-semibold text-stone-700 mb-2">
                      <Phone size={14} className="text-amber-500" />
                      Telefon Numarası <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[11px] text-stone-400 mb-2">Başında 0 olmadan 10 hane (ör: 5551234567)</p>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="5551234567"
                      value={infoPhone}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '')
                        setInfoPhone(cleaned)
                        if (cleaned.length > 0) validateInfoPhone(cleaned)
                        else setInfoPhoneError('')
                      }}
                      className={`w-full h-[48px] px-4 border rounded-xl text-[14px] focus:outline-none transition-colors ${
                        infoPhoneError
                          ? 'border-red-400 bg-red-50'
                          : infoPhone.length === 10 && !infoPhoneError
                          ? 'border-green-400 bg-green-50'
                          : 'border-stone-200 focus:border-amber-400'
                      }`}
                    />
                    {infoPhoneError && (
                      <p className="text-[11px] text-red-500 mt-1">⚠️ {infoPhoneError}</p>
                    )}
                    {infoPhone.length === 10 && !infoPhoneError && (
                      <p className="text-[11px] text-green-600 mt-1">✓ Geçerli</p>
                    )}
                  </div>
                )}

                {/* Adres Alanı */}
                {!localStorage.getItem('customer_address') && (
                  <div>
                    <label className="flex items-center gap-2 text-[13px] font-semibold text-stone-700 mb-2">
                      <MapPin size={14} className="text-amber-500" />
                      Teslimat Adresi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Örn: 19 Mayıs KYK Yurdu, A Blok, Kat 3, No 12"
                      value={infoAddress}
                      onChange={(e) => { setInfoAddress(e.target.value); setInfoError('') }}
                      rows={3}
                      className="w-full px-4 py-3 border border-stone-200 focus:border-amber-400 rounded-xl text-[14px] focus:outline-none transition-colors resize-none"
                    />
                  </div>
                )}

                {infoError && (
                  <p className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    ⚠️ {infoError}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="flex-1 min-h-[48px] border-2 border-stone-200 text-stone-600 rounded-xl font-semibold text-[14px] hover:bg-stone-50 transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleSaveInfoAndCheckout}
                    disabled={isSavingInfo}
                    className="flex-1 min-h-[48px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-[14px] transition-all disabled:opacity-50"
                  >
                    {isSavingInfo ? 'Kaydediliyor...' : 'Siparişi Tamamla'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>

      {/* Giriş Modalı — sadece misafir "Siparişi Tamamla"ya bastığında */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(_name) => {
            setIsLoggedIn(true)
            setCustomerAddress(localStorage.getItem('customer_address') || '')
            setShowAuthModal(false)
          }}
        />
      )}

      {/* Not Modalı */}
      <Portal>
      <AnimatePresence>
        {noteModalOpen && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center h-[100dvh] w-screen bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={shouldAnimate ? { scale: 0.9, opacity: 0 } : {}}
              animate={shouldAnimate ? { scale: 1, opacity: 1 } : {}}
              exit={shouldAnimate ? { scale: 0.9, opacity: 0 } : {}}
              className="bg-white rounded-2xl w-full max-w-md sm:max-w-md overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-stone-100">
                <h2 className="text-lg font-bold text-stone-800 truncate pr-4">{selectedItem.product.name}</h2>
                <button
                  onClick={() => { setNoteModalOpen(false); setSelectedItem(null); setTempNote('') }}
                  className="text-stone-400 hover:text-stone-700 text-2xl leading-none flex-shrink-0"
                >
                  ×
                </button>
              </div>

              <div className="p-5">
                {/* Ürün Bilgisi */}
                <div className="mb-5 flex items-center gap-4">
                  <div className="w-16 h-16 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {selectedItem.product.image_url ? (
                      <Image src={selectedItem.product.image_url} alt={selectedItem.product.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      <span className="text-2xl">🍽️</span>
                    )}
                  </div>
                  <div>
                    {selectedItem.product.category && (
                      <p className="text-xs text-stone-400">{selectedItem.product.category}</p>
                    )}
                    <p className="text-xl font-black text-amber-600">₺{selectedItem.product.price.toFixed(2)}</p>
                  </div>
                </div>

                {/* Not Alanı */}
                <div className="mb-5">
                  <label className="block text-sm font-bold text-stone-800 mb-2">Ürün Notu (Opsiyonel)</label>
                  <textarea
                    placeholder="Örn: Soğan istemiyorum, acılı olsun vb."
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    className="w-full h-28 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
                    autoFocus
                  />
                  <p className="text-xs text-stone-400 mt-2">Bu not restorana iletilecektir</p>
                </div>

                {/* Butonlar */}
                <div className="flex gap-3">
                  {tempNote.trim() && (
                    <button
                      onClick={() => { setTempNote(''); updateNote(selectedItem.product.id, ''); setNoteModalOpen(false); setSelectedItem(null) }}
                      className="flex-1 h-12 border-2 border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors"
                    >
                      Notu Sil
                    </button>
                  )}
                  <button
                    onClick={saveNote}
                    className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold transition-all"
                  >
                    {tempNote.trim() ? 'Notu Kaydet' : 'Kapat'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>
    </>
  )
}
