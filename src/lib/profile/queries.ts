import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import type { Period } from '@/lib/finance/types'
import type { ThemePreference } from '@/components/theme/apply-theme'

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
