import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getTimeDashboard } from '@/lib/time/queries'
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
  const periodOffset = Math.max(
    0,
    Math.min(11, parseInt(params.block ?? '0', 10) || 0)
  )

  const summary = await getTimeDashboard(ctx.household.id, periodOffset)

  return (
    <TiempoDashboardClient
      summary={summary}
      periodOffset={periodOffset}
      householdName={ctx.household.name}
    />
  )
}
