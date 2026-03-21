import './globals.css'
import type { Metadata } from 'next'
import { CartProvider } from './context/CartContext'

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
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
