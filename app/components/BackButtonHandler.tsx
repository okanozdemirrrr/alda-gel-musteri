'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

export default function BackButtonHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    let listenerHandle: { remove: () => void } | null = null

    const setupListener = async () => {
      listenerHandle = await App.addListener('backButton', ({ canGoBack }) => {
        if (pathname === '/' || pathname === '/musteri') {
          App.exitApp()
          return
        }

        if (canGoBack) {
          router.back()
        } else {
          router.push('/')
        }
      })
    }

    setupListener()

    return () => {
      listenerHandle?.remove()
    }
  }, [pathname, router])

  return null
}
