import { createClient } from '@/utils/supabase/server'
import type { Household, HouseholdMember } from './types'

export async function getUserHousehold(): Promise<Household | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) return null

  const { data: household } = await supabase
    .from('households')
    .select('id, name, base_currency, invite_code, created_at')
    .eq('id', membership.household_id)
    .single()

  return household
}

export async function getHouseholdMembers(
  householdId: string
): Promise<HouseholdMember[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('household_members')
    .select(
      `
      id,
      user_id,
      role,
      joined_at,
      profiles (
        full_name,
        avatar_url
      )
    `
    )
    .eq('household_id', householdId)
    .order('joined_at', { ascending: true })

  if (!data) return []

  return data.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      user_id: row.user_id,
      role: row.role as 'owner' | 'member',
      joined_at: row.joined_at,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    }
  })
}

export async function userHasHousehold(): Promise<boolean> {
  const household = await getUserHousehold()
  return household !== null
}
