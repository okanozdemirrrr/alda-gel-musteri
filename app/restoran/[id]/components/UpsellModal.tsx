'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Product } from '@/types/menu'
import { useCart } from '@/app/context/CartContext'
import { X, ShoppingBag } from 'lucide-react'

interface UpsellModalProps {
  mainProduct: Product
  relatedProducts: Product[]
  onClose: () => void
  onContinue: () => void
}

export default function UpsellModal({ 
  mainProduct, 
  relatedProducts, 
  onClose, 
  onContinue 
}: UpsellModalProps) {
  const { addToCart, cart } = useCart()
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())

  // Sepette olan ürünleri filtrele
  const availableProducts = relatedProducts.filter(
    product => !cart.some(item => item.product.id === product.id)
  )

  // Eğer gösterilecek ürün yoksa direkt kapat
  useEffect(() => {
    if (availableProducts.length === 0) {
      onContinue()
    }
  }, [availableProducts.length, onContinue])

  const handleAddProduct = (product: Product) => {
    addToCart(product, 1)
    setAddedProducts(prev => new Set(prev).add(product.id))
    
    // Animasyon için kısa bir süre bekle
    setTimeout(() => {
      setAddedProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }, 1000)
  }

  if (availableProducts.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-end justify-center z-[60]"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-white w-full max-w-[600px] rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200 p-6 z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h2 className="text-[24px] font-bold text-[#3c4043] mb-1" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  ✨ Yanına da İyi Gider
                </h2>
                <p className="text-[14px] text-[#6f6f6f]">
                  <span className="font-semibold text-[#f59e0b]">{mainProduct.name}</span> ile birlikte bunları denemek ister misiniz?
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-[#6f6f6f] hover:text-[#3c4043] transition-colors ml-2"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-6">
            {/* Horizontal Scroll Container */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {availableProducts.map((product) => {
                const isAdded = addedProducts.has(product.id)
                
                return (
                  <motion.div
                    key={product.id}
                    layout
                    className="flex-shrink-0 w-[200px] bg-white border-2 border-[#e8e8e8] rounded-xl overflow-hidden hover:border-[#f59e0b] transition-all hover:shadow-lg"
                  >
                    {/* Ürün Görseli */}
                    <div className="relative w-full h-[140px] bg-gradient-to-br from-[#fef3c7] to-[#fde68a]">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* Ürün Bilgileri */}
                    <div className="p-4">
                      <h3 className="text-[14px] font-bold text-[#3c4043] mb-1 line-clamp-2 min-h-[40px]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                        {product.name}
                      </h3>
                      
                      {product.description && (
                        <p className="text-[11px] text-[#9e9e9e] mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[18px] font-bold text-[#f59e0b]">
                          {product.price}₺
                        </span>
                      </div>

                      {/* Ekle Butonu */}
                      <motion.button
                        onClick={() => handleAddProduct(product)}
                        disabled={isAdded}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full h-[40px] rounded-lg font-bold text-[13px] transition-all flex items-center justify-center gap-2 ${
                          isAdded
                            ? 'bg-green-500 text-white'
                            : 'bg-[#f59e0b] text-white hover:bg-[#d97706]'
                        }`}
                        style={{ fontFamily: 'Open Sans, sans-serif' }}
                      >
                        {isAdded ? (
                          <>
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500 }}
                            >
                              ✓
                            </motion.span>
                            Eklendi
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Ekle
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Footer - Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-[#e8e8e8] p-6 space-y-3">
            <button
              onClick={onContinue}
              className="w-full h-[56px] bg-[#f59e0b] text-white rounded-xl font-bold text-[16px] hover:bg-[#d97706] transition-all flex items-center justify-center gap-2"
              style={{ fontFamily: 'Open Sans, sans-serif' }}
            >
              <ShoppingBag size={20} />
              Sepete Git
            </button>
            
            <button
              onClick={onClose}
              className="w-full h-[48px] bg-white border-2 border-[#e8e8e8] text-[#6f6f6f] rounded-xl font-semibold text-[14px] hover:border-[#f59e0b] hover:text-[#f59e0b] transition-all"
              style={{ fontFamily: 'Open Sans, sans-serif' }}
            >
              Hayır, İstemiyorum
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
