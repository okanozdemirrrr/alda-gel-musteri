'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, ClipboardList, ShoppingBag, User } from 'lucide-react'
import { useCart } from '@/app/context/CartContext'

const NAV_ITEMS = [
  { href: '/', label: 'Ana Sayfa', icon: Home, match: (p: string) => p === '/' },
  { href: '/restoranlar', label: 'Yemek', icon: UtensilsCrossed, match: (p: string) => p.startsWith('/restoranlar') || p.startsWith('/restoran/') },
  { href: '/siparislerim', label: 'Siparişler', icon: ClipboardList, match: (p: string) => p.startsWith('/siparislerim') },
  { href: '/sepet', label: 'Sepet', icon: ShoppingBag, match: (p: string) => p === '/sepet' },
  { href: '/profil', label: 'Profil', icon: User, match: (p: string) => p.startsWith('/profil') || p.startsWith('/bildirimler') || p.startsWith('/yardim') },
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
  const { getCartItemCount } = useCart()
  const cartCount = getCartItemCount()

  if (!shouldShowBottomNav(pathname)) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div className="w-full max-w-full mx-auto flex items-stretch justify-around h-[var(--bottom-nav-height)]">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname)
          const isCart = href === '/sepet'

          return (
            <Link
              key={href}
              href={href}
              className={`touch-press flex flex-col items-center justify-center flex-1 min-w-0 gap-0.5 transition-colors ${
                active ? 'text-amber-600' : 'text-stone-400'
              }`}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] truncate max-w-full px-1 ${active ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
