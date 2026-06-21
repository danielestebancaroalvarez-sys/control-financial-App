'use client'

import Link from 'next/link'
import { ArrowRight, ShoppingCart } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { MARKET_GROUP_LABELS, type MarketInsights } from '@/lib/finance/market-analytics'
import type { CurrencyCode } from '@/lib/household/types'
import { formatMoney } from '@/lib/finance/format'

export function MarketMetricsPreview({
  insights,
  currency,
}: {
  insights: MarketInsights
  currency: CurrencyCode
}) {
  const fmt = (n: number) => formatMoney(n, currency)
  const maxWeekly = Math.max(...insights.weeklySpends.map(w => w.amount), 1)

  const summary = insights.hasMercadoData
    ? `${fmt(insights.currentWeekSpend)} esta semana · ${insights.totalTrips} visitas`
    : 'Sin compras de mercado aún'

  return (
    <CollapsibleSection
      title="Mercado"
      summary={summary}
      icon={<ShoppingCart className="w-4 h-4 text-[#00BFA5]" />}
      defaultOpen={false}
      badge={
        <Link
          href="/mercado"
          className="text-[10px] font-bold text-[#00BFA5] px-2 py-1 rounded-lg cc-surface-muted"
          onClick={e => e.stopPropagation()}
        >
          Ver más
        </Link>
      }
    >
      <div className="pt-3 space-y-3">
        {!insights.hasMercadoData ? (
          <div className="text-center py-2">
            <p className="text-[12px] text-cc-secondary mb-3">
              Registra gastos en Mercado con productos para ver tendencias.
            </p>
            <Link
              href="/mercado"
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[#00BFA5]"
            >
              Ir a Mercado
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl cc-surface-muted p-2.5">
                <p className="text-cc-muted">Esta semana</p>
                <p className="text-[15px] font-bold text-cc-primary">
                  {fmt(insights.currentWeekSpend)}
                </p>
              </div>
              <div className="rounded-xl cc-surface-muted p-2.5">
                <p className="text-cc-muted">Promedio</p>
                <p className="text-[15px] font-bold text-cc-primary">
                  {fmt(insights.avgWeeklySpend)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-cc-secondary mb-2">
                Gasto semanal (últimas semanas)
              </p>
              <div className="flex items-end gap-1 h-14">
                {[...insights.weeklySpends].reverse().map(week => {
                  const h = Math.max(4, (week.amount / maxWeekly) * 48)
                  const isCurrent = week.label === 'Actual'
                  return (
                    <div key={week.start} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t-md ${
                          isCurrent ? 'bg-[#00BFA5]' : 'bg-[#00BFA5]/35'
                        }`}
                        style={{ height: `${h}px` }}
                        title={`${week.label}: ${fmt(week.amount)}`}
                      />
                      <span className="text-[8px] text-cc-muted truncate w-full text-center">
                        {isCurrent ? '•' : week.label.slice(0, 3)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {insights.groupStats.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-cc-secondary">
                  Top categorías
                </p>
                {insights.groupStats.slice(0, 3).map(group => {
                  const total = insights.groupStats.reduce((s, g) => s + g.totalSpent, 0) || 1
                  const pct = Math.round((group.totalSpent / total) * 100)
                  return (
                    <div key={group.group} className="flex items-center gap-2 text-[11px]">
                      <span className="text-cc-primary flex-1 truncate">
                        {MARKET_GROUP_LABELS[group.group]}
                      </span>
                      <span className="font-bold text-cc-primary shrink-0">
                        {fmt(group.totalSpent)}
                      </span>
                      <span className="text-cc-muted w-8 text-right shrink-0">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            )}

            <Link
              href="/mercado"
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[#00BFA5] pt-1"
            >
              Ver análisis completo de mercado
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}
      </div>
    </CollapsibleSection>
  )
}
