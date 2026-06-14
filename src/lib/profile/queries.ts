import { createClient } from '@/utils/supabase/server'
import type { Period } from '@/lib/finance/types'
import { ensureUserProfile } from './sync'

export async function getUserDashboardPeriod(): Promise<Period> {
  await ensureUserProfile()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return 'monthly'

  const { data, error } = await supabase
    .from('profiles')
    .select('dashboard_period')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return 'monthly'

  return data.dashboard_period === 'weekly' ? 'weekly' : 'monthly'
}
