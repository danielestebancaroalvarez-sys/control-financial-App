'use client'

import Link from 'next/link'
import { CalendarClock, ShoppingBag } from 'lucide-react'
import { ConsumptionPredictionCard } from '@/components/predictions/consumption-prediction-card'
import { WeeklyInsightsCard } from '@/components/predictions/weekly-insights-card'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { formatMoney, formatFrequency, getPeriodLabels } from '@/lib/finance/format'
import type { PredictionsSummary } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

export function PrediccionesClient({
  summary,
  currency,
  householdId,
}: {
  summary: PredictionsSummary
  currency: CurrencyCode
  householdId: string
}) {
  const fmt = (n: number) => formatMoney(n, currency)
  const labels = getPeriodLabels(summary.period)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-[#2D3436]">Radar y Predicciones</h1>
        <p className="text-[13px] text-[#636E72]">
          {labels.current} · {summary.currentPeriodStart} → {summary.currentPeriodEnd}
        </p>
      </div>

      <WeeklyInsightsCard householdId={householdId} />

      {summary.consumptionPredictions.length > 0 && (
        <section className="space-y-3">
          {summary.consumptionPredictions.map(prediction => (
            <ConsumptionPredictionCard
              key={prediction.categoryName}
              prediction={prediction}
              formatValue={fmt}
            />
          ))}
        </section>
      )}

      <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
        <h2 className="text-[14px] font-bold text-[#2D3436] mb-1 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[#00BFA5]" />
          Pagos de {labels.current}
        </h2>
        <p className="text-[11px] text-[#636E72] mb-4">
          Gastos recurrentes del periodo. Se marcan como pagados al detectar un gasto
          similar.
        </p>
        {summary.currentPeriodPayments.length === 0 ? (
          <p className="text-[13px] text-[#636E72]">
            Al registrar un gasto en Nuevo, activa &quot;Recurrente&quot; y elige la frecuencia
            para verlo en este radar.
          </p>
        ) : (
          <ul className="space-y-3">
            {summary.currentPeriodPayments.map(payment => (
              <li
                key={payment.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F5]"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white"
                  style={{ color: '#636E72' }}
                >
                  <CategoryIcon icon={payment.categoryIcon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#2D3436]">{payment.name}</p>
                  <p className="text-[11px] text-[#636E72]">
                    {payment.categoryName && <span>{payment.categoryName} · </span>}
                    {fmt(payment.amount)}
                    {payment.occurrences && payment.occurrences > 1 && (
                      <> · {formatFrequency(payment.frequency, payment.occurrences)}</>
                    )}
                    {payment.status === 'paid' && payment.paidDate && (
                      <> · pagado {payment.paidDate}</>
                    )}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-1 rounded-lg shrink-0 ${
                    payment.status === 'paid'
                      ? 'bg-[#E8F5E9] text-[#2E7D32]'
                      : 'bg-[#FFF8E1] text-[#F59E0B]'
                  }`}
                >
                  {payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {summary.upcomingPayments.length > 0 && (
        <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
          <h2 className="text-[14px] font-bold text-[#2D3436] mb-3">
            Vista {labels.next}
          </h2>
          <ul className="space-y-2">
            {summary.upcomingPayments.slice(0, 5).map(payment => (
              <li
                key={`next-${payment.id}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F5] text-[12px]"
              >
                <span className="font-medium text-[#2D3436] truncate">{payment.name}</span>
                <span className="font-bold text-[#636E72] shrink-0 ml-2">
                  {fmt(payment.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingBag className="w-4 h-4 text-[#00BFA5]" />
          <h2 className="text-[14px] font-bold text-[#2D3436]">Mercado inteligente</h2>
        </div>
        <p className="text-[13px] text-[#636E72] mb-4">
          Gasto semanal, cuánto llevas en carne o aseo, frecuencia de compra y una lista
          sugerida según tu historial de Mercado.
        </p>
        <Link
          href="/mercado"
          className="inline-flex w-full items-center justify-center gap-2 py-3 rounded-xl bg-[#00BFA5] text-white font-bold text-[13px]"
        >
          <ShoppingBag className="w-4 h-4" />
          Ver análisis de mercado
        </Link>
      </section>
    </div>
  )
}
