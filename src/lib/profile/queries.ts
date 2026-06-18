import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import type { Period } from '@/lib/finance/types'
import type { ThemePreference } from '@/components/theme/apply-theme'
import { ensureUserProfile } from './sync'
import type { UserProfile } from './types'

export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
  const user = await getAuthUser()
  if (!user) return null

  await ensureUserProfile()

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  const metaName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null

  const metaAvatar =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null

  return {
    id: user.id,
    fullName: data?.full_name ?? metaName,
    avatarUrl: data?.avatar_url ?? metaAvatar,
    email: user.email ?? null,
  }
})

export const getUserDashboardPeriod = cache(async (): Promise<Period> => {
  const user = await getAuthUser()
  if (!user) return 'monthly'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('dashboard_period')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return 'monthly'

  return data.dashboard_period === 'weekly' ? 'weekly' : 'monthly'
})

export const getUserTheme = cache(async (): Promise<ThemePreference> => {
  const user = await getAuthUser()
  if (!user) return 'light'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('theme')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return 'light'

  return data.theme === 'dark' ? 'dark' : 'light'
})
