import './globals.css'
import type { Metadata, Viewport } from 'next'
import { CartProvider } from './context/CartContext'
import BackButtonHandler from './components/BackButtonHandler'
import DeliveryTracker from './components/DeliveryTracker'
import AppShell from './components/AppShell'

export const metadata: Metadata = {
  title: 'Alda Gel - Müşteri',
  description: 'Samsun 19 Mayıs hızlı teslimat',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
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
          <AppShell>{children}</AppShell>
        </CartProvider>
      </body>
    </html>
  )
}
