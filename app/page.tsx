'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, FileText, User, ShoppingCart, UtensilsCrossed, ChevronRight, MapPin } from 'lucide-react'
import AuthModal from './components/AuthModal'
import AddressModal from './components/AddressModal'
import WelcomeSplash from './components/WelcomeSplash'
import NotificationBell from './components/NotificationBell'
import PushNotificationPrompt from './components/PushNotificationPrompt'
import { isMobile } from './lib/platform'

// Mobil için animasyon devre dışı
const shouldAnimate = !isMobile()

// ─── YEMEK / MARKET SEÇİM KARTLARI ──────────────────────────────
function SplitScreenSelector() {
  const router = useRouter()

  const cards = [
    {
      label: 'YEMEK',
      sub: 'Restoranlardan sipariş ver',
      icon: UtensilsCrossed,
      route: '/restoranlar',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
      from: 'from-amber-500',
      to: 'to-orange-600',
      hoverFrom: 'group-hover:from-amber-400',
      hoverTo: 'group-hover:to-orange-500',
    },
    {
      label: 'MARKET',
      sub: 'Marketlerden alışveriş yap',
      icon: ShoppingCart,
      route: '/market',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
      from: 'from-emerald-500',
      to: 'to-teal-600',
      hoverFrom: 'group-hover:from-emerald-400',
      hoverTo: 'group-hover:to-teal-500',
    },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <motion.button
              key={card.label}
              onClick={() => router.push(card.route)}
              whileHover={shouldAnimate ? { scale: 1.02 } : {}}
              whileTap={shouldAnimate ? { scale: 0.98 } : {}}
              className="relative overflow-hidden rounded-3xl h-64 md:h-72 group cursor-pointer shadow-lg"
            >
              {/* Arka plan fotoğraf */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${card.image})` }}
              />

              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.from}/80 ${card.to}/90 transition-all duration-300 ${card.hoverFrom} ${card.hoverTo}`}
              />

              {/* İçerik */}
              <div className="relative h-full flex flex-col items-center justify-center text-white p-6">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl mb-4 group-hover:bg-white/30 transition-colors">
                  <Icon size={36} strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                  {card.label}
                </h2>
                <p className="text-sm md:text-base font-medium opacity-90 mb-4">
                  {card.sub}
                </p>
                <div className="flex items-center gap-1 text-sm font-bold bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                  Keşfet
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ─── ANA SAYFA ─────────────────────────────────────────────────
export default function MusteriAnaSayfa() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [selectedAddress, setSelectedAddress] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const customerId = localStorage.getItem('customer_id')
    const name = localStorage.getItem('customer_name')
    const address = localStorage.getItem('customer_address')

    if (customerId && name) {
      setIsLoggedIn(true)
      setCustomerName(name)
      if (address) setSelectedAddress(address)
    }
  }, [])

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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const handleAddressClick = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true)
    } else {
      setShowAddressModal(true)
    }
  }

  const handleLoginSuccess = (name: string) => {
    setIsLoggedIn(true)
    setCustomerName(name)
    setShowAuthModal(false)
    setShowWelcomeSplash(true)
  }

  const handleAddressSelect = (address: string) => {
    setSelectedAddress(address)
    setShowAddressModal(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('customer_id')
    localStorage.removeItem('customer_name')
    localStorage.removeItem('customer_address')
    setIsLoggedIn(false)
    setCustomerName('')
    setSelectedAddress('')
  }

  return (
    <>
      {/* Welcome Splash */}
      {showWelcomeSplash && (
        <WelcomeSplash name={customerName} onComplete={() => setShowWelcomeSplash(false)} />
      )}

      <div className="min-h-screen bg-stone-50 overflow-x-hidden">
        {/* ═══ HEADER ═══ */}
        <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-50 safe-area-header">
          <div className="max-w-6xl mx-auto px-4 min-h-16 py-2 flex items-center justify-between">
            {/* Sol: Logo + Adres */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/')}
                className="flex-shrink-0 flex items-center"
              >
                <Image
                  src="/logo.png"
                  alt="Alda-Gel Logo"
                  width={102}
                  height={34}
                  className="object-contain w-[68px] md:w-24 lg:w-[108px] h-auto"
                  priority
                />
              </button>

              <button
                onClick={handleAddressClick}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-full transition-all text-sm"
              >
                <MapPin size={14} className="text-amber-600 flex-shrink-0" />
                <span className="text-stone-700 font-medium truncate max-w-[160px]">
                  {selectedAddress || 'Adres Seç'}
                </span>
              </button>
            </div>

            {/* Sağ: Auth / User */}
            <div className="flex items-center gap-2">
              {!isLoggedIn ? (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-5 py-2.5 min-h-[44px] text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-full transition-all shadow-md hover:shadow-lg"
                >
                  Giriş Yap
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Kullanıcı Avatar */}
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {customerName.charAt(0).toUpperCase()}
                  </div>

                  {/* Hamburger */}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-500 hover:text-amber-600 transition-colors rounded-full hover:bg-stone-100"
                    >
                      <Menu size={20} />
                    </button>

                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full right-0 z-[60] mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden"
                        >
                          <button
                            onClick={() => { setShowMenu(false); router.push('/siparislerim') }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-stone-700 hover:bg-amber-50 transition-colors text-left"
                          >
                            <FileText size={18} className="text-amber-600" />
                            <span className="text-sm font-medium">Geçmiş Siparişlerim</span>
                          </button>
                          <button
                            onClick={() => { setShowMenu(false); router.push('/yardim') }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-stone-700 hover:bg-amber-50 transition-colors text-left"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            <span className="text-sm font-medium">Yardım Merkezi</span>
                          </button>
                          <button
                            onClick={() => { setShowMenu(false); router.push('/profil') }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-stone-700 hover:bg-amber-50 transition-colors text-left"
                          >
                            <User size={18} className="text-amber-600" />
                            <span className="text-sm font-medium">Profilim</span>
                          </button>
                          <button
                            onClick={() => { setShowMenu(false); handleLogout() }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors text-left border-t border-stone-100"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            <span className="text-sm font-medium">Çıkış Yap</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <NotificationBell />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ═══ MOBİL ADRES BAR ═══ */}
        {isLoggedIn && (
          <div className="sm:hidden bg-white border-b border-stone-100 px-4 py-2.5">
            <button
              onClick={handleAddressClick}
              className="flex items-center gap-2 w-full text-left min-h-[44px] py-1"
            >
              <MapPin size={16} className="text-amber-600 flex-shrink-0" />
              <span className="text-sm text-stone-600 truncate">
                {selectedAddress || 'Adresinizi Seçin'}
              </span>
            </button>
          </div>
        )}

        {/* ═══ HERO SECTION ═══ */}
        <main className="relative">
          {/* Arka plan görseli */}
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/alda-gel-hero.png)' }}
            />
            {/* Karartma overlay — metin okunurluğu için zorunlu */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-stone-900/80" />
          </div>

          {/* İçerik */}
          <div className="relative z-10 max-w-6xl mx-auto px-4">
            {!isLoggedIn || !selectedAddress ? (
              /* ═══ GİRİŞ YAPMAMIŞ / ADRES SEÇMEMİŞ ═══ */
              <div className="min-h-[60vh] sm:min-h-[70vh] flex items-center justify-center py-10 sm:py-16">
                <motion.div
                  initial={shouldAnimate ? { opacity: 0, y: 30 } : {}}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-[90%] md:w-[600px] lg:w-[800px]"
                >
                  {/* Yarı saydam panel — backdrop-blur ile metin arka plandan ayrılır */}
                  <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border border-white/30">
                    {/* Başlık */}
                    <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#3E1F0C] mb-2 sm:mb-3 tracking-tight leading-tight">
                      Alda-Gel Yemek & Sanal Market
                    </h1>

                    {/* Alt başlık */}
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-stone-500 mb-5 sm:mb-6 md:mb-8 font-medium leading-relaxed">
                      Samsun 19 Mayıs'ta lezzetli ve hızlı teslimat.
                    </p>

                    {/* CTA Butonu — hover parlaması */}
                    <button
                      onClick={handleAddressClick}
                      className="group w-full sm:w-auto px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 min-h-[48px] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm sm:text-base md:text-lg lg:text-xl font-black rounded-2xl transition-all duration-300 shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_40px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 sm:gap-3"
                    >
                      <span>Keşfet ve Başla</span>
                      <ChevronRight
                        size={20}
                        className="group-hover:translate-x-1 transition-transform sm:w-6 sm:h-6"
                      />
                    </button>

                    {/* Alt bilgi */}
                    <p className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-stone-400 font-medium">
                      {!isLoggedIn ? 'Giriş yaparak başlayın' : 'Adresinizi seçerek başlayın'}
                    </p>
                  </div>

                  {/* Trust badges */}
                  <div className="mt-6 flex items-center justify-center gap-3 sm:gap-6 text-white/80 text-xs sm:text-sm flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span className="font-medium">Komisyon Yok</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span className="font-medium">Hızlı Teslimat</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span className="font-medium">Yerel Lezzetler</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              /* ═══ GİRİŞ YAPMIŞ + ADRES SEÇMİŞ ═══ */
              <>
                {/* Karşılama + Split Screen */}
                <div className="pt-10 pb-6">
                  <motion.div
                    initial={shouldAnimate ? { opacity: 0, y: 20 } : {}}
                    animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                  >
                    <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg mb-2">
                      Hoş Geldin, <span className="text-amber-300">{customerName}</span>
                    </h1>
                    <p className="text-white/80 text-base sm:text-lg font-medium drop-shadow">
                      Bugün ne yemek istersin?
                    </p>
                  </motion.div>

                  <SplitScreenSelector />
                </div>
              </>
            )}
          </div>
        </main>

        {/* ═══ ALT BÖLÜM: ÖZELLİKLER ═══ */}
        {!isLoggedIn || !selectedAddress ? (
          <section className="bg-stone-50 py-16 px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-black text-[#3E1F0C] mb-3">
                  Neden Alda Gel?
                </h2>
                <p className="text-stone-500 text-base sm:text-lg">
                  19 Mayıs'ın kendi yemek ve market uygulaması.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    emoji: '🍔',
                    title: 'Lezzetli Yemekler',
                    desc: 'Mahallenizin en iyi restoranlarından enfes burger, dürüm ve daha fazlası.',
                  },
                  {
                    emoji: '🛵',
                    title: 'Hızlı Teslimat',
                    desc: 'Siparişiniz ortalama 25 dakikada kapınızda. Takip edebilirsiniz.',
                  },
                  {
                    emoji: '💰',
                    title: 'Komisyon Yok',
                    desc: 'Restoran sahiplerine %0 komisyon ile daha uygun fiyatlar.',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={shouldAnimate ? { opacity: 0, y: 20 } : {}}
                    whileInView={shouldAnimate ? { opacity: 1, y: 0 } : {}}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.5 }}
                    className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
                  >
                    <div className="text-4xl mb-4">{item.emoji}</div>
                    <h3 className="text-lg font-bold text-[#3E1F0C] mb-2">{item.title}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ═══ FOOTER ═══ */}
        <footer className="bg-stone-900 text-stone-400 py-8 px-4 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm">
              Alda Gel — Samsun 19 Mayıs
            </p>
            <p className="text-xs mt-1 opacity-60">
              Yerel esnaf, yerel lezzet, yerel hız.
            </p>
          </div>
        </footer>
      </div>

      {/* ═══ MODALLAR ═══ */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {showAddressModal && (
        <AddressModal
          onClose={() => setShowAddressModal(false)}
          onAddressSelect={handleAddressSelect}
        />
      )}

      {isLoggedIn && <PushNotificationPrompt />}
    </>
  )
}
