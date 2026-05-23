'use client'

import { useState, useEffect, useMemo } from 'react'
import { Product, OptionGroup, SelectedOption } from '@/types/menu'
import { useCart } from '@/app/context/CartContext'
import { supabase } from '@/app/lib/supabase'
import { isMobile } from '@/app/lib/platform'

interface ProductModalProps {
  product: Product
  allProducts: Product[]
  onClose: () => void
}

export default function ProductModal({ product, allProducts, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [upsellProducts, setUpsellProducts] = useState<Product[]>([])
  const [selections, setSelections] = useState<Record<string, SelectedOption[]>>({})
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const { addToCart, cart } = useCart()
  const mobile = isMobile()

  // Supabase'den opsiyon gruplarını ve seçeneklerini çek
  useEffect(() => {
    const fetchOptionGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('product_option_groups')
          .select('*, product_options(*)')
          .eq('product_id', product.id)

        if (error) {
          console.error('Opsiyon query hatası:', error)
          setOptionsLoading(false)
          return
        }

        console.log('Opsiyon grupları DB:', data)

        if (data && data.length > 0) {
          const mapped: OptionGroup[] = data.map((g: any) => ({
            id: g.id,
            name: g.name,
            required: g.required ?? g.is_required ?? false,
            min_select: g.min_select ?? (g.required || g.is_required ? 1 : 0),
            max_select: g.max_select ?? (g.type === 'radio' ? 1 : 10),
            options: (g.product_options || []).map((o: any) => ({
              id: o.id,
              name: o.name,
              price_diff: o.price_diff ?? o.price_modifier ?? o.extra_price ?? 0
            }))
          }))
          setOptionGroups(mapped)
        }
      } catch (err) {
        console.error('Opsiyon grupları yüklenemedi:', err)
      } finally {
        setOptionsLoading(false)
      }
    }

    fetchOptionGroups()
  }, [product.id])

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
            const filtered = data.filter(p => !cart.some(item => item.product.id === p.id))
            setUpsellProducts(filtered)
          }
        })
    }
  }, [product.upsell_product_ids])

  // Dinamik fiyat hesaplama
  const totalOptionPrice = useMemo(() => {
    return Object.values(selections).flat().reduce((sum, opt) => sum + opt.price_diff, 0)
  }, [selections])

  const unitPrice = product.price + totalOptionPrice
  const totalPrice = unitPrice * quantity

  // Zorunlu grup kontrolü
  const allRequiredSelected = useMemo(() => {
    return optionGroups
      .filter(g => g.required)
      .every(g => {
        const groupSelections = selections[g.id] || []
        return groupSelections.length >= g.min_select
      })
  }, [optionGroups, selections])

  const canAddToCart = optionGroups.length === 0 || allRequiredSelected

  // Opsiyon seçim handler
  const handleOptionSelect = (group: OptionGroup, optionId: string) => {
    const option = group.options.find(o => o.id === optionId)
    if (!option) return

    const newSelection: SelectedOption = {
      group_id: group.id,
      group_name: group.name,
      option_id: option.id,
      option_name: option.name,
      price_diff: option.price_diff
    }

    setSelections(prev => {
      const current = prev[group.id] || []

      if (group.max_select === 1) {
        // Radio: sadece bir seçim
        return { ...prev, [group.id]: [newSelection] }
      } else {
        // Checkbox: toggle
        const exists = current.find(s => s.option_id === optionId)
        if (exists) {
          return { ...prev, [group.id]: current.filter(s => s.option_id !== optionId) }
        } else {
          if (current.length >= group.max_select) {
            // Max'a ulaşıldı, en eski seçimi kaldır
            return { ...prev, [group.id]: [...current.slice(1), newSelection] }
          }
          return { ...prev, [group.id]: [...current, newSelection] }
        }
      }
    })
  }

  const isOptionSelected = (groupId: string, optionId: string) => {
    return (selections[groupId] || []).some(s => s.option_id === optionId)
  }

  const handleAddToCart = () => {
    if (!canAddToCart) return
    const allSelectedOptions = Object.values(selections).flat()
    addToCart(product, quantity, note, allSelectedOptions.length > 0 ? allSelectedOptions : undefined, allSelectedOptions.length > 0 ? unitPrice : undefined)
    onClose()
  }

  const handleUpsellAdd = (p: Product) => {
    addToCart(p, 1)
    setUpsellProducts(prev => prev.filter(item => item.id !== p.id))
  }

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex ${mobile ? 'items-end' : 'items-center'} justify-center z-50 ${mobile ? '' : 'p-4'}`}
      onClick={onClose}
    >
      <div
        className={`bg-white ${mobile ? 'rounded-t-2xl' : 'rounded-2xl'} w-full ${mobile ? 'max-w-full' : 'max-w-[500px]'} ${mobile ? 'max-h-[95vh]' : 'max-h-[90vh]'} overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Ürün Görseli */}
        <div className="relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className={`w-full ${mobile ? 'h-[180px]' : 'h-[200px]'} object-cover ${mobile ? 'rounded-t-2xl' : 'rounded-t-2xl'}`}
            />
          ) : (
            <div className={`w-full ${mobile ? 'h-[180px]' : 'h-[200px]'} bg-gradient-to-br from-[#fef3c7] to-[#fde68a] flex items-center justify-center text-6xl ${mobile ? 'rounded-t-2xl' : 'rounded-t-2xl'}`}>
              🍽️
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-[18px] leading-none hover:bg-black/60 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className={mobile ? 'p-4' : 'p-5'}>
          {/* Ürün Adı + Baz Fiyat */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className={`${mobile ? 'text-[16px]' : 'text-[18px]'} font-bold text-[#3c4043] leading-tight`} style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {product.name}
            </h2>
            <span className={`${mobile ? 'text-[18px]' : 'text-[20px]'} font-bold text-[#f59e0b] flex-shrink-0`}>
              {product.price.toFixed(2)}₺
            </span>
          </div>

          {/* Açıklama */}
          {product.description && (
            <p className={`${mobile ? 'text-[12px]' : 'text-[13px]'} text-[#6f6f6f] mb-4`}>
              {product.description}
            </p>
          )}

          {/* ═══ OPSİYON GRUPLARI ═══ */}
          {optionsLoading && (
            <div className="space-y-3 mb-4">
              {[1, 2].map(i => (
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
              {optionGroups.map(group => {
                const groupSelections = selections[group.id] || []
                const isGroupValid = !group.required || groupSelections.length >= group.min_select

                return (
                  <div key={group.id} className={`border rounded-xl p-3 transition-colors ${!isGroupValid ? 'border-orange-300 bg-orange-50/30' : 'border-[#e8e8e8]'}`}>
                    {/* Grup Başlığı */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <h3 className={`${mobile ? 'text-[13px]' : 'text-[14px]'} font-bold text-[#3c4043]`}>
                          {group.name}
                        </h3>
                        {group.required && (
                          <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
                            Zorunlu
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#9f9f9f]">
                        {group.max_select === 1 ? 'Birini seç' : `En fazla ${group.max_select} seç`}
                      </span>
                    </div>

                    {/* Opsiyonlar */}
                    <div className="space-y-1.5">
                      {group.options.map(option => {
                        const selected = isOptionSelected(group.id, option.id)
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleOptionSelect(group, option.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                              selected
                                ? 'bg-[#f59e0b]/10 border border-[#f59e0b]'
                                : 'bg-[#f7f7f7] border border-transparent hover:bg-[#f0f0f0]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Radio / Checkbox göstergesi */}
                              <div className={`w-5 h-5 rounded-${group.max_select === 1 ? 'full' : 'md'} border-2 flex items-center justify-center transition-colors ${
                                selected ? 'border-[#f59e0b] bg-[#f59e0b]' : 'border-[#d1d5db]'
                              }`}>
                                {selected && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span className={`${mobile ? 'text-[13px]' : 'text-[14px]'} ${selected ? 'font-semibold text-[#3c4043]' : 'text-[#3c4043]'}`}>
                                {option.name}
                              </span>
                            </div>
                            {option.price_diff !== 0 && (
                              <span className={`${mobile ? 'text-[12px]' : 'text-[13px]'} font-semibold ${option.price_diff > 0 ? 'text-[#f59e0b]' : 'text-green-600'}`}>
                                {option.price_diff > 0 ? '+' : ''}{option.price_diff.toFixed(2)}₺
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
              <label className={`block ${mobile ? 'text-[11px]' : 'text-[12px]'} font-semibold text-[#3c4043] mb-1.5`}>Miktar</label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 bg-[#f7f7f7] rounded-lg flex items-center justify-center text-[16px] font-bold text-[#3c4043] hover:bg-[#e8e8e8] transition-colors"
                >−</button>
                <span className="text-[16px] font-bold text-[#3c4043] w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 bg-[#f7f7f7] rounded-lg flex items-center justify-center text-[16px] font-bold text-[#3c4043] hover:bg-[#e8e8e8] transition-colors"
                >+</button>
              </div>
            </div>
            <div className="flex-1">
              <label className={`block ${mobile ? 'text-[11px]' : 'text-[12px]'} font-semibold text-[#3c4043] mb-1.5`}>Not (Opsiyonel)</label>
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

          {/* Yanına da İyi Gider - Upsell */}
          {upsellProducts.length > 0 && (
            <div className="mb-4">
              <p className={`${mobile ? 'text-[12px]' : 'text-[13px]'} font-semibold text-[#3c4043] mb-2`}>Yanına da iyi gider</p>
              <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                <div className="flex gap-2">
                  {upsellProducts.map(p => (
                    <div key={p.id} className="w-[130px] flex-shrink-0 bg-[#fafafa] border border-[#e8e8e8] rounded-lg overflow-hidden hover:border-[#f59e0b] transition-colors">
                      <div className="w-full h-[72px] bg-gradient-to-br from-[#fef3c7] to-[#fde68a]">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-semibold text-[#3c4043] line-clamp-2 leading-tight min-h-[28px]">{p.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[12px] font-bold text-[#f59e0b]">{p.price}₺</span>
                          <button
                            onClick={() => handleUpsellAdd(p)}
                            className="w-7 h-7 bg-[#f59e0b] text-white rounded-md flex items-center justify-center hover:bg-[#d97706] transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ TOPLAM TUTAR + SEPETE EKLE ═══ */}
          {totalOptionPrice > 0 && (
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[12px] text-[#6f6f6f]">Baz fiyat + opsiyonlar</span>
              <span className="text-[12px] text-[#6f6f6f]">
                {product.price.toFixed(2)}₺ + {totalOptionPrice.toFixed(2)}₺ = {unitPrice.toFixed(2)}₺
              </span>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`w-full ${mobile ? 'min-h-[48px] text-[14px]' : 'min-h-[50px] text-[15px]'} rounded-lg font-bold transition-all flex items-center justify-center gap-3 ${
              canAddToCart
                ? 'bg-[#f59e0b] text-white hover:bg-[#d97706] shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            style={{ fontFamily: 'Open Sans, sans-serif' }}
          >
            {canAddToCart ? (
              <>
                <span>Sepete Ekle</span>
                <span className="opacity-60">•</span>
                <span>{totalPrice.toFixed(2)}₺</span>
              </>
            ) : (
              <span>Zorunlu seçimleri tamamlayın</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
