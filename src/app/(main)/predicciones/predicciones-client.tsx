'use client'

import Link from 'next/link'
import { CalendarClock, Repeat, ShoppingBag } from 'lucide-react'
import { ConsumptionPredictionCard } from '@/components/predictions/consumption-prediction-card'
import { WeeklyInsightsCard } from '@/components/predictions/weekly-insights-card'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { formatMoney, formatFrequency, formatShortDate, getPeriodLabels } from '@/lib/finance/format'
import type { PredictionsSummary, Period } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

export function PrediccionesClient({
  summary,
  currency,
  householdId,
  period,
}: {
  summary: PredictionsSummary
  currency: CurrencyCode
  householdId: string
  period: Period
}) {
  const fmt = (n: number) => formatMoney(n, currency)
  const labels = getPeriodLabels(summary.period)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-cc-primary">Radar y Predicciones</h1>
        <p className="text-[13px] text-cc-secondary">
          {labels.current} · {summary.currentPeriodStart} → {summary.currentPeriodEnd}
        </p>
      </div>

      <WeeklyInsightsCard householdId={householdId} period={period} />

      <Link
        href="/fijos"
        className="flex items-center justify-between gap-3 cc-surface rounded-[24px] px-5 py-4 active:opacity-80"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] flex items-center justify-center shrink-0">
            <Repeat className="w-5 h-5 text-[#00BFA5]" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-cc-primary">
              Ingresos y gastos fijos
            </p>
            <p className="text-[11px] text-cc-secondary truncate">
              Ver y gestionar lo programado {labels.ofPeriod}
            </p>
          </div>
        </div>
        <span className="text-[12px] font-semibold text-[#00BFA5] shrink-0">
          Ver →
        </span>
      </Link>

      {summary.consumptionPredictions.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-[14px] font-bold text-cc-primary">Predicción de consumo</h2>
            <p className="text-[11px] text-cc-secondary mt-0.5">
              Mercado, restaurantes y transporte al ritmo actual del periodo
            </p>
          </div>
          {summary.consumptionPredictions.map(prediction => (
            <ConsumptionPredictionCard
              key={prediction.categoryName}
              prediction={prediction}
              formatValue={fmt}
            />
          ))}
        </section>
      )}

      <section className="cc-surface rounded-[24px] p-5">
        <h2 className="text-[14px] font-bold text-cc-primary mb-1 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[#00BFA5]" />
          Pagos de {labels.current}
        </h2>
        <p className="text-[11px] text-cc-secondary mb-4">
          Gastos recurrentes del periodo. Se marcan como pagados al detectar un gasto
          similar.
        </p>
        {summary.currentPeriodPayments.length === 0 ? (
          <p className="text-[13px] text-cc-secondary">
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
                  <p className="text-[14px] font-semibold text-cc-primary">{payment.name}</p>
                  <p className="text-[11px] text-cc-secondary">
                    {payment.categoryName && <span>{payment.categoryName} · </span>}
                    {fmt(payment.amount)}
                    {payment.occurrences && payment.occurrences > 1 && (
                      <> · {formatFrequency(payment.frequency, payment.occurrences)}</>
                    )}
                    {payment.dueDate && payment.status !== 'paid' && (
                      <> · vence {formatShortDate(payment.dueDate)}</>
                    )}
                    {payment.status === 'paid' && payment.paidDate && (
                      <> · pagado {formatShortDate(payment.paidDate)}</>
                    )}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-1 rounded-lg shrink-0 ${
                    payment.status === 'paid'
                      ? 'bg-[#E8F5E9] text-[#2E7D32]'
                      : payment.status === 'overdue'
                        ? 'bg-[#FFEBEE] text-[#C62828]'
                        : 'bg-[#FFF8E1] text-[#F59E0B]'
                  }`}
                >
                  {payment.status === 'paid'
                    ? 'Pagado'
                    : payment.status === 'overdue'
                      ? 'Vencido'
                      : 'Pendiente'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {summary.upcomingPayments.length > 0 && (
        <section className="cc-surface rounded-[24px] p-5">
          <h2 className="text-[14px] font-bold text-cc-primary mb-3 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#00BFA5]" />
            Vista {labels.next}
          </h2>
          <ul className="space-y-2">
            {summary.upcomingPayments.slice(0, 5).map(payment => (
              <li
                key={`next-${payment.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F5]"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white"
                  style={{ color: '#636E72' }}
                >
                  <CategoryIcon icon={payment.categoryIcon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-cc-primary truncate">
                    {payment.name}
                  </p>
                  <p className="text-[11px] text-cc-secondary">
                    {payment.categoryName && <span>{payment.categoryName} · </span>}
                    {fmt(payment.amount)}
                    {payment.dueDate && (
                      <> · {formatShortDate(payment.dueDate)}</>
                    )}
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-[#E0F2F1] text-[#00BFA5] shrink-0">
                  Próximo
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="cc-surface rounded-[24px] p-5">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingBag className="w-4 h-4 text-[#00BFA5]" />
          <h2 className="text-[14px] font-bold text-cc-primary">Mercado inteligente</h2>
        </div>
        <p className="text-[13px] text-cc-secondary mb-4">
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
