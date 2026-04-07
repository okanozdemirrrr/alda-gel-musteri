export interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category?: string
  category_id?: string
  restaurant_id?: string
  is_visible?: boolean
  is_available?: boolean
  related_products?: string[] // Eski alan (deprecated)
  upsell_product_ids?: string[] // Yan ürün ID'leri (restoran panelinden kaydedilen)
}

export interface Category {
  id: string
  name: string
  icon_url?: string
  restaurant_id?: string
}

export interface CartItemLocal {
  product: Product
  quantity: number
  note?: string
}
