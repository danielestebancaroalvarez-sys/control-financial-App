import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import type { Household, HouseholdMember } from './types'

export const getUserHousehold = cache(async (): Promise<Household | null> => {
  const user = await getAuthUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('household_members')
    .select(
      `
      household_id,
      households (
        id,
        name,
        base_currency,
        invite_code,
        created_at
      )
    `
    )
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!data?.households) return null

  const household = Array.isArray(data.households)
    ? data.households[0]
    : data.households

  return household as Household
})

export const getHouseholdMembers = cache(
  async (householdId: string): Promise<HouseholdMember[]> => {
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

    return data.map(row => {
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
)

export async function userHasHousehold(): Promise<boolean> {
  const household = await getUserHousehold()
  return household !== null
}
