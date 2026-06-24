import { supabase } from '@/app/lib/supabase'
import type { OptionGroup } from '@/types/menu'

function parseOptionGroupsJson(value: unknown): unknown[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function resolveGroupType(group: Record<string, unknown>, optionCount: number): 'radio' | 'checkbox' {
  const type = String(group.type || group.selection_type || '').toLowerCase()
  if (type === 'radio' || type === 'single' || type === 'tekli') return 'radio'
  if (type === 'checkbox' || type === 'multiple' || type === 'coklu') return 'checkbox'
  if (group.max_select === 1 || group.maxSelect === 1) return 'radio'
  return optionCount <= 1 ? 'radio' : 'checkbox'
}

export function normalizeOptionGroups(raw: unknown): OptionGroup[] {
  const groups = parseOptionGroupsJson(raw)
  if (groups.length === 0) return []

  return groups
    .map((group: any, groupIndex: number) => {
      const rawOptions =
        group.options || group.items || group.choices || group.product_options || []
      const optionCount = rawOptions.length
      const groupType = resolveGroupType(group, optionCount)
      const isRadio = groupType === 'radio'

      const required = Boolean(
        group.necessity ?? group.required ?? group.is_required ?? group.isRequired
      )
      const minSelect = Number(group.min_select ?? group.minSelect ?? (required ? 1 : 0))
      const maxSelect = Number(
        group.max_select ??
          group.maxSelect ??
          (isRadio ? 1 : optionCount || 10)
      )

      return {
        id: String(group.id || `group-${groupIndex}`),
        name: group.title || group.name || 'Seçenek',
        type: groupType,
        required,
        min_select: minSelect,
        max_select: Math.max(maxSelect, minSelect, isRadio ? 1 : 1),
        options: rawOptions.map((option: any, optionIndex: number) => ({
          id: String(option.id || `opt-${groupIndex}-${optionIndex}`),
          name: option.name || option.label || option.title || '',
          price_diff: Number(
            option.price_impact ??
              option.price_diff ??
              option.price_modifier ??
              option.extra_price ??
              option.price ??
              0
          ),
        })),
      }
    })
    .filter((group) => group.options.length > 0)
}

export async function fetchProductOptionGroups(
  productId: string,
  inlineOptionGroups?: unknown
): Promise<OptionGroup[]> {
  const fromInline = normalizeOptionGroups(inlineOptionGroups)

  const { data, error } = await supabase
    .from('product_option_groups')
    .select('*, product_options(*)')
    .eq('product_id', productId)

  if (error) {
    console.error('Opsiyon query hatası:', error)
    return fromInline
  }

  if (!data?.length) return fromInline

  const fromDb = normalizeOptionGroups(
    [...data]
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((group: any) => ({
        ...group,
        options: [...(group.product_options || [])].sort(
          (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
        ),
      }))
  )

  if (fromInline.length === 0) return fromDb

  const inlineIds = new Set(fromInline.map((g) => g.id))
  return [...fromInline, ...fromDb.filter((g) => !inlineIds.has(g.id))]
}

export function buildSelectedOptions(
  selections: Record<string, string[]>,
  optionGroups: OptionGroup[]
) {
  const result: {
    group_id: string
    group_name: string
    option_id: string
    option_name: string
    price_diff: number
  }[] = []

  for (const group of optionGroups) {
    for (const optionId of selections[group.id] || []) {
      const option = group.options.find((o) => o.id === optionId)
      if (!option) continue
      result.push({
        group_id: group.id,
        group_name: group.name,
        option_id: option.id,
        option_name: option.name,
        price_diff: option.price_diff,
      })
    }
  }

  return result
}

export function calcOptionPriceTotal(
  selections: Record<string, string[]>,
  optionGroups: OptionGroup[]
): number {
  return buildSelectedOptions(selections, optionGroups).reduce(
    (sum, opt) => sum + opt.price_diff,
    0
  )
}

export function areRequiredGroupsSatisfied(
  selections: Record<string, string[]>,
  optionGroups: OptionGroup[]
): boolean {
  return getFirstUnsatisfiedRequiredGroup(selections, optionGroups) === null
}

export function getFirstUnsatisfiedRequiredGroup(
  selections: Record<string, string[]>,
  optionGroups: OptionGroup[]
): OptionGroup | null {
  return (
    optionGroups.find(
      (g) => g.required && (selections[g.id] || []).length < g.min_select
    ) ?? null
  )
}

export async function productHasOptionGroups(
  productId: string,
  inlineOptionGroups?: unknown
): Promise<boolean> {
  const groups = await fetchProductOptionGroups(productId, inlineOptionGroups)
  if (groups.length > 0) return true

  const { count, error } = await supabase
    .from('product_option_groups')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)

  if (error) {
    console.error('Opsiyon kontrol hatası:', error)
    return false
  }

  return (count ?? 0) > 0
}
