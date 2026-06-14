import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import type { Period } from '@/lib/finance/types'

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
