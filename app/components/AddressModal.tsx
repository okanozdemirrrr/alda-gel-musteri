'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import dynamic from 'next/dynamic'

// Leaflet'i dinamik import et (SSR sorunlarını önlemek için)
const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

interface AddressModalProps {
  onClose: () => void
  onAddressSelect: (address: string) => void
}

interface QuickLocation {
  name: string
  lat: number
  lng: number
  neighborhood?: string
  streetAddress?: string
  floor?: string
  doorNumber?: string
  notes?: string
  isManual?: boolean // Hangarlar gibi manuel dolum gereken yerler
}

const SAMSUN_QUICK_LOCATIONS: QuickLocation[] = [
  { 
    name: '19 Mayıs KYK Yurdu', 
    lat: 41.5110, 
    lng: 36.1154,
    neighborhood: 'İstiklal',
    streetAddress: 'Denizevleri',
    floor: '1',
    doorNumber: '1',
    notes: '19 Mayıs KYK Yurdu'
  },
  { 
    name: 'Mühendislik Fakültesi Kampüsü', 
    lat: 41.5098, 
    lng: 36.1154,
    neighborhood: 'İstiklal',
    streetAddress: 'Denizevleri',
    floor: '1',
    doorNumber: '1',
    notes: 'Mühendislik ve Sivil Havacılık Fakültesi'
  },
  { 
    name: 'Hangarlar Bölgesi', 
    lat: 0,  // Kullanılmayacak
    lng: 0,  // Kullanılmayacak
    isManual: true // Manuel dolum gerekli, koordinat değişmez
  }
]

