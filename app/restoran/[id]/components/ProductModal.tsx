'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Product, OptionGroup } from '@/types/menu'
import { useCart } from '@/app/context/CartContext'
import { supabase } from '@/app/lib/supabase'
import {
  fetchProductOptionGroups,
  buildSelectedOptions,
  calcOptionPriceTotal,
  areRequiredGroupsSatisfied,
  getFirstUnsatisfiedRequiredGroup,
} from '@/app/lib/productOptions'
import { isMobile } from '@/app/lib/platform'
import GuestLoginPrompt from '@/app/components/GuestLoginPrompt'
import Portal from '../../../components/Portal'

interface ProductModalProps {
  product: Product
  allProducts: Product[]
  onClose: () => void
}

export default function ProductModal({ product, allProducts, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [upsellProducts, setUpsellProducts] = useState<Product[]>([])
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [shakeGroupId, setShakeGroupId] = useState<string | null>(null)
  const [showGuestPrompt, setShowGuestPrompt] = useState(false)
  const modalScrollRef = useRef<HTMLDivElement>(null)
  const { addToCart, cart } = useCart()
  const mobile = isMobile()

  useEffect(() => {
    let cancelled = false

    const loadOptionGroups = async () => {
      setOptionsLoading(true)
      setSelections({})

      try {
        const groups = await fetchProductOptionGroups(product.id, product.option_groups)
        if (!cancelled) setOptionGroups(groups)
      } catch (err) {
        console.error('Opsiyon grupları yüklenemedi:', err)
        if (!cancelled) setOptionGroups([])
      } finally {
        if (!cancelled) setOptionsLoading(false)
      }
    }

    loadOptionGroups()

    return () => {
      cancelled = true
    }
  }, [product.id, product.option_groups])

  useEffect(() => {
    if (product.upsell_product_ids && product.upsell_product_ids.length > 0) {
      supabase
        .from('products')
        .select('*')
        .in('id', product.upsell_product_ids)
        .eq('is_available', true)
        .eq('is_visible', true)
        .then(({ data }) => {
          if (data) {
            const filtered = data.filter((p) => !cart.some((item) => item.product.id === p.id))
            setUpsellProducts(filtered)
          }
        })
    }
  }, [product.upsell_product_ids, cart])

  useEffect(() => {
    if (!validationMessage) return
    const timer = setTimeout(() => setValidationMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [validationMessage])

  const totalOptionPrice = useMemo(
    () => calcOptionPriceTotal(selections, optionGroups),
    [selections, optionGroups]
  )

  const unitPrice = product.price + totalOptionPrice
  const totalPrice = unitPrice * quantity

  const canAddToCart =
    optionGroups.length === 0 || areRequiredGroupsSatisfied(selections, optionGroups)

  const handleOptionSelect = (group: OptionGroup, optionId: string) => {
    setSelections((prev) => {
      const current = prev[group.id] || []

      if (group.type === 'radio') {
        return { ...prev, [group.id]: [optionId] }
      }

      const exists = current.includes(optionId)
      if (exists) {
        return { ...prev, [group.id]: current.filter((id) => id !== optionId) }
      }

      if (current.length >= group.max_select) {
        return { ...prev, [group.id]: [...current.slice(1), optionId] }
      }

      return { ...prev, [group.id]: [...current, optionId] }
    })
  }

  const isOptionSelected = (groupId: string, optionId: string) =>
    (selections[groupId] || []).includes(optionId)

  const highlightMissingGroup = (groupId: string) => {
    setShakeGroupId(groupId)
    setTimeout(() => setShakeGroupId(null), 500)

    requestAnimationFrame(() => {
      const el = document.getElementById(`option-group-${groupId}`)
      if (!el) return

      if (modalScrollRef.current) {
        const container = modalScrollRef.current
        const containerRect = container.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        const offset = elRect.top - containerRect.top + container.scrollTop - 24
        container.scrollTo({ top: offset, behavior: 'smooth' })
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }

  const handleAddToCart = () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('customer_id')) {
      setShowGuestPrompt(true)
      return
    }

    const missingGroup = getFirstUnsatisfiedRequiredGroup(selections, optionGroups)
    if (missingGroup) {
      setValidationMessage(`Lütfen ${missingGroup.name} seçiminizi yapınız`)
      highlightMissingGroup(missingGroup.id)
      return
    }

    const selectedOptions = buildSelectedOptions(selections, optionGroups)
    const hasOptions = optionGroups.length > 0

    addToCart(
      product,
      quantity,
      note,
      hasOptions ? selectedOptions : undefined,
      hasOptions || totalOptionPrice > 0 ? unitPrice : undefined
    )
    onClose()
  }

  const handleUpsellAdd = (p: Product) => {
    if (typeof window !== 'undefined' && !localStorage.getItem('customer_id')) {
      setShowGuestPrompt(true)
      return
    }
    addToCart(p, 1)
    setUpsellProducts((prev) => prev.filter((item) => item.id !== p.id))
  }

  return (
    <Portal>
    <>
    {showGuestPrompt && (
      <GuestLoginPrompt
        onClose={() => setShowGuestPrompt(false)}
        onLoginSuccess={() => {
          // Login sonrası localStorage güncellendi; kullanıcı artık sepete ekleyebilir
        }}
      />
    )}
    <div
      className={`fixed inset-0 z-[9999] flex h-[100dvh] w-screen bg-black/50 ${mobile ? 'items-end' : 'items-center justify-center'} ${mobile ? '' : 'p-4'}`}
      onClick={onClose}
    >
      {validationMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
          <div className="flex items-center gap-2.5 bg-[#1f2937] text-white text-[13px] font-medium px-4 py-3 rounded-xl shadow-2xl max-w-[90vw]">
            <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
              !
            </span>
            {validationMessage}
          </div>
        </div>
      )}

      <div
        ref={modalScrollRef}
        className={`bg-white ${mobile ? 'rounded-t-2xl' : 'rounded-2xl'} w-full max-w-full ${mobile ? '' : 'max-w-[500px]'} ${mobile ? 'max-h-[95dvh]' : 'max-h-[90dvh]'} overflow-y-auto overflow-x-hidden pb-safe scroll-surface gpu-layer`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ürün Görseli */}
        <div className="relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className={`w-full ${mobile ? 'h-[180px]' : 'h-[200px]'} object-cover rounded-t-2xl`}
            />
          ) : (
            <div
              className={`w-full ${mobile ? 'h-[180px]' : 'h-[200px]'} bg-gradient-to-br from-[#fef3c7] to-[#fde68a] flex items-center justify-center text-6xl rounded-t-2xl`}
            >
              🍽️
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-11 h-11 min-w-[44px] min-h-[44px] bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-[18px] leading-none hover:bg-black/60 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className={mobile ? 'p-4' : 'p-5'}>
          {/* Ürün Adı + Baz Fiyat */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2
              className={`${mobile ? 'text-[16px]' : 'text-[18px]'} font-bold text-[#3c4043] leading-tight`}
              style={{ fontFamily: 'Open Sans, sans-serif' }}
            >
              {product.name}
            </h2>
            <span
              className={`${mobile ? 'text-[18px]' : 'text-[20px]'} font-bold text-[#f59e0b] flex-shrink-0`}
            >
              {product.price.toFixed(2)}₺
            </span>
          </div>

          {/* Açıklama */}
          {product.description && (
            <p className={`${mobile ? 'text-[12px]' : 'text-[13px]'} text-[#6f6f6f] mb-4`}>
              {product.description}
            </p>
          )}

          {/* Opsiyon Grupları */}
          {optionsLoading && (
            <div className="space-y-3 mb-4">
              {[1, 2].map((i) => (
                <div key={i} className="border border-[#e8e8e8] rounded-xl p-3 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-100 rounded-lg" />
                    <div className="h-10 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!optionsLoading && optionGroups.length > 0 && (
            <div className="space-y-4 mb-4">
              {optionGroups.map((group) => {
                const groupSelections = selections[group.id] || []
                const isGroupValid =
                  !group.required || groupSelections.length >= group.min_select
                const isRadio = group.type === 'radio'

                const isShaking = shakeGroupId === group.id

                return (
                  <div
                    key={group.id}
                    id={`option-group-${group.id}`}
                    className={`border rounded-xl p-3 transition-colors ${
                      isShaking
                        ? 'border-red-500 bg-red-50/40 animate-option-shake'
                        : !isGroupValid
                          ? 'border-orange-300 bg-orange-50/30'
                          : 'border-[#e8e8e8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`${mobile ? 'text-[13px]' : 'text-[14px]'} font-bold text-[#3c4043]`}
                        >
                          {group.name}
                        </h3>
                        {group.required ? (
                          <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                            Zorunlu
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-[#a3a3a3] bg-[#f5f5f5] px-2 py-0.5 rounded-full">
                            İsteğe Bağlı
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#9f9f9f] flex-shrink-0 ml-2">
                        {isRadio
                          ? 'Birini seç'
                          : group.max_select > 1
                            ? `En fazla ${group.max_select} seç`
                            : 'Birden fazla seçebilirsiniz'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {group.options.map((option) => {
                        const selected = isOptionSelected(group.id, option.id)
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleOptionSelect(group, option.id)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-3 min-h-[48px] rounded-lg transition-all ${
                              selected
                                ? 'bg-[#f59e0b]/10 border border-[#f59e0b]'
                                : 'bg-[#f7f7f7] border border-transparent hover:bg-[#f0f0f0]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                                  isRadio ? 'rounded-full' : 'rounded-md'
                                } ${selected ? 'border-[#f59e0b] bg-[#f59e0b]' : 'border-[#d1d5db]'}`}
                              >
                                {selected && (
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span
                                className={`${mobile ? 'text-[13px]' : 'text-[14px]'} ${selected ? 'font-semibold text-[#3c4043]' : 'text-[#3c4043]'}`}
                              >
                                {option.name}
                              </span>
                            </div>
                            {option.price_diff !== 0 && (
                              <span
                                className={`${mobile ? 'text-[12px]' : 'text-[13px]'} font-semibold ${option.price_diff > 0 ? 'text-[#f59e0b]' : 'text-green-600'}`}
                              >
                                {option.price_diff > 0 ? '+' : ''}
                                {option.price_diff.toFixed(2)}₺
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Miktar + Not */}
          <div className="flex items-end gap-3 mb-4">
            <div>
              <label
                className={`block ${mobile ? 'text-[11px]' : 'text-[12px]'} font-semibold text-[#3c4043] mb-1.5`}
              >
                Miktar
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 bg-[#f7f7f7] rounded-lg flex items-center justify-center text-[16px] font-bold text-[#3c4043] hover:bg-[#e8e8e8] transition-colors"
                >
                  −
                </button>
                <span className="text-[16px] font-bold text-[#3c4043] w-8 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 bg-[#f7f7f7] rounded-lg flex items-center justify-center text-[16px] font-bold text-[#3c4043] hover:bg-[#e8e8e8] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label
                className={`block ${mobile ? 'text-[11px]' : 'text-[12px]'} font-semibold text-[#3c4043] mb-1.5`}
              >
                Not (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="Soğansız, ekstra sos vb."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`w-full h-9 px-3 ${mobile ? 'text-[12px]' : 'text-[13px]'} bg-white border border-[#e8e8e8] rounded-lg focus:outline-none focus:border-[#f59e0b] transition-colors`}
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              />
            </div>
          </div>

          {/* Yanına da İyi Gider */}
          {upsellProducts.length > 0 && (
            <div className="mb-4">
              <p
                className={`${mobile ? 'text-[12px]' : 'text-[13px]'} font-semibold text-[#3c4043] mb-2`}
              >
                Yanına da iyi gider
              </p>
              <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                <div className="flex gap-2">
                  {upsellProducts.map((p) => (
                    <div
                      key={p.id}
                      className="w-[130px] flex-shrink-0 bg-[#fafafa] border border-[#e8e8e8] rounded-lg overflow-hidden hover:border-[#f59e0b] transition-colors"
                    >
                      <div className="w-full h-[72px] bg-gradient-to-br from-[#fef3c7] to-[#fde68a]">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🍽️
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-semibold text-[#3c4043] line-clamp-2 leading-tight min-h-[28px]">
                          {p.name}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[12px] font-bold text-[#f59e0b]">{p.price}₺</span>
                          <button
                            type="button"
                            onClick={() => handleUpsellAdd(p)}
                            className="w-7 h-7 bg-[#f59e0b] text-white rounded-md flex items-center justify-center hover:bg-[#d97706] transition-colors"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fiyat özeti */}
          {totalOptionPrice > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-2 px-1">
              <span className="text-[12px] text-[#6f6f6f]">Baz fiyat + opsiyonlar</span>
              <span className="text-[12px] text-[#6f6f6f] text-right break-words">
                {product.price.toFixed(2)}₺ + {totalOptionPrice.toFixed(2)}₺ ={' '}
                {unitPrice.toFixed(2)}₺
              </span>
            </div>
          )}

          {/* Sepete Ekle */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full ${mobile ? 'min-h-[48px] py-3 text-[14px]' : 'min-h-[50px] text-[15px]'} rounded-lg font-bold transition-all flex items-center justify-center gap-3 ${
              canAddToCart
                ? 'bg-[#f59e0b] text-white hover:bg-[#d97706] shadow-lg hover:shadow-xl'
                : 'bg-[#f59e0b] text-white opacity-50 cursor-not-allowed'
            }`}
            style={{ fontFamily: 'Open Sans, sans-serif' }}
          >
            <span>Sepete Ekle</span>
            <span className="opacity-60">•</span>
            <span>{totalPrice.toFixed(2)}₺</span>
          </button>
        </div>
      </div>
    </div>
    </>
    </Portal>
  )
}
