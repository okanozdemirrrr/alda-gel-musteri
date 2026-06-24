'use client'

import { X, MapPin, User, Phone, CreditCard, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { OrderDetail } from '@/types/order'
import { formatOptionLine } from '@/app/lib/orderItems'

interface OrderDetailModalProps {
  order: OrderDetail | null
  onClose: () => void
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  if (!order) return null

  const paymentLabel =
    order.payment_method === 'card'
      ? '💳 Kart'
      : order.payment_method === 'cash'
        ? '💵 Nakit'
        : order.payment_method || '—'

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.2 }}
          className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#1e293b] text-white shadow-2xl border border-[#334155]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#334155] bg-[#1e293b] px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-400">
                Sipariş Detayları
              </p>
              <h2 className="text-[18px] font-bold text-white mt-0.5">
                {order.order_number}
              </h2>
              {order.restaurant_name && (
                <p className="text-[12px] text-gray-400 mt-0.5">{order.restaurant_name}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#334155] hover:bg-[#475569] flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X size={18} className="text-gray-300" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Sipariş İçeriği */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-orange-400" />
                <h3 className="text-[14px] font-bold text-white">Sipariş İçeriği</h3>
                <span className="text-[11px] text-gray-400">
                  ({order.items.length} kalem)
                </span>
              </div>

              <div className="rounded-xl border border-[#475569] bg-[#0f172a] divide-y divide-[#334155]">
                {order.items.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-gray-500">
                    Ürün bilgisi bulunamadı
                  </p>
                ) : (
                  order.items.map((item, index) => (
                    <div key={`${item.product_id}-${index}`} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-white leading-snug">
                            {item.product_name}
                          </p>
                          <p className="text-[12px] text-gray-400 mt-0.5">
                            {item.quantity} adet × {item.price.toFixed(2)}₺
                          </p>
                        </div>
                        <span className="text-[14px] font-bold text-orange-400 flex-shrink-0">
                          {(item.price * item.quantity).toFixed(2)}₺
                        </span>
                      </div>

                      {item.selected_options.length > 0 && (
                        <ul className="mt-2 space-y-0.5 pl-1">
                          {item.selected_options.map((option) => (
                            <li
                              key={`${option.group_id}-${option.option_id}`}
                              className="text-[12px] text-gray-400 flex items-start gap-1.5"
                            >
                              <span className="text-gray-500 mt-px">–</span>
                              <span>{formatOptionLine(option)}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {item.item_note && (
                        <p className="mt-2 text-[11px] text-gray-500 italic">
                          📝 {item.item_note}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Müşteri Bilgileri */}
            <section className="rounded-xl border border-[#334155] bg-[#1e293b] p-4 space-y-2.5">
              <h3 className="text-[13px] font-bold text-white mb-1">Müşteri Bilgileri</h3>

              <div className="flex items-start gap-2.5 text-[13px]">
                <User size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{order.customer_name}</span>
              </div>

              {order.customer_phone && (
                <div className="flex items-start gap-2.5 text-[13px]">
                  <Phone size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{order.customer_phone}</span>
                </div>
              )}

              <div className="flex items-start gap-2.5 text-[13px]">
                <MapPin size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 leading-relaxed">{order.delivery_address}</span>
              </div>

              <div className="flex items-center gap-2.5 text-[13px]">
                <CreditCard size={14} className="text-orange-400 flex-shrink-0" />
                <span className="text-gray-300">{paymentLabel}</span>
              </div>
            </section>

            {/* Tutar */}
            <section className="rounded-xl border border-[#334155] bg-[#1e293b] p-4 space-y-2">
              <h3 className="text-[13px] font-bold text-white mb-2">Tutar</h3>

              {order.subtotal != null && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-400">Ara Toplam</span>
                  <span className="text-gray-200">{order.subtotal.toFixed(2)}₺</span>
                </div>
              )}

              {order.delivery_fee != null && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-400">Teslimat</span>
                  <span className="text-gray-200">
                    {order.delivery_fee === 0
                      ? 'Ücretsiz'
                      : `${order.delivery_fee.toFixed(2)}₺`}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-[15px] font-bold pt-2 border-t border-[#334155]">
                <span className="text-white">Toplam</span>
                <span className="text-orange-400">{order.amount.toFixed(2)}₺</span>
              </div>
            </section>

            <p className="text-[11px] text-gray-500 text-center pb-1">
              {new Date(order.created_at).toLocaleString('tr-TR')}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
