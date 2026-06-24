'use client'

import { useState } from 'react'
import { assetUrl } from '@/app/lib/site'

interface StableImageProps {
  src?: string | null
  alt: string
  className?: string
  containerClassName?: string
  aspectRatio?: string
  fixedHeight?: number | string
  fixedWidth?: number | string
  fallback?: React.ReactNode
  objectFit?: 'cover' | 'contain'
  priority?: boolean
}

export default function StableImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  aspectRatio,
  fixedHeight,
  fixedWidth,
  fallback,
  objectFit = 'cover',
  priority = false,
}: StableImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const containerStyle: React.CSSProperties = {}
  if (aspectRatio) containerStyle.aspectRatio = aspectRatio
  if (fixedHeight !== undefined) {
    containerStyle.height = typeof fixedHeight === 'number' ? `${fixedHeight}px` : fixedHeight
  }
  if (fixedWidth !== undefined) {
    containerStyle.width = typeof fixedWidth === 'number' ? `${fixedWidth}px` : fixedWidth
  }

  const showFallback = !src || failed

  return (
    <div
      className={`gpu-layer relative overflow-hidden bg-stone-100 flex-shrink-0 ${containerClassName}`}
      style={containerStyle}
    >
      {showFallback ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
          {fallback ?? <span className="text-2xl opacity-60">🍽️</span>}
        </div>
      ) : (
        <>
          {!loaded && <div className="absolute inset-0 skeleton z-[1]" aria-hidden />}
          <img
            src={assetUrl(src)}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`absolute inset-0 w-full h-full z-[2] transition-opacity duration-200 ${
              loaded ? 'opacity-100' : 'opacity-0'
            } ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`}
          />
        </>
      )}
    </div>
  )
}
