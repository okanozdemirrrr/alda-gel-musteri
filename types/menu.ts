export interface OptionItem {
  id: string
  name: string
  price_diff: number // Fiyat farkı (0 = ücretsiz, 50 = +50₺)
}

export interface OptionGroup {
  id: string
  name: string            // product_option_groups.title
  type: 'radio' | 'checkbox'
  required: boolean       // product_option_groups.necessity
  min_select: number      // Min seçim (zorunluysa genelde 1)
  max_select: number      // Max seçim (1 = radio, >1 = checkbox)
  options: OptionItem[]
}

export interface SelectedOption {
  group_id: string
  group_name: string
  option_id: string
  option_name: string
  price_diff: number
}

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
  option_groups?: OptionGroup[] // Ürün opsiyon grupları (JSON column)
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
  selected_options?: SelectedOption[]  // Seçilen opsiyonlar
  unit_price?: number                  // Opsiyonlar dahil birim fiyat
}
