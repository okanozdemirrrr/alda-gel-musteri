'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Trash2, Plus, Minus, MessageSquare, ShoppingBag, MapPin, CreditCard, Banknote } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/app/context/CartContext'
import { supabase } from '@/app/lib/supabase'
import { fetchUserAddressCoordinates } from '@/app/lib/addressService'
import { isMobile } from '@/app/lib/platform'
import StableImage from '@/app/components/StableImage'
import AuthModal from '@/app/components/AuthModal'
import Portal from '../components/Portal'

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
  const [checkoutError, setCheckoutError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Ödeme modalı — sipariş öncesi telefon teyidi + ödeme yöntemi seçimi
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [paymentAddressInput, setPaymentAddressInput] = useState('')
  const [paymentAddressError, setPaymentAddressError] = useState('')
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

  // ─── TELEFON DOĞRULAMA (sipariş öncesi son teyit) ───────────────
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) { setPhoneError('Telefon numarası zorunludur'); return false }
    if (!/^\d+$/.test(phone)) { setPhoneError('Sadece rakam girebilirsiniz'); return false }
    if (phone.startsWith('0')) { setPhoneError('Numarayı başında 0 olmadan yazın (örn: 5551234567)'); return false }
    if (phone.length !== 10) { setPhoneError('Telefon numarası 10 hane olmalıdır'); return false }
    if (!phone.startsWith('5')) { setPhoneError('Cep telefonu numarası 5 ile başlamalıdır'); return false }
    setPhoneError('')
    return true
  }

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    setPhoneNumber(cleaned)
    if (cleaned.length > 0) validatePhoneNumber(cleaned)
    else setPhoneError('')
  }

  const isPhoneValid = phoneNumber.length === 10 && phoneNumber.startsWith('5') && !phoneNumber.startsWith('0')

  const isPaymentAddressValid = !!(customerAddress || paymentAddressInput.trim())

  // ─── SİPARİŞ BUTONU BASIN ─────────────────────────────────────
  const handleOrderButtonClick = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true)
      return
    }

    const storedPhone = localStorage.getItem('customer_phone') || ''
    const storedAddress = localStorage.getItem('customer_address') || ''
    setPhoneNumber(storedPhone)
    setPhoneError('')
    setPaymentAddressInput(storedAddress)
    setPaymentAddressError('')
    setCheckoutError('')
    setShowPaymentModal(true)
  }

  const handlePaymentSelect = async (paymentMethod: 'cash' | 'card') => {
    if (!validatePhoneNumber(phoneNumber)) return

    const effectiveAddress = customerAddress || paymentAddressInput.trim()
    if (!effectiveAddress) {
      setPaymentAddressError('Teslimat adresi zorunludur')
      return
    }
    setPaymentAddressError('')

    setIsProcessing(true)
    setCheckoutError('')

    try {
      const customerId = localStorage.getItem('customer_id')

      // Telefonu teyit edilmiş numara ile güncelle
      localStorage.setItem('customer_phone', phoneNumber)
      if (customerId) {
        await supabase.from('customers').update({ phone: phoneNumber }).eq('id', customerId)
      }

      // Adres henüz kayıtlı değilse kaydet
      if (!customerAddress && paymentAddressInput.trim()) {
        localStorage.setItem('customer_address', paymentAddressInput.trim())
        setCustomerAddress(paymentAddressInput.trim())
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('user_addresses').insert([{
            user_id: user.id,
            title: 'Teslimat Adresim',
            full_address: paymentAddressInput.trim(),
            latitude: 41.492892,
            longitude: 36.081592,
          }])
        }
      }

      setShowPaymentModal(false)
      await handleCheckout(paymentMethod, phoneNumber)
    } catch (err: any) {
      setCheckoutError('Sipariş oluşturulurken hata: ' + (err.message || 'Bilinmeyen hata'))
      setShowPaymentModal(true)
    } finally {
      setIsProcessing(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GERÇEK SİPARİŞ OLUŞTURMA — DB'ye INSERT
  // ═══════════════════════════════════════════════════════════════
  const handleCheckout = async (paymentMethod: 'cash' | 'card', customerPhone: string) => {
    if (cart.length === 0) return
    setCheckoutError('')

    const customerId = localStorage.getItem('customer_id')
    const customerName = localStorage.getItem('customer_name')
    const storedAddress = localStorage.getItem('customer_address')

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

      {/* Ödeme Yöntemi Modalı — telefon teyidi + Nakit / Kapıda Kredi Kartı */}
      <Portal>
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-end justify-center z-[10000]"
            onClick={() => !isProcessing && setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-[450px] rounded-t-3xl p-4 sm:p-6 safe-area-footer"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

              <h3 className="text-[22px] font-bold text-[#3c4043] mb-2 text-center">
                Ödeme Yöntemi Seçin
              </h3>
              <p className="text-[14px] text-[#6f6f6f] mb-6 text-center">
                Toplam: <span className="font-bold text-[#f59e0b]">{total.toFixed(2)}₺</span>
              </p>

              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  Telefon Numarası <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-[#6f6f6f] mb-2">
                  (başında 0 olmadan 10 hane)
                </p>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="5675551122"
                  className={`w-full bg-slate-100 rounded-lg p-3 text-[16px] border-2 transition-colors outline-none ${
                    phoneError
                      ? 'border-red-500'
                      : phoneNumber.length > 0 && isPhoneValid
                      ? 'border-green-500'
                      : 'border-transparent focus:border-orange-500'
                  }`}
                  disabled={isProcessing}
                />
                {phoneError && (
                  <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    {phoneError}
                  </p>
                )}
                {phoneNumber.length > 0 && isPhoneValid && (
                  <p className="text-[12px] text-green-600 mt-1 flex items-center gap-1">
                    <span>✓</span>
                    Telefon numarası geçerli
                  </p>
                )}
              </div>

              {!customerAddress && (
                <div className="mb-6">
                  <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                    Teslimat Adresi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Örn: 19 Mayıs KYK Yurdu, A Blok, Kat 3, No 12"
                    value={paymentAddressInput}
                    onChange={(e) => { setPaymentAddressInput(e.target.value); setPaymentAddressError('') }}
                    rows={3}
                    className={`w-full bg-slate-100 rounded-lg p-3 text-[14px] border-2 transition-colors outline-none resize-none ${
                      paymentAddressError ? 'border-red-500' : 'border-transparent focus:border-orange-500'
                    }`}
                    disabled={isProcessing}
                  />
                  {paymentAddressError && (
                    <p className="text-[12px] text-red-500 mt-1">⚠️ {paymentAddressError}</p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => handlePaymentSelect('cash')}
                  disabled={isProcessing || !isPhoneValid || !isPaymentAddressValid}
                  className={`w-full h-[72px] rounded-2xl flex items-center justify-center gap-4 transition-all shadow-lg ${
                    isPhoneValid && isPaymentAddressValid && !isProcessing
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                      : 'bg-gray-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Banknote size={32} strokeWidth={2.5} className={isPhoneValid && isPaymentAddressValid ? 'text-white' : 'text-gray-500'} />
                  <div className="text-left">
                    <div className={`text-[18px] font-bold ${isPhoneValid && isPaymentAddressValid ? 'text-white' : 'text-gray-500'}`}>
                      Nakit
                    </div>
                    <div className={`text-[13px] ${isPhoneValid && isPaymentAddressValid ? 'text-white opacity-90' : 'text-gray-500'}`}>
                      Kapıda nakit ödeme
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentSelect('card')}
                  disabled={isProcessing || !isPhoneValid || !isPaymentAddressValid}
                  className={`w-full h-[72px] rounded-2xl flex items-center justify-center gap-4 transition-all shadow-lg ${
                    isPhoneValid && isPaymentAddressValid && !isProcessing
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                      : 'bg-gray-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  <CreditCard size={32} strokeWidth={2.5} className={isPhoneValid && isPaymentAddressValid ? 'text-white' : 'text-gray-500'} />
                  <div className="text-left">
                    <div className={`text-[18px] font-bold ${isPhoneValid && isPaymentAddressValid ? 'text-white' : 'text-gray-500'}`}>
                      Kapıda Kredi Kartı
                    </div>
                    <div className={`text-[13px] ${isPhoneValid && isPaymentAddressValid ? 'text-white opacity-90' : 'text-gray-500'}`}>
                      Kartla ödeme yapın
                    </div>
                  </div>
                </button>
              </div>

              {(!isPhoneValid || !isPaymentAddressValid) && (
                <p className="text-[12px] text-center text-[#6f6f6f] mt-3">
                  Devam etmek için {!isPhoneValid ? 'telefon numaranızı' : 'teslimat adresinizi'} girin
                </p>
              )}

              {isProcessing && (
                <div className="mt-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#f59e0b] border-t-transparent" />
                  <p className="text-[13px] text-[#6f6f6f] mt-2">Sipariş oluşturuluyor...</p>
                </div>
              )}
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
