import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getSavingsGoals } from '@/lib/finance/queries'
import { AhorrosClient } from './ahorros-client'

export default async function AhorrosPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const goals = await getSavingsGoals(ctx.household.id)

  return (
    <AhorrosClient
      goals={goals}
      householdId={ctx.household.id}
      currency={ctx.household.base_currency}
    />
  )
}
