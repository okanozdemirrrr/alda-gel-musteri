export interface DeliveryAddressInput {
  district?: string | null
  neighborhood?: string | null
  street?: string | null
  street_address?: string | null
  floor?: string | null
  building_no?: string | null
  door_no?: string | null
  door_number?: string | null
  directions?: string | null
  description?: string | null
  notes?: string | null
}

export function formatDeliveryAddress(address: DeliveryAddressInput): string {
  const district = (address.district ?? '').trim()
  const neighborhood = (address.neighborhood ?? '').trim()
  const street = (address.street ?? address.street_address ?? '').trim()
  const floor = (address.floor ?? '').trim()
  const door = (address.building_no ?? address.door_no ?? address.door_number ?? '').trim()
  const tarif = (address.directions ?? address.description ?? address.notes ?? '').trim()

  const parts = [
    district,
    neighborhood,
    street,
    floor ? `Kat: ${floor}` : '',
    door ? `No: ${door}` : '',
  ].filter(Boolean)

  const base = parts.join(', ')
  return tarif ? `${base} | Tarif: ${tarif}` : base
}

export function parseDeliveryAddress(raw: string | null | undefined): { address: string; tarif: string | null } {
  if (!raw?.trim()) return { address: raw ?? '', tarif: null }

  const tarifMatch = raw.match(/\s*\|\s*Tarif:\s*(.+)$/i)
  if (tarifMatch) {
    return {
      address: raw.slice(0, tarifMatch.index).trim(),
      tarif: tarifMatch[1].trim() || null,
    }
  }

  const legacy = raw.trim().match(/^[^-]+\s*-\s*([^,]+),\s*([^,]+),\s*Kat:\s*([^,]+),\s*No:\s*(.+)$/i)
  if (legacy) {
    const [, neighborhood, district, floor, door] = legacy
    return {
      address: `${district.trim()}, ${neighborhood.trim()}, Kat: ${floor.trim()}, No: ${door.trim()}`,
      tarif: null,
    }
  }

  return { address: raw.trim(), tarif: null }
}
