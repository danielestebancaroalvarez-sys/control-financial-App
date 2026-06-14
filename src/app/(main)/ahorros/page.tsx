import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getDashboardSummary, getSavingsGoals } from '@/lib/finance/queries'
import { AhorrosClient } from './ahorros-client'

export default async function AhorrosPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const [goals, dashboard] = await Promise.all([
    getSavingsGoals(ctx.household.id),
    getDashboardSummary(ctx.household.id, 'monthly', 0),
  ])

  return (
    <AhorrosClient
      goals={goals}
      householdId={ctx.household.id}
      currency={ctx.household.base_currency}
      guiltFreeMoney={dashboard.guiltFreeMoney}
      periodSavings={dashboard.periodSavings}
    />
  )
}
