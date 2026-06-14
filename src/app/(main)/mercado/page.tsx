import { redirect } from 'next/navigation'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
import { getMarketInsights } from '@/lib/finance/queries'
import { MercadoClient } from './mercado-client'

export default async function MercadoPage() {
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  const insights = await getMarketInsights(ctx.household.id, ctx.period)

  return (
    <MercadoClient
      insights={insights}
      currency={ctx.household.base_currency}
    />
  )
}
