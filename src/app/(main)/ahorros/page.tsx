import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
import { getDashboardSummary, getSavingsGoals } from '@/lib/finance/queries'
import { AhorrosClient } from './ahorros-client'

export default async function AhorrosPage() {
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  const [goals, dashboard] = await Promise.all([
    getSavingsGoals(ctx.household.id),
    getDashboardSummary(ctx.household.id, ctx.period, 0),
  ])

  return (
    <Suspense fallback={null}>
      <AhorrosClient
        goals={goals}
        householdId={ctx.household.id}
        currency={ctx.household.base_currency}
        guiltFreeMoney={dashboard.guiltFreeMoney}
        periodSavings={dashboard.periodSavings}
      />
    </Suspense>
  )
}
