import './globals.css'
import type { Metadata } from 'next'
import { CartProvider } from './context/CartContext'
import BackButtonHandler from './components/BackButtonHandler'
import DeliveryTracker from './components/DeliveryTracker'

export const metadata: Metadata = {
  title: 'Alda Gel - Müşteri',
  description: 'Samsun 19 Mayıs hızlı teslimat',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>
        <CartProvider>
          <BackButtonHandler />
          <DeliveryTracker />
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
