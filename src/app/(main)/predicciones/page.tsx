import { createClient } from '@/utils/supabase/server'
import { getUserHousehold } from '@/lib/household/queries'
import { getPredictionsSummary } from '@/lib/finance/queries'
import { formatMoney } from '@/lib/finance/format'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { CheckCircle2, Circle, LineChart, AlertTriangle } from 'lucide-react'

const FREQ_LABELS: Record<string, string> = {
  weekly: 'semanal',
  biweekly: 'quincenal',
  monthly: 'mensual',
}

export default async function PrediccionesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const household = await getUserHousehold()
  if (!household || !user) return null

  const summary = await getPredictionsSummary(household.id)
  const fmt = (n: number) => formatMoney(n, household.base_currency)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-[#2D3436]">Radar y Predicciones</h1>
        <p className="text-[13px] text-[#636E72]">Servicios fijos y consumo proyectado</p>
      </div>

      <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
        <h2 className="text-[14px] font-bold text-[#2D3436] mb-4">
          Servicios y Pagos Fijos (Este Mes)
        </h2>
        {summary.fixedServices.length === 0 ? (
          <p className="text-[13px] text-[#636E72]">
            Crea gastos recurrentes en categorías fijas (Arriendo, Luz, Internet).
          </p>
        ) : (
          <ul className="space-y-3">
            {summary.fixedServices.map(svc => (
              <li
                key={svc.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F5]"
              >
                {svc.status === 'paid' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#00BFA5] shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[#B2BEC3] shrink-0" />
                )}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white"
                  style={{ color: '#636E72' }}
                >
                  <CategoryIcon icon={svc.categoryIcon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#2D3436]">{svc.name}</p>
                  <p className="text-[11px] text-[#636E72]">
                    {fmt(svc.amount)} / {FREQ_LABELS[svc.frequency] ?? svc.frequency}
                  </p>
                  {svc.status === 'paid' && svc.paidDate && (
                    <p className="text-[10px] text-[#00BFA5]">
                      Pagado {svc.paidDate}
                    </p>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                    svc.status === 'paid'
                      ? 'bg-[#00BFA5]/15 text-[#00BFA5]'
                      : 'bg-[#FFE082]/30 text-[#F59E0B]'
                  }`}
                >
                  {svc.status === 'paid' ? 'Pagado' : 'Pendiente'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {summary.subscriptions.length > 0 && (
        <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
          <h2 className="text-[14px] font-bold text-[#2D3436] mb-4">
            Radar de Suscripciones
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {summary.subscriptions.map(sub => (
              <div
                key={sub.id}
                className="p-3 rounded-2xl bg-[#F5F5F5] border border-[#EEEEEE]"
              >
                <p className="text-[13px] font-semibold text-[#2D3436] truncate">
                  {sub.name}
                </p>
                <p className="text-[12px] text-[#636E72]">
                  {fmt(sub.amount)}/mes
                </p>
                <p className="text-[10px] text-[#F59E0B] mt-1">
                  {sub.status === 'paid' ? 'Pagado este mes' : 'Pendiente'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {summary.consumption && (
        <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <LineChart className="w-4 h-4 text-[#00BFA5]" />
            <h2 className="text-[14px] font-bold text-[#2D3436]">
              Predicción de Consumo ({summary.consumption.categoryName})
            </h2>
          </div>
          <p className="text-[28px] font-bold text-[#2D3436] mb-1">
            {fmt(summary.consumption.projectedTotal)}
            <span className="text-[13px] font-medium text-[#636E72] ml-2">
              predicho
            </span>
          </p>
          <p className="text-[12px] text-[#636E72] mb-4">
            Llevás {fmt(summary.consumption.spentSoFar)} gastados ·{' '}
            {summary.consumption.daysRemaining} días restantes
          </p>
          {summary.consumption.historicalAverage > 0 && (
            <div
              className={`rounded-2xl p-4 flex items-start gap-2 ${
                summary.consumption.percentVsAverage > 10
                  ? 'bg-[#FFEBEE] border border-[#FFCDD2]'
                  : 'bg-[#E8F5E9] border border-[#C8E6C9]'
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  summary.consumption.percentVsAverage > 10
                    ? 'text-[#EC4899]'
                    : 'text-[#00BFA5]'
                }`}
              />
              <p className="text-[12px] text-[#2D3436]">
                Al ritmo actual, gastarás {fmt(summary.consumption.projectedTotal)} a fin de mes.
                {summary.consumption.percentVsAverage > 0 ? (
                  <>
                    {' '}Estás un{' '}
                    <strong>{summary.consumption.percentVsAverage}%</strong> por encima de tu
                    promedio ({fmt(summary.consumption.historicalAverage)}).
                  </>
                ) : summary.consumption.percentVsAverage < 0 ? (
                  <>
                    {' '}Vas un{' '}
                    <strong>{Math.abs(summary.consumption.percentVsAverage)}%</strong> por debajo
                    de tu promedio ({fmt(summary.consumption.historicalAverage)}).
                  </>
                ) : (
                  <> Estás en línea con tu promedio.</>
                )}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
