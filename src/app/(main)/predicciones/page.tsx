import { redirect } from 'next/navigation'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
import { getPredictionsSummary } from '@/lib/finance/queries'
import { PrediccionesClient } from './predicciones-client'

export default async function PrediccionesPage() {
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  const summary = await getPredictionsSummary(ctx.household.id, ctx.period)

  return (
    <PrediccionesClient
      summary={summary}
      currency={ctx.household.base_currency}
    />
  )
}
