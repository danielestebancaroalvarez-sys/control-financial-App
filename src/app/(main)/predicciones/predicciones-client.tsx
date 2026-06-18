'use client'

import Link from 'next/link'
import { CalendarClock, HelpCircle, Repeat, ShoppingBag, TrendingUp } from 'lucide-react'
import { ConsumptionPredictionCard } from '@/components/predictions/consumption-prediction-card'
import { PaymentRadarRow } from '@/components/predictions/payment-radar-row'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { formatMoney, getPeriodLabels } from '@/lib/finance/format'
import type { PredictionsSummary } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'
import { useState } from 'react'

function PaymentsHelp() {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-5 h-5 rounded-full cc-surface-muted flex items-center justify-center text-cc-muted"
        aria-label="Ayuda sobre estados de pago"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Cerrar ayuda"
            onClick={() => setOpen(false)}
          />
          <span className="absolute left-0 top-6 z-50 w-56 p-3 rounded-xl cc-surface-solid border border-[var(--cc-border)] shadow-lg text-[10px] text-cc-secondary leading-relaxed">
            Débito automático: se marca pagado en la fecha. Recordatorio: pagado si
            hay gasto registrado; sin pagar si pasó la fecha sin registro.
          </span>
        </>
      )}
    </span>
  )
}

export function PrediccionesClient({
  summary,
  currency,
}: {
  summary: PredictionsSummary
  currency: CurrencyCode
}) {
  const fmt = (n: number) => formatMoney(n, currency)
  const labels = getPeriodLabels(summary.period)

  const pendingCount = summary.currentPeriodPayments.filter(
    p => p.status === 'pending' || p.status === 'overdue'
  ).length
  const paidCount = summary.currentPeriodPayments.filter(p => p.status === 'paid').length
  const paymentsSummary =
    summary.currentPeriodPayments.length === 0
      ? 'Sin pagos programados'
      : `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'} · ${paidCount} pagado${paidCount === 1 ? '' : 's'}`

  const topConsumption = summary.consumptionPredictions.reduce(
    (best, p) =>
      Math.abs(p.percentVsAverage) > Math.abs(best?.percentVsAverage ?? 0) ? p : best,
    summary.consumptionPredictions[0]
  )
  const consumptionHasAlert = topConsumption && Math.abs(topConsumption.percentVsAverage) > 5
  const consumptionSummary = topConsumption
    ? `${topConsumption.categoryName}: ${topConsumption.percentVsAverage > 0 ? '+' : ''}${topConsumption.percentVsAverage}% vs promedio`
    : undefined

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-[22px] font-bold text-cc-primary">Radar</h1>
        <p className="text-[13px] text-cc-secondary">
          {labels.current} · {summary.currentPeriodStart} → {summary.currentPeriodEnd}
        </p>
      </div>

      <Link
        href="/fijos"
        className="flex items-center justify-between gap-2 text-[12px] font-semibold text-[#00BFA5] px-1 py-1"
      >
        <span className="flex items-center gap-2">
          <Repeat className="w-4 h-4" />
          Gestionar ingresos y gastos fijos
        </span>
        <span>→</span>
      </Link>

      <CollapsibleSection
        title={`Pagos de ${labels.current}`}
        summary={paymentsSummary}
        icon={<CalendarClock className="w-4 h-4 text-[#00BFA5]" />}
        badge={<PaymentsHelp />}
        defaultOpen
      >
        {summary.currentPeriodPayments.length === 0 ? (
          <p className="text-[13px] text-cc-secondary pt-2">
            Configura gastos fijos en Nuevo o en la sección de fijos.
          </p>
        ) : (
          <ul className="space-y-2 pt-2">
            {summary.currentPeriodPayments.map(payment => (
              <PaymentRadarRow
                key={payment.id}
                payment={payment}
                formatValue={fmt}
                variant="current"
              />
            ))}
          </ul>
        )}

        {summary.upcomingPayments.length > 0 && (
          <>
            <p className="text-[11px] font-bold text-cc-primary mt-4 mb-2">
              {labels.next}
            </p>
            <ul className="space-y-2">
              {summary.upcomingPayments.slice(0, 5).map(payment => (
                <PaymentRadarRow
                  key={`next-${payment.id}`}
                  payment={payment}
                  formatValue={fmt}
                  variant="upcoming"
                />
              ))}
            </ul>
          </>
        )}
      </CollapsibleSection>

      {summary.consumptionPredictions.length > 0 && (
        <CollapsibleSection
          title="Consumo al ritmo actual"
          summary={consumptionSummary}
          icon={<TrendingUp className="w-4 h-4 text-[#EC4899]" />}
          defaultOpen={consumptionHasAlert}
        >
          <div className="space-y-2 pt-2">
            {summary.consumptionPredictions.map(prediction => (
              <ConsumptionPredictionCard
                key={prediction.categoryName}
                prediction={prediction}
                formatValue={fmt}
                compact
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title="Mercado"
        summary="Análisis de compras y lista sugerida"
        icon={<ShoppingBag className="w-4 h-4 text-[#00BFA5]" />}
        defaultOpen={false}
      >
        <Link
          href="/mercado"
          className="inline-flex w-full items-center justify-center gap-2 py-3 mt-2 rounded-xl bg-[#00BFA5] text-white font-bold text-[13px]"
        >
          <ShoppingBag className="w-4 h-4" />
          Ver análisis de mercado
        </Link>
      </CollapsibleSection>
    </div>
  )
}
