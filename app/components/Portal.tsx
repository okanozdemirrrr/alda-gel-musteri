'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * React Portal wrapper — içeriği doğrudan document.body üzerine render eder.
 *
 * Neden gerekli?
 * .gpu-layer / .scroll-surface / .app-page gibi sınıflar `transform: translateZ(0)`
 * kullanır. CSS stacking context kuralı gereği, transform'lu bir ancestor içindeki
 * `position: fixed` elemanlar viewport yerine o ancestor'a göre konumlanır.
 * Portal, modal içeriğini body'e taşıyarak bu sorunun kökten önüne geçer.
 */
interface PortalProps {
  children: React.ReactNode
}

export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null
  return createPortal(children, document.body)
}
