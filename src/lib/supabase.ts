import { createClient } from '@supabase/supabase-js'

export type RSVPSubmission = {
  name: string
  attendance: 'attending' | 'not-attending' | 'pending'
  guests_count: number
  message: string
}

export type WishSubmission = {
  name: string
  message: string
}

export type WishRecord = {
  id: string
  name: string
  message: string
  created_at: string
  approved: boolean
}

const runtimeSupabaseConfig = typeof window !== 'undefined' ? (window as typeof window & { __SUPABASE_CONFIG__?: { url?: string; anonKey?: string } }).__SUPABASE_CONFIG__ : undefined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || runtimeSupabaseConfig?.url
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || runtimeSupabaseConfig?.anonKey

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : null

export async function getApprovedWishes() {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('guest_wishes')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as WishRecord[]
}

export async function submitRSVP(payload: RSVPSubmission) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable submissions.')
  }

  const { error } = await supabase.from('rsvp_responses').insert([
    {
      name: payload.name,
      attendance: payload.attendance,
      guests_count: payload.guests_count,
      message: payload.message,
      created_at: new Date().toISOString(),
    },
  ])

  if (error) {
    throw new Error(error.message)
  }
}

export async function submitWish(payload: WishSubmission): Promise<WishRecord> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable submissions.')
  }

  const { data, error } = await supabase
    .from('guest_wishes')
    .insert([
      {
        name: payload.name,
        message: payload.message,
        approved: true,
        created_at: new Date().toISOString(),
      },
    ])
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as WishRecord
}

