import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getTimeDashboard } from '@/lib/time/queries'
import { getSleepTrackerData } from '@/lib/time/sleep-queries'
import { hasCompletedTimeSetup } from '@/lib/setup/queries'
import { TiempoDashboardClient } from './tiempo-dashboard-client'
import { SetupNudgeBanner } from '@/components/setup/setup-nudge-banner'

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

  const [summary, sleepData, timeSetupComplete] = await Promise.all([
    getTimeDashboard(ctx.household.id, periodOffset),
    getSleepTrackerData(ctx.household.id, ctx.user.id),
    hasCompletedTimeSetup(),
  ])

  return (
    <div className="space-y-3">
      {!timeSetupComplete && (
        <SetupNudgeBanner
          module="time"
          href="/tiempo/configuracion-inicial"
          title="Completa la configuración de Tiempo"
          description="Configura sueño y recordatorios para aprovechar el módulo."
        />
      )}
      <TiempoDashboardClient
        summary={summary}
        periodOffset={periodOffset}
        householdName={ctx.household.name}
        householdId={ctx.household.id}
        sleepData={sleepData}
      />
    </div>
  )
}
