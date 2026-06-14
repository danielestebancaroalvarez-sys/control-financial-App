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

export async function getHouseholdMembers(
  householdId: string
): Promise<HouseholdMember[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_household_members_list', {
    p_household_id: householdId,
  })

  if (error || !data) return []

  type MemberRow = {
    id: string
    user_id: string
    role: string
    joined_at: string
    full_name: string | null
    avatar_url: string | null
  }

  return (data as MemberRow[]).map(row => ({
    id: row.id,
    user_id: row.user_id,
    role: row.role as 'owner' | 'member',
    joined_at: row.joined_at,
    full_name: row.full_name ?? null,
    avatar_url: row.avatar_url ?? null,
  }))
}

export async function userHasHousehold(): Promise<boolean> {
  const household = await getUserHousehold()
  return household !== null
}
