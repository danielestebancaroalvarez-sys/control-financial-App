import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
import { getPredictionsSummary } from '@/lib/finance/queries'
import { formatMoney, formatFrequency, getPeriodLabels } from '@/lib/finance/format'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { CalendarClock, ShoppingBag } from 'lucide-react'

export default async function PrediccionesPage() {
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  const summary = await getPredictionsSummary(ctx.household.id, ctx.period)
  const fmt = (n: number) => formatMoney(n, ctx.household.base_currency)
  const labels = getPeriodLabels(ctx.period)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-[#2D3436]">Radar y Predicciones</h1>
        <p className="text-[13px] text-[#636E72]">
          {labels.next} · {summary.nextPeriodStart} → {summary.nextPeriodEnd}
        </p>
      </div>

      <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
        <h2 className="text-[14px] font-bold text-[#2D3436] mb-1 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[#00BFA5]" />
          Pagos de {labels.inNext}
        </h2>
        <p className="text-[11px] text-[#636E72] mb-4">
          Todo gasto marcado como recurrente aparece aquí, sin importar la categoría.
        </p>
        {summary.upcomingPayments.length === 0 ? (
          <p className="text-[13px] text-[#636E72]">
            Al registrar un gasto en Nuevo, activa &quot;Recurrente&quot; y elige la frecuencia
            (semanal, quincenal o mensual) para verlo en este radar.
          </p>
        ) : (
          <ul className="space-y-3">
            {summary.upcomingPayments.map(payment => (
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
                    {payment.categoryName && (
                      <span>{payment.categoryName} · </span>
                    )}
                    {fmt(payment.amount)} ·{' '}
                    {formatFrequency(payment.frequency, payment.occurrences)}
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-[#E0F2F1] text-[#00BFA5] shrink-0">
                  Próximo
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

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
