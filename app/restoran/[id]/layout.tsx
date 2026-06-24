import { createClient } from '@supabase/supabase-js'

export async function generateStaticParams() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return [{ id: 'placeholder' }]
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data } = await supabase.from('restaurants').select('id')

    if (data && data.length > 0) {
      return data.map((r) => ({ id: String(r.id) }))
    }
  } catch {
    // Build sırasında Supabase erişilemezse placeholder ile devam et
  }

  return [{ id: 'placeholder' }]
}

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
