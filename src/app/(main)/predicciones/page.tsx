import { createClient } from '@/utils/supabase/server'
import { getUserHousehold } from '@/lib/household/queries'
import { getUserDashboardPeriod } from '@/lib/profile/queries'
import { getPredictionsSummary } from '@/lib/finance/queries'
import { formatMoney, getPeriodLabels } from '@/lib/finance/format'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { Circle, ShoppingBag } from 'lucide-react'

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

  const period = await getUserDashboardPeriod()
  const summary = await getPredictionsSummary(household.id, period)
  const fmt = (n: number) => formatMoney(n, household.base_currency)
  const labels = getPeriodLabels(period)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-[#2D3436]">Radar y Predicciones</h1>
        <p className="text-[13px] text-[#636E72]">
          {labels.next} · {summary.nextPeriodStart} → {summary.nextPeriodEnd}
        </p>
      </div>

      <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
        <h2 className="text-[14px] font-bold text-[#2D3436] mb-4">
          Servicios y pagos fijos · {labels.next}
        </h2>
        {summary.fixedServices.length === 0 ? (
          <p className="text-[13px] text-[#636E72]">
            Crea gastos recurrentes en categorías de servicio (Arriendo, Luz, Internet).
          </p>
        ) : (
          <ul className="space-y-3">
            {summary.fixedServices.map(svc => (
              <li
                key={svc.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F5]"
              >
                <Circle className="w-5 h-5 text-[#F59E0B] shrink-0" />
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white"
                  style={{ color: '#636E72' }}
                >
                  <CategoryIcon icon={svc.categoryIcon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#2D3436]">{svc.name}</p>
                  <p className="text-[11px] text-[#636E72]">
                    {fmt(svc.amount)}
                    {svc.occurrences && svc.occurrences > 1
                      ? ` · ${svc.occurrences} pagos`
                      : ` / ${FREQ_LABELS[svc.frequency] ?? svc.frequency}`}
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-[#FFE082]/30 text-[#F59E0B]">
                  Próximo
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {summary.subscriptions.length > 0 && (
        <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
          <h2 className="text-[14px] font-bold text-[#2D3436] mb-4">
            Suscripciones · {labels.next}
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
                  {fmt(sub.amount)}
                  {sub.occurrences && sub.occurrences > 1
                    ? ` · ${sub.occurrences}x`
                    : ` / ${FREQ_LABELS[sub.frequency] ?? sub.frequency}`}
                </p>
                <p className="text-[10px] text-[#F59E0B] mt-1">Próximo periodo</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="w-4 h-4 text-[#00BFA5]" />
          <h2 className="text-[14px] font-bold text-[#2D3436]">
            Predicción de compras · {labels.next}
          </h2>
        </div>
        {summary.purchasePredictions.length === 0 ? (
          <p className="text-[13px] text-[#636E72]">
            Registra compras en Mercado (con o sin ítems detallados) o marca un gasto
            recurrente en Mercado para ver predicciones aquí.
          </p>
        ) : (
          <ul className="space-y-2">
            {summary.purchasePredictions.map(item => (
              <li
                key={item.itemName}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F5]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#2D3436] truncate">
                    {item.itemName}
                  </p>
                  <p className="text-[11px] text-[#636E72]">
                    ~{item.expectedPurchases} compra
                    {item.expectedPurchases !== 1 ? 's' : ''} · {fmt(item.avgUnitPrice)} c/u
                    {item.lastPurchased && ` · última ${item.lastPurchased}`}
                  </p>
                </div>
                <span className="text-[14px] font-bold text-[#2D3436] shrink-0">
                  {fmt(item.projectedSpend)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
