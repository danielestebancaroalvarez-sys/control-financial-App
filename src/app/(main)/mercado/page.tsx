import { redirect } from 'next/navigation'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
import { getMarketInsights, getShoppingListChecks } from '@/lib/finance/queries'
import { MercadoClient } from './mercado-client'

export default async function MercadoPage() {
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  const [insights, shoppingChecks] = await Promise.all([
    getMarketInsights(ctx.household.id, ctx.period),
    getShoppingListChecks(ctx.household.id),
  ])

  return (
    <MercadoClient
      insights={insights}
      currency={ctx.household.base_currency}
      householdId={ctx.household.id}
      shoppingChecks={shoppingChecks}
    />
  )
}
