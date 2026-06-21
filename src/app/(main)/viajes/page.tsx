import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getTravelDashboard } from '@/lib/travel/queries'
import { hasCompletedTravelSetup } from '@/lib/setup/queries'
import { ViajesDashboardClient } from './viajes-dashboard-client'
import { SetupNudgeBanner } from '@/components/setup/setup-nudge-banner'

export default async function ViajesPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const [summary, travelSetupComplete] = await Promise.all([
    getTravelDashboard(ctx.household.id),
    hasCompletedTravelSetup(),
  ])

  return (
    <div className="space-y-3">
      {!travelSetupComplete && (
        <SetupNudgeBanner
          module="travel"
          href="/viajes/configuracion-inicial"
          title="Completa la configuración de Viajes"
          description="Configura el módulo para planificar presupuestos y metas de ahorro."
        />
      )}
      <ViajesDashboardClient
        summary={summary}
        householdName={ctx.household.name}
        currency={ctx.household.base_currency}
      />
    </div>
  )
}
