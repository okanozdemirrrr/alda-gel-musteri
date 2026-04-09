'use client'

import { useState } from 'react'
import { Product } from '@/types/menu'
import { useCart } from '@/app/context/CartContext'
import { supabase } from '@/app/lib/supabase'
import { isMobile } from '@/app/lib/platform'

interface ProductModalProps {
  product: Product
  allProducts: Product[]
  onClose: () => void
  onShowUpsell?: (product: Product, relatedProducts: Product[]) => void
}

export default function ProductModal({ product, allProducts, onClose, onShowUpsell }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const { addToCart, cart } = useCart()
  const mobile = isMobile()

  const handleAddToCart = async () => {
    // Ürünü sepete ekle
    addToCart(product, quantity, note)
    
    // Yan ürünleri products tablosundaki upsell_product_ids array'inden kontrol et
    if (onShowUpsell) {
      try {
        // Ürünün upsell_product_ids array'i var mı kontrol et
        if (product.upsell_product_ids && product.upsell_product_ids.length > 0) {
          // Yan ürünleri ID'lere göre çek
          const { data: upsellProducts, error } = await supabase
            .from('products')
            .select('*')
            .in('id', product.upsell_product_ids)
            .eq('is_available', true)
            .eq('is_visible', true)
          
          if (error) {
            console.error('Yan ürünler yüklenemedi:', error)
            onClose()
            return
          }
          
          // Sepette olmayan yan ürünleri filtrele
          if (upsellProducts && upsellProducts.length > 0) {
            const relatedProducts = upsellProducts.filter(p => 
              !cart.some(item => item.product.id === p.id)
            )
            
            if (relatedProducts.length > 0) {
              onShowUpsell(product, relatedProducts)
              return
            }
          }
        }
      } catch (error) {
        console.error('Yan ürün kontrolü başarısız:', error)
      }
    }
    
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full ${mobile ? 'max-w-[95vw]' : 'max-w-[500px]'} max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between ${mobile ? 'p-4' : 'p-6'} border-b border-[#e8e8e8] sticky top-0 bg-white z-10`}>
          <h2 className={`${mobile ? 'text-[16px]' : 'text-[20px]'} font-bold text-[#3c4043] pr-4`} style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {product.name}
          </h2>
          <button
            onClick={onClose}
            className={`text-[#6f6f6f] hover:text-[#3c4043] ${mobile ? 'text-[28px]' : 'text-[24px]'} leading-none flex-shrink-0`}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className={mobile ? 'p-4' : 'p-6'}>
          {/* Fiyat */}
          <div className={mobile ? 'mb-4' : 'mb-6'}>
            <span className={`${mobile ? 'text-[22px]' : 'text-[28px]'} font-bold text-[#f59e0b]`}>
              {product.price}₺
            </span>
          </div>

          {/* Açıklama */}
          {product.description && (
            <div className={mobile ? 'mb-4' : 'mb-6'}>
              <p className={`${mobile ? 'text-[12px]' : 'text-[14px]'} text-[#6f6f6f]`}>
                {product.description}
              </p>
            </div>
          )}

          {/* Miktar Seçici */}
          <div className={mobile ? 'mb-4' : 'mb-6'}>
            <label className={`block ${mobile ? 'text-[12px] mb-2' : 'text-[13px] mb-3'} font-semibold text-[#3c4043]`}>
              Miktar
            </label>
            <div className={`flex items-center ${mobile ? 'gap-3' : 'gap-4'}`}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className={`${mobile ? 'w-9 h-9 text-[18px]' : 'w-10 h-10 text-[20px]'} bg-[#f7f7f7] rounded-lg flex items-center justify-center font-bold text-[#3c4043] hover:bg-[#e8e8e8] transition-colors`}
              >
                −
              </button>
              <span className={`${mobile ? 'text-[18px] min-w-[35px]' : 'text-[20px] min-w-[40px]'} font-bold text-[#3c4043] text-center`}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className={`${mobile ? 'w-9 h-9 text-[18px]' : 'w-10 h-10 text-[20px]'} bg-[#f7f7f7] rounded-lg flex items-center justify-center font-bold text-[#3c4043] hover:bg-[#e8e8e8] transition-colors`}
              >
                +
              </button>
            </div>
          </div>

          {/* Ürün Notu */}
          <div className={mobile ? 'mb-4' : 'mb-6'}>
            <label className={`block ${mobile ? 'text-[12px]' : 'text-[13px]'} font-semibold text-[#3c4043] mb-2`}>
              Ürün Notu (Opsiyonel)
            </label>
            <textarea
              placeholder="Soğan istemiyorum, marul bol olsun vb."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`w-full ${mobile ? 'h-[80px] px-3 py-2 text-[12px]' : 'h-[100px] px-4 py-3 text-[14px]'} bg-white border border-[#e8e8e8] rounded-lg focus:outline-none focus:border-[#f59e0b] transition-colors resize-none`}
              style={{ fontFamily: 'Open Sans, sans-serif' }}
            />
          </div>

          {/* Sepete Ekle Butonu */}
          <button
            onClick={handleAddToCart}
            className={`w-full ${mobile ? 'h-[48px] text-[14px]' : 'h-[56px] text-[16px]'} bg-[#f59e0b] text-white rounded-lg font-bold hover:bg-[#d97706] transition-colors flex items-center justify-center gap-3`}
            style={{ fontFamily: 'Open Sans, sans-serif' }}
          >
            <span>Sepete Ekle</span>
            <span>•</span>
            <span>{(product.price * quantity).toFixed(2)}₺</span>
          </button>
        </div>
      </div>
    </div>
  )
}
