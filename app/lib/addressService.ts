import { supabase } from '@/app/lib/supabase'
import { buildUserAddressRecord, type UserAddressRecord } from '@/app/lib/formatDeliveryAddress'

export async function resolveAuthUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Lütfen önce giriş yapın')
  return user.id
}

export async function fetchUserAddressCoordinates(userId?: string) {
  const resolvedUserId = userId ?? await resolveAuthUserId()

  const { data, error } = await supabase
    .from('user_addresses')
    .select('latitude, longitude')
    .eq('user_id', resolvedUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function fetchUserAddressFullText(userId?: string) {
  const resolvedUserId = userId ?? await resolveAuthUserId()

  const { data, error } = await supabase
    .from('user_addresses')
    .select('full_address')
    .eq('user_id', resolvedUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.full_address ?? null
}

export async function saveUserAddress(input: {
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
  const userId = await resolveAuthUserId()
  const addressRecord = buildUserAddressRecord({ userId, ...input })

  const { data: existingAddresses, error: fetchError } = await supabase
    .from('user_addresses')
    .select('id')
    .eq('user_id', userId)
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
