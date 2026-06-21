import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
import { getDashboardSummary, getPredictionsSummary } from '@/lib/finance/queries'
import { buildProactiveInsight } from '@/lib/insights/proactive-insight'
import { processDueRecurringSchedules } from '@/lib/finance/recurring'
import { processDueSavingsContributions } from '@/lib/finance/savings-recurring'
import { getFirstName } from '@/lib/utils/name'
import { createClient } from '@/utils/supabase/server'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import { SetupNudgeBanner } from '@/components/setup/setup-nudge-banner'
import { hasCompletedFinanceSetup } from '@/lib/setup/queries'

type SearchParams = Promise<{ block?: string }>

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  const supabase = await createClient()
  after(async () => {
    await Promise.all([
      processDueRecurringSchedules(supabase),
      processDueSavingsContributions(supabase),
    ])
  })

  const periodOffset = Math.max(
    0,
    Math.min(11, parseInt(params.block ?? '0', 10) || 0)
  )

  const [summary, predictions, financeSetupComplete] = await Promise.all([
    getDashboardSummary(ctx.household.id, ctx.period, periodOffset),
    getPredictionsSummary(ctx.household.id, ctx.period),
    hasCompletedFinanceSetup(),
  ])

  const proactiveInsight = buildProactiveInsight(
    summary,
    predictions,
    ctx.household.base_currency
  )

  const displayName =
    ctx.user.user_metadata?.full_name ??
    ctx.user.user_metadata?.name ??
    ctx.user.email?.split('@')[0] ??
    'Usuario'

  return (
    <div className="space-y-3">
      {!financeSetupComplete && (
        <SetupNudgeBanner
          module="finance"
          href="/configuracion-inicial"
          title="Completa la configuración de Finanzas"
          description="Indica ingresos, gastos fijos y periodo para ver el dashboard con datos reales."
        />
      )}
      <DashboardView
        firstName={getFirstName(displayName)}
        householdName={ctx.household.name}
        currency={ctx.household.base_currency}
        summary={summary}
        proactiveInsight={proactiveInsight}
      />
    </div>
  )
}
