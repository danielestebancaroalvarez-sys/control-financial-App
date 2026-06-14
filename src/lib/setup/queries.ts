import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { getUserHousehold, getHouseholdMembers } from '@/lib/household/queries'
import type { SetupContext, SetupMode } from './types'

export const hasCompletedSetup = cache(async (): Promise<boolean> => {
  const user = await getAuthUser()
  if (!user) return true

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('setup_completed_at')
    .eq('id', user.id)
    .maybeSingle()

  return !!data?.setup_completed_at
})

export async function getSetupContext(): Promise<SetupContext | null> {
  const user = await getAuthUser()
  const household = await getUserHousehold()
  if (!user || !household) return null

  const supabase = await createClient()

  const [members, txCountResult, membershipResult] = await Promise.all([
    getHouseholdMembers(household.id),
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', household.id),
    supabase
      .from('household_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('household_id', household.id)
      .maybeSingle(),
  ])

  const isOwner = membershipResult.data?.role === 'owner'
  const txCount = txCountResult.count ?? 0
  const mode: SetupMode =
    isOwner || txCount === 0 ? 'full' : 'member'

  return {
    householdId: household.id,
    householdName: household.name,
    currency: household.base_currency,
    inviteCode: household.invite_code,
    isOwner,
    mode,
    memberCount: members.length,
  }
}
