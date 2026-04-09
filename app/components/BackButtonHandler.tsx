'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { App } from '@capacitor/app'

export default function BackButtonHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Android geri tuşu için listener
    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      // Ana sayfadaysa uygulamadan çık
      if (pathname === '/' || pathname === '/musteri') {
        App.exitApp()
        return
      }

      // Diğer sayfalarda geri git
      if (canGoBack) {
        router.back()
      } else {
        // Geri gidecek sayfa yoksa ana sayfaya yönlendir
        router.push('/')
      }
    })

    // Cleanup
    return () => {
      backButtonListener.remove()
    }
  }, [pathname, router])

  return null // Bu component UI render etmez
}
