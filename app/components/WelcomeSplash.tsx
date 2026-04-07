'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

interface WelcomeSplashProps {
  name: string
  onComplete: () => void
}

export default function WelcomeSplash({ name, onComplete }: WelcomeSplashProps) {
  useEffect(() => {
    // Animasyonu kısalttık: 1800ms (daha hızlı)
    const timer = setTimeout(() => {
      onComplete()
    }, 1800)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-[#f59e0b] flex items-center justify-center z-[100]"
      style={{
        // GPU hızlandırma
        transform: 'translateZ(0)',
        willChange: 'opacity'
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          delay: 0.5, // Veri yüklenmesine zaman tanı
          duration: 0.4,
          ease: 'easeOut'
        }}
        className="text-center"
        style={{
          // GPU hızlandırma + Layout shift önleme
          transform: 'translateZ(0)',
          willChange: 'opacity',
          minHeight: '120px', // Yer rezervasyonu
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        {/* Basitleştirilmiş: Tek seferde fade-in, harf harf yok */}
        <h1
          className="text-[48px] font-bold text-white mb-2"
          style={{ 
            fontFamily: 'Open Sans, sans-serif',
            transform: 'translateZ(0)' // GPU hızlandırma
          }}
        >
          Hoş geldiniz,
        </h1>
        <h2
          className="text-[36px] font-bold text-white"
          style={{ 
            fontFamily: 'Open Sans, sans-serif',
            transform: 'translateZ(0)' // GPU hızlandırma
          }}
        >
          {name}
        </h2>
      </motion.div>
    </motion.div>
  )
}

