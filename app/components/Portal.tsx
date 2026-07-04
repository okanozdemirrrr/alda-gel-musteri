'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * React Portal wrapper — içeriği doğrudan document.body üzerine render eder.
 *
 * Neden gerekli?
 * .gpu-layer / .scroll-surface / .app-page gibi sınıflar `transform: translateZ(0)`
 * kullanır. CSS stacking context kuralı gereği, transform'lu bir ancestor içindeki
 * `position: fixed` elemanlar viewport yerine o ancestor'a göre konumlanır.
 * Portal, modal içeriğini body'e taşıyarak bu sorunun kökten önüne geçer.
 *
 * Render zamanlaması:
 * Hydration geçişinde client render'ın sunucu HTML'iyle birebir eşleşmesi gerekir;
 * sunucu portal içeriğini üretemediği için ilk client render'da da null dönmek
 * zorunludur (aksi halde "Hydration failed" hatası oluşur). Gecikmeyi sıfırlamak
 * için mount bayrağı useEffect yerine useLayoutEffect ile set edilir: DOM commit
 * edilir edilmez, tarayıcı EKRANA ÇİZMEDEN ÖNCE senkron olarak yeniden render
 * tetiklenir. Böylece BottomNavigation gibi kalıcı UI ilk boyamada ekranda olur
 * ve ilk dokunuşlar kaybolmaz.
 */
interface PortalProps {
  children: React.ReactNode
}

// SSR/SSG sırasında useLayoutEffect uyarısını önlemek için izomorfik sürüm
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false)

  useIsomorphicLayoutEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null
  return createPortal(children, document.body)
}
