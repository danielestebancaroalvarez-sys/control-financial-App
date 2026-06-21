import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMainAppContext } from '@/lib/app/context'
import { getBudgetOverview } from '@/lib/travel/queries'
import { formatMoney } from '@/lib/travel/format'
import { TRIP_STATUS_LABELS } from '@/lib/travel/prep-templates'

export default async function ViajesPresupuestoPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const trips = await getBudgetOverview(ctx.household.id)
  const currency = ctx.household.base_currency
  const total = trips.reduce((s, t) => s + t.totalEstimated, 0)

  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-bold text-cc-primary">Presupuesto</h1>
      <div className="cc-surface rounded-[20px] p-4">
        <p className="text-[10px] font-bold text-cc-muted uppercase">Total viajes activos</p>
        <p className="text-[28px] font-bold text-[#0EA5E9]">
          {formatMoney(total, currency)}
        </p>
      </div>
      <div className="space-y-3">
        {trips.map(trip => (
          <Link
            key={trip.id}
            href={`/viajes/${trip.id}?tab=budget`}
            className="block cc-surface rounded-[20px] p-4"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="text-[14px] font-bold text-cc-primary">{trip.name}</p>
                <p className="text-[11px] text-cc-secondary">{trip.destination}</p>
              </div>
              <span className="text-[10px] font-bold text-[#0369A1] bg-[#E0F2FE] px-2 py-0.5 rounded-full">
                {TRIP_STATUS_LABELS[trip.status]}
              </span>
            </div>
            <div className="flex justify-between mt-3 text-[12px]">
              <span className="text-cc-secondary">
                {formatMoney(trip.totalPerPerson, currency)} / persona
              </span>
              <span className="font-bold text-[#0EA5E9]">
                {formatMoney(trip.totalEstimated, currency)}
              </span>
            </div>
            {trip.savingsPercent > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-[#E2E8F0]">
                <div
                  className="h-full bg-[#0EA5E9] rounded-full"
                  style={{ width: `${trip.savingsPercent}%` }}
                />
              </div>
            )}
          </Link>
        ))}
        {trips.length === 0 && (
          <p className="text-[13px] text-cc-secondary text-center py-8">
            No hay viajes activos con presupuesto
          </p>
        )}
      </div>
    </div>
  )
}
