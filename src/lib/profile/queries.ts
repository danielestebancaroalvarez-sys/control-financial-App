import { createClient } from '@/utils/supabase/server'
import type { Period } from '@/lib/finance/types'

export async function getUserDashboardPeriod(): Promise<Period> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return 'monthly'

  const { data } = await supabase
    .from('profiles')
    .select('dashboard_period')
    .eq('id', user.id)
    .single()

  return data?.dashboard_period === 'weekly' ? 'weekly' : 'monthly'
}
