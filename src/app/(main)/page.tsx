import { createClient } from '@/utils/supabase/server'
import { getUserHousehold } from '@/lib/household/queries'
import { getUserDashboardPeriod } from '@/lib/profile/queries'
import { getDashboardSummary } from '@/lib/finance/queries'
import { processDueRecurringSchedules } from '@/lib/finance/recurring'
import { getFirstName } from '@/lib/utils/name'
import { DashboardView } from '@/components/dashboard/dashboard-view'

type SearchParams = Promise<{ block?: string }>

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const household = await getUserHousehold()
  if (!household || !user) return null

  const period = await getUserDashboardPeriod()
  const periodOffset = Math.max(
    0,
    Math.min(11, parseInt(params.block ?? '0', 10) || 0)
  )

  const [, summary] = await Promise.all([
    processDueRecurringSchedules(),
    getDashboardSummary(household.id, period, periodOffset),
  ])

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'Usuario'

  return (
    <DashboardView
      firstName={getFirstName(displayName)}
      householdName={household.name}
      householdId={household.id}
      currency={household.base_currency}
      summary={summary}
    />
  )
}
