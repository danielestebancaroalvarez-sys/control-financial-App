import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getTravelDashboard } from '@/lib/travel/queries'
import { ViajesDashboardClient } from './viajes-dashboard-client'

export default async function ViajesPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const summary = await getTravelDashboard(ctx.household.id)

  return (
    <ViajesDashboardClient
      summary={summary}
      householdName={ctx.household.name}
      currency={ctx.household.base_currency}
    />
  )
}
