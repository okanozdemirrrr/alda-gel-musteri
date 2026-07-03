'use client'

import { useState } from 'react'
import AuthModal from './AuthModal'
import Portal from './Portal'

interface GuestLoginPromptProps {
  onClose: () => void
  onLoginSuccess?: () => void
}

export default function GuestLoginPrompt({ onClose, onLoginSuccess }: GuestLoginPromptProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleLoginSuccess = (_name: string) => {
    setShowAuthModal(false)
    onLoginSuccess?.()
    onClose()
  }

  if (showAuthModal) {
    return (
      <AuthModal
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    )
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-[9999] flex items-center justify-center h-[100dvh] w-screen bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <h3 className="text-[18px] font-bold text-white mb-1">Giriş Gerekli</h3>
          <p className="text-[13px] text-white/80">
            Sipariş verebilmek için lütfen giriş yapın veya kayıt olun
          </p>
        </div>

        <div className="p-5 space-y-3">
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full min-h-[48px] bg-[#f59e0b] text-white rounded-xl font-bold text-[14px] hover:bg-[#d97706] transition-colors shadow-md"
            style={{ fontFamily: 'Open Sans, sans-serif' }}
          >
            Giriş Yap / Kayıt Ol
          </button>
          <button
            onClick={onClose}
            className="w-full min-h-[48px] border-2 border-[#e8e8e8] text-[#6f6f6f] rounded-xl font-semibold text-[14px] hover:bg-[#f7f7f7] transition-colors"
            style={{ fontFamily: 'Open Sans, sans-serif' }}
          >
            Alışverişe Devam Et
          </button>
        </div>
      </div>
    </div>
    </Portal>
  )
}
