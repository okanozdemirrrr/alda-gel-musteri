'use client'

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
 * Eski sürüm useState(false) + useEffect ile mount'u bekliyordu; bu, hydration
 * tamamlanana kadar BottomNavigation gibi kalıcı UI'ın DOM'da hiç olmamasına ve
 * ilk tıklamaların boşa gitmesine yol açıyordu. Artık document mevcutsa
 * (yani client'ta) ilk render'da portal anında oluşturulur. Portal içeriği
 * server HTML'inin parçası olmadığı için hydration uyuşmazlığı üretmez;
 * SSG/build aşamasında ise document tanımsız olduğundan null döner.
 */
interface PortalProps {
  children: React.ReactNode
}

export default function Portal({ children }: PortalProps) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
