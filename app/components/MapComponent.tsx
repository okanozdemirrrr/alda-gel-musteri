'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapComponentProps {
  center: [number, number]
  onLocationChange: (lat: number, lng: number) => void
  shouldFlyTo?: boolean // Sadece KYK/Fakülte için true
}

export default function MapComponent({ center, onLocationChange, shouldFlyTo = false }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [currentCenter, setCurrentCenter] = useState(center)
  const isUserDragging = useRef(false)
  const initialCenter = useRef(center)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Haritayı sadece BİR KEZ oluştur
    const map = L.map(mapContainerRef.current, {
      center: initialCenter.current,
      zoom: 15,
      zoomControl: true
    })

    // OpenStreetMap tile layer ekle
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    mapRef.current = map

    // Kullanıcı haritayı sürüklemeye başladığında
    map.on('dragstart', () => {
      isUserDragging.current = true
    })

    // Kullanıcı haritayı sürüklemeyi bitirdiğinde
    map.on('dragend', () => {
      isUserDragging.current = false
    })

    // Harita hareket ettiğinde merkez koordinatları güncelle
    map.on('move', () => {
      const center = map.getCenter()
      setCurrentCenter([center.lat, center.lng])
      onLocationChange(center.lat, center.lng)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // Sadece ilk render'da çalış

  // FlyTo sadece shouldFlyTo true olduğunda (KYK/Fakülte)
  useEffect(() => {
    if (mapRef.current && shouldFlyTo && !isUserDragging.current) {
      // Jet gibi uç!
      mapRef.current.flyTo(center, 16, {
        duration: 1.5,
        easeLinearity: 0.25
      })
    }
  }, [center, shouldFlyTo])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Sabit Pin (Haritanın Ortasında) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none z-[1000]">
        <svg width="40" height="50" viewBox="0 0 24 30" fill="none">
          <path
            d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 14 8 14s8-8.5 8-14c0-4.42-3.58-8-8-8z"
            fill="#f59e0b"
            stroke="white"
            strokeWidth="1"
          />
          <circle cx="12" cy="8" r="3" fill="white" />
        </svg>
      </div>

      {/* Koordinat Göstergesi */}
      <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg z-[1000]">
        <p className="text-[11px] font-mono text-[#3c4043]">
          {currentCenter[0].toFixed(6)}, {currentCenter[1].toFixed(6)}
        </p>
      </div>
    </div>
  )
}

