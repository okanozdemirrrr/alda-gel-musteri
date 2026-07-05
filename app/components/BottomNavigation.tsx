'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, UtensilsCrossed, ClipboardList, ShoppingBag, User } from 'lucide-react'
import { useCart } from '@/app/context/CartContext'
import Portal from './Portal'
import GuestLoginPrompt from './GuestLoginPrompt'

interface NavItem {
  href: string
  label: string
  icon: typeof Home
  match: (p: string) => boolean
  /** true ise misafir kullanıcı tıkladığında navigasyon durdurulur, Giriş Gerekli modalı açılır */
  requiresAuth: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Ana Sayfa', icon: Home, match: (p) => p === '/', requiresAuth: false },
  { href: '/restoranlar', label: 'Yemek', icon: UtensilsCrossed, match: (p) => p.startsWith('/restoranlar') || p.startsWith('/restoran/'), requiresAuth: false },
  { href: '/siparislerim', label: 'Siparişlerim', icon: ClipboardList, match: (p) => p.startsWith('/siparislerim'), requiresAuth: true },
  { href: '/sepet', label: 'Sepet', icon: ShoppingBag, match: (p) => p === '/sepet', requiresAuth: false },
  { href: '/profil', label: 'Profil', icon: User, match: (p) => p.startsWith('/profil') || p.startsWith('/bildirimler') || p.startsWith('/yardim'), requiresAuth: true },
]

export function shouldShowBottomNav(pathname: string): boolean {
  if (pathname.startsWith('/restoran/')) return false
  if (pathname === '/sepet') return false
  if (pathname.startsWith('/gizlilik-politikasi')) return false
  if (pathname.startsWith('/hesap-sil')) return false
  return true
}

export default function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { getCartItemCount } = useCart()
  const cartCount = getCartItemCount()
  const [showGuestPrompt, setShowGuestPrompt] = useState(false)
  const [pendingRoute, setPendingRoute] = useState<string | null>(null)

  if (!shouldShowBottomNav(pathname)) return null

  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    if (!item.requiresAuth) return
    const customerId = typeof window !== 'undefined' ? localStorage.getItem('customer_id') : null
    if (!customerId) {
      // Misafir: sayfaya gidip guard'dan geri sekmesin; navigasyonu durdur, modal aç
      e.preventDefault()
      setPendingRoute(item.href)
      setShowGuestPrompt(true)
    }
  }

  return (
    <>
      {showGuestPrompt && (
        <GuestLoginPrompt
          onClose={() => {
            setShowGuestPrompt(false)
            setPendingRoute(null)
          }}
          onLoginSuccess={() => {
            setShowGuestPrompt(false)
            if (pendingRoute) {
              router.push(pendingRoute)
              setPendingRoute(null)
            }
          }}
        />
      )}

      <Portal>
        <nav
          className="fixed bottom-0 left-0 right-0 z-[9998] bg-white border-t border-stone-200 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)',
          }}
        >
          <div className="w-full max-w-lg mx-auto flex items-stretch justify-between h-[var(--bottom-nav-height)] px-1">
            {NAV_ITEMS.map((item) => {
              const { href, label, icon: Icon, match } = item
              const active = match(pathname)
              const isCart = href === '/sepet'

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`touch-press cursor-pointer select-none flex flex-col items-center justify-center flex-1 min-w-0 gap-0.5 active:text-amber-600 ${
                    active ? 'text-amber-600' : 'text-stone-400'
                  }`}
                >
                  <span className="relative">
                    <Icon size={19} strokeWidth={active ? 2.5 : 2} />
                    {isCart && cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </span>
                  <span className={`text-[9px] leading-tight truncate max-w-full px-0.5 ${active ? 'font-bold' : 'font-medium'}`}>
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </Portal>
    </>
  )
}
