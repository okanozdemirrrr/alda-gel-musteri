import type { SelectedOption } from '@/types/menu'

export interface OrderLineItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
  base_price?: number
  selected_options: SelectedOption[]
  item_note?: string | null
}

export interface OrderDetail {
  id: number
  order_number: string
  restaurant_name?: string
  amount: number
  subtotal?: number | null
  delivery_fee?: number | null
  delivery_address: string
  customer_name: string
  customer_phone?: string | null
  payment_method?: string | null
  status: string
  created_at: string
  items: OrderLineItem[]
}
