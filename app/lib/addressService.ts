import { supabase } from '@/app/lib/supabase'
import { buildUserAddressRecord, type UserAddressRecord } from '@/app/lib/formatDeliveryAddress'

export async function fetchUserAddressCoordinates(customerId: string) {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('latitude, longitude')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function fetchUserAddressFullText(customerId: string) {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('full_address')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.full_address ?? null
}

export async function saveUserAddress(input: {
  customerId: string
  title: string
  district: string
  neighborhood: string
  street: string
  buildingNo: string
  floor: string
  directions: string
  latitude: number
  longitude: number
}): Promise<UserAddressRecord> {
  const addressRecord = buildUserAddressRecord(input)

  const { data: existingAddresses, error: fetchError } = await supabase
    .from('user_addresses')
    .select('id')
    .eq('customer_id', input.customerId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (fetchError) throw fetchError

  const existingAddress = existingAddresses?.[0]

  if (existingAddress?.id) {
    const { error: updateError } = await supabase
      .from('user_addresses')
      .update(addressRecord)
      .eq('id', existingAddress.id)

    if (updateError) throw updateError
  } else {
    const { error: insertError } = await supabase
      .from('user_addresses')
      .insert([addressRecord])

    if (insertError) throw insertError
  }

  return addressRecord
}
