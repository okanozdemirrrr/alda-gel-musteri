import type { SelectedOption } from '@/types/menu'
import type { OrderLineItem } from '@/types/order'

function parseJsonArray(raw: unknown): unknown[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function normalizeSelectedOptions(raw: unknown): SelectedOption[] {
  return parseJsonArray(raw).map((opt: any, index: number) => ({
    group_id: String(opt.group_id || opt.groupId || `group-${index}`),
    group_name: opt.group_name || opt.groupName || opt.group_title || 'Seçenek',
    option_id: String(opt.option_id || opt.optionId || `opt-${index}`),
    option_name: opt.option_name || opt.optionName || opt.name || '',
    price_diff: Number(opt.price_diff ?? opt.price_impact ?? opt.priceDiff ?? 0),
  }))
}

export function normalizeOrderItems(raw: unknown): OrderLineItem[] {
  return parseJsonArray(raw).map((item: any, index: number) => ({
    product_id: String(item.product_id || item.id || `item-${index}`),
    product_name: item.product_name || item.name || 'Ürün',
    quantity: Number(item.quantity || 1),
    price: Number(item.price ?? item.unit_price ?? item.base_price ?? 0),
    base_price:
      item.base_price != null ? Number(item.base_price) : undefined,
    selected_options: normalizeSelectedOptions(item.selected_options || item.options),
    item_note: item.item_note ?? item.note ?? null,
  }))
}

export function formatOptionLine(option: SelectedOption): string {
  const priceSuffix =
    option.price_diff !== 0
      ? ` (${option.price_diff > 0 ? '+' : ''}${option.price_diff.toFixed(2)}₺)`
      : ''
  return `${option.group_name}: ${option.option_name}${priceSuffix}`
}
