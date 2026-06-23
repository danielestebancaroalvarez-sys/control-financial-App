import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getTimeDashboard, getMaxWeekOffsetWithData } from '@/lib/time/queries'
import { TiempoDashboardClient } from './tiempo-dashboard-client'

type SearchParams = Promise<{ block?: string }>

export default async function TiempoPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const params = await searchParams
  const requestedOffset = Math.max(
    0,
    Math.min(11, parseInt(params.block ?? '0', 10) || 0)
  )

  const maxWeekOffset = await getMaxWeekOffsetWithData(ctx.household.id)
  const periodOffset = Math.min(requestedOffset, maxWeekOffset)

  const summary = await getTimeDashboard(ctx.household.id, periodOffset)

  return (
    <TiempoDashboardClient
      summary={summary}
      periodOffset={periodOffset}
      maxWeekOffset={maxWeekOffset}
      householdName={ctx.household.name}
    />
  )
}
