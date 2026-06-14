import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
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
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  after(async () => {
    await processDueRecurringSchedules()
  })

  const periodOffset = Math.max(
    0,
    Math.min(11, parseInt(params.block ?? '0', 10) || 0)
  )

  const summary = await getDashboardSummary(
    ctx.household.id,
    ctx.period,
    periodOffset
  )

  const displayName =
    ctx.user.user_metadata?.full_name ??
    ctx.user.user_metadata?.name ??
    ctx.user.email?.split('@')[0] ??
    'Usuario'

  return (
    <DashboardView
      firstName={getFirstName(displayName)}
      householdName={ctx.household.name}
      householdId={ctx.household.id}
      currency={ctx.household.base_currency}
      summary={summary}
    />
  )
}