export default function AddressModal({ onClose, onAddressSelect }: AddressModalProps) {
  const [step, setStep] = useState<'quick' | 'map' | 'details'>('quick')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [addressName, setAddressName] = useState('Ev')
  const [selectedQuickLocation, setSelectedQuickLocation] = useState('')
  const [latitude, setLatitude] = useState(41.492892)
  const [longitude, setLongitude] = useState(36.081592)
  const [district, setDistrict] = useState('19 Mayıs')
  const [neighborhood, setNeighborhood] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [floor, setFloor] = useState('')
  const [doorNumber, setDoorNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [shouldFlyToLocation, setShouldFlyToLocation] = useState(false) // FlyTo kontrolü

  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Tarayıcınız konum servislerini desteklemiyor')
      setTimeout(() => setError(''), 3000)
      return
    }

    setLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        setLatitude(lat)
        setLongitude(lng)
        setShouldFlyToLocation(true)
        setSelectedQuickLocation('') // Quick location seçimini temizle
        setStep('map')
        setLoading(false)
      },
      (error) => {
        setLoading(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Konum izni reddedildi. Lütfen tarayıcı ayarlarından konum iznini açın.')
            break
          case error.POSITION_UNAVAILABLE:
            setError('Konum bilgisi alınamadı. Lütfen tekrar deneyin.')
            break
          case error.TIMEOUT:
            setError('Konum talebi zaman aşımına uğradı. Lütfen tekrar deneyin.')
            break
          default:
            setError('Konum alınırken bir hata oluştu.')
        }
        setTimeout(() => setError(''), 5000)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleQuickLocationSelect = (location: QuickLocation) => {
    setSelectedQuickLocation(location.name)
    
    // Eğer manuel dolum gerekliyse (Hangarlar), koordinatları değiştirme
    if (location.isManual) {
      // Koordinatları OLDUĞU GİBİ BIRAK (kullanıcının mevcut konumu)
      setShouldFlyToLocation(false) // FlyTo YOK
      
      // Form alanlarını temizle
      setNeighborhood('')
      setStreetAddress('')
      setFloor('')
      setDoorNumber('')
      setNotes('')
      setAddressName('Ev') // Varsayılan
    } else {
      // Ön tanımlı lokasyonlar için koordinatları ayarla ve FlyTo aktif et
      setLatitude(location.lat)
      setLongitude(location.lng)
      setShouldFlyToLocation(true) // JET GİBİ UÇ! 🚀
      
      // Ön tanımlı verileri doldur
      setNeighborhood(location.neighborhood || '')
      setStreetAddress(location.streetAddress || '')
      setFloor(location.floor || '')
      setDoorNumber(location.doorNumber || '')
      setNotes(location.notes || '')
      
      // Adres ismini akıllıca ayarla
      if (location.name.includes('KYK') || location.name.includes('Yurt')) {
        setAddressName('Yurt')
      } else if (location.name.includes('Fakülte') || location.name.includes('Kampüs')) {
        setAddressName('İş')
      } else {
        setAddressName('Ev')
      }
    }
    
    setStep('map')
  }

  const handleMapConfirm = (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
    setStep('details')
  }

  const handleSaveAddress = async () => {
    setLoading(true)
    setError('')

    try {
      const customerId = localStorage.getItem('customer_id')
      if (!customerId) {
        throw new Error('Lütfen önce giriş yapın')
      }

      const fullAddress = `${addressName} - ${neighborhood}, ${streetAddress}, Kat: ${floor}, No: ${doorNumber}`

      // Adresi veritabanına kaydet (yeni yapı ile)
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          address: fullAddress,
          district: district,
          neighborhood: neighborhood,
          street_address: streetAddress,
          floor: floor,
          door_number: doorNumber,
          latitude: latitude,
          longitude: longitude
        })
        .eq('id', customerId)

      if (updateError) throw updateError

      // LocalStorage'a kaydet
      localStorage.setItem('customer_address', fullAddress)

      onAddressSelect(fullAddress)
    } catch (err: any) {
      setError(err.message || 'Adres kaydedilemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-[800px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e8e8e8] sticky top-0 bg-white z-10">
          <h2 className="text-[20px] font-bold text-[#3c4043]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {step === 'quick' && 'Adres Seç'}
            {step === 'map' && 'Konumunu Doğrula'}
            {step === 'details' && 'Adres Detayları'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#6f6f6f] hover:text-[#3c4043] text-[24px] leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p className="text-[13px] text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-[13px] text-blue-700 font-medium">Konumunuz alınıyor...</p>
              </div>
            </div>
          )}

          {/* Step 1: Quick Location Selection */}
          {step === 'quick' && (
            <div className="space-y-3">
              <p className="text-[14px] text-[#6f6f6f] mb-4">
                Samsun 19 Mayıs'ta hızlı adres seçimi yapın
              </p>
              {SAMSUN_QUICK_LOCATIONS.map((location) => (
                <button
                  key={location.name}
                  onClick={() => handleQuickLocationSelect(location)}
                  className="w-full p-4 bg-white border border-[#e8e8e8] rounded-lg text-left hover:border-[#f59e0b] hover:bg-[#fef3c7] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span className="text-[14px] font-semibold text-[#3c4043]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                      {location.name}
                    </span>
                  </div>
                </button>
              ))}

              <button
                onClick={() => {
                  setSelectedQuickLocation('') // Seçimi temizle
                  setShouldFlyToLocation(false) // FlyTo YOK, kullanıcı kendisi seçecek
                  setStep('map')
                }}
                className="w-full p-4 bg-[#f7f7f7] border border-[#e8e8e8] rounded-lg text-center hover:bg-[#e8e8e8] transition-colors"
              >
                <span className="text-[14px] font-semibold text-[#3c4043]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  📍 Haritadan Seç
                </span>
              </button>

              <button
                onClick={handleFindMyLocation}
                className="w-full p-4 bg-gradient-to-r from-[#f59e0b] to-[#d97706] border border-[#f59e0b] rounded-lg text-center hover:from-[#d97706] hover:to-[#b45309] transition-all shadow-md"
              >
                <span className="text-[14px] font-semibold text-white flex items-center justify-center gap-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="3"></circle>
                    <line x1="12" y1="2" x2="12" y2="4"></line>
                    <line x1="12" y1="20" x2="12" y2="22"></line>
                    <line x1="2" y1="12" x2="4" y2="12"></line>
                    <line x1="20" y1="12" x2="22" y2="12"></line>
                  </svg>
                  Konumumu Bul
                </span>
              </button>
            </div>
          )}

          {/* Step 2: Map Selection */}
          {step === 'map' && (
            <div className="space-y-4">
              {/* Bilgilendirme Mesajı */}
              {selectedQuickLocation && (
                <div className="bg-[#fef3c7] border border-[#f59e0b] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <div>
                      <p className="text-[13px] font-semibold text-[#3c4043] mb-1">
                        {selectedQuickLocation} seçildi
                      </p>
                      <p className="text-[12px] text-[#6f6f6f]">
                        {SAMSUN_QUICK_LOCATIONS.find(loc => loc.name === selectedQuickLocation)?.isManual
                          ? 'Haritadan konumunuzu belirleyin. Adres bilgilerini sonraki adımda gireceksiniz.'
                          : 'Konum ve adres bilgileri otomatik dolduruldu. İsterseniz haritayı kaydırarak konumu değiştirebilirsiniz.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[14px] text-[#6f6f6f]">
                Haritayı hareket ettirerek tam konumunuzu belirleyin
              </p>

              <div className="h-[400px] rounded-lg overflow-hidden border border-[#e8e8e8]">
                <MapComponent
                  center={[latitude, longitude]}
                  onLocationChange={(lat, lng) => {
                    setLatitude(lat)
                    setLongitude(lng)
                    setShouldFlyToLocation(false) // Kullanıcı manuel hareket ettirdi, flyTo'yu kapat
                  }}
                  shouldFlyTo={shouldFlyToLocation}
                />
              </div>

              <div className="bg-[#f7f7f7] p-4 rounded-lg">
                <p className="text-[12px] text-[#6f6f6f] mb-1">Seçili Koordinatlar:</p>
                <p className="text-[13px] font-mono text-[#3c4043]">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('quick')}
                  className="flex-1 h-[48px] bg-white border border-[#e8e8e8] text-[#3c4043] rounded-lg font-semibold text-[14px] hover:bg-[#f7f7f7] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                >
                  Geri
                </button>
                <button
                  onClick={() => handleMapConfirm(latitude, longitude)}
                  className="flex-1 h-[48px] bg-[#f59e0b] text-white rounded-lg font-semibold text-[14px] hover:bg-[#d97706] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                >
                  Konumu Onayla
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Address Details */}
          {step === 'details' && (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveAddress(); }} className="space-y-4">
              {/* Ön Doldurma Bilgilendirmesi */}
              {selectedQuickLocation && !SAMSUN_QUICK_LOCATIONS.find(loc => loc.name === selectedQuickLocation)?.isManual && (
                <div className="bg-[#e8f5e9] border border-[#4caf50] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <div>
                      <p className="text-[13px] font-semibold text-[#2e7d32] mb-1">
                        Adres bilgileri otomatik dolduruldu
                      </p>
                      <p className="text-[12px] text-[#558b2f]">
                        Tüm alanları istediğiniz gibi düzenleyebilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  Adres İsmi
                </label>
                <div className="flex gap-2">
                  {['Ev', 'İş', 'Yurt', 'Diğer'].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setAddressName(name)}
                      className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                        addressName === name
                          ? 'bg-[#f59e0b] text-white'
                          : 'bg-[#f7f7f7] text-[#3c4043] hover:bg-[#e8e8e8]'
                      }`}
                      style={{ fontFamily: 'Open Sans, sans-serif' }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  İlçe
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-[48px] px-4 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                  required
                />
              </div>

              {/* Mahalle - Serbest Metin */}
              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  Mahalle
                </label>
                <input
                  type="text"
                  placeholder="Mahalle yazınız..."
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full h-[48px] px-4 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                  required
                />
              </div>

              {/* Cadde/Sokak - Serbest Metin */}
              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  Cadde / Sokak
                </label>
                <input
                  type="text"
                  placeholder="Cadde/Sokak yazınız..."
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full h-[48px] px-4 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                    Kat
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: 3"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full h-[48px] px-4 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors"
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                    Kapı No
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: 12"
                    value={doorNumber}
                    onChange={(e) => setDoorNumber(e.target.value)}
                    className="w-full h-[48px] px-4 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors"
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  Adres Tarifi (Opsiyonel)
                </label>
                <textarea
                  placeholder="Örn: Kırmızı kapılı bina, 2. blok"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-[80px] px-4 py-3 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors resize-none"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                />
              </div>

              {error && (
                <p className="text-[#f59e0b] text-[12px]">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('map')}
                  className="flex-1 h-[48px] bg-white border border-[#e8e8e8] text-[#3c4043] rounded-lg font-semibold text-[14px] hover:bg-[#f7f7f7] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-[48px] bg-[#f59e0b] text-white rounded-lg font-semibold text-[14px] hover:bg-[#d97706] transition-colors disabled:opacity-50"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                >
                  {loading ? 'Kaydediliyor...' : 'Adresimi Kaydet'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

