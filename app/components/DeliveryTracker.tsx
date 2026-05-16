'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, X } from 'lucide-react'

interface ToastInfo {
  orderId: number
  orderNumber: string
  restaurantName: string
}

export default function DeliveryTracker() {
  const router = useRouter()
  const [deliveryToast, setDeliveryToast] = useState<ToastInfo | null>(null)

  useEffect(() => {
    const customerId = localStorage.getItem('customer_id')
    if (!customerId) return

    const channel = supabase
      .channel(`global-orders-${customerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'packages',
          filter: `customer_id=eq.${customerId}`
        },
        async (payload) => {
          const newOrder = payload.new as any
          const oldOrder = payload.old as any

          // Sadece delivered olduğunda tetikle
          if (newOrder.status === 'delivered' && oldOrder?.status !== 'delivered') {
            // Browser push bildirimi
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Siparişiniz Teslim Edildi!', {
                body: `${newOrder.order_number} numaralı siparişiniz teslim edildi.`,
                icon: '/icon-192x192.png'
              })
            }

            // Restoran adını çek
            const { data } = await supabase
              .from('restaurants')
              .select('name')
              .eq('id', newOrder.restaurant_id)
              .single()

            setDeliveryToast({
              orderId: newOrder.id,
              orderNumber: newOrder.order_number,
              restaurantName: data?.name || 'Restoran'
            })

            // 10 saniye sonra otomatik kapat
            setTimeout(() => setDeliveryToast(null), 10000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  const handleToastClick = () => {
    setDeliveryToast(null)
    router.push('/siparislerim')
  }

  return (
    <AnimatePresence>
      {deliveryToast && (
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-4 left-4 right-4 z-[100] flex justify-center pointer-events-none"
        >
          <div
            onClick={handleToastClick}
            className="pointer-events-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl cursor-pointer flex items-center gap-3 max-w-md w-full"
          >
            <div className="bg-white/20 p-2.5 rounded-full flex-shrink-0">
              <Truck size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px]">Siparişiniz Teslim Edildi!</p>
              <p className="text-[12px] opacity-90 truncate">
                {deliveryToast.restaurantName} · {deliveryToast.orderNumber}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDeliveryToast(null)
                }}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                Değerlendir →
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
