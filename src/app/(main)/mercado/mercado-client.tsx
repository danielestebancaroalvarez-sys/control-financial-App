'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ShoppingCart,
  Beef,
  Sparkles,
  ListChecks,
  TrendingUp,
  Package,
  Download,
  Share2,
  Milk,
  Apple,
  Croissant,
  Coffee,
} from 'lucide-react'
import { formatMoney, formatShortDate } from '@/lib/finance/format'
import { ConsumptionPredictionCard } from '@/components/predictions/consumption-prediction-card'
import {
  MARKET_GROUP_LABELS,
  type MarketInsights,
  type MarketProductGroup,
} from '@/lib/finance/market-analytics'
import type { CurrencyCode } from '@/lib/household/types'

const GROUP_META: Record<
  MarketProductGroup,
  { icon: typeof Beef; color: string; bg: string }
> = {
  carne: { icon: Beef, color: '#E53935', bg: '#FFEBEE' },
  aseo: { icon: Sparkles, color: '#7E57C2', bg: '#EDE7F6' },
  'frutas-verduras': { icon: Apple, color: '#43A047', bg: '#E8F5E9' },
  lacteos: { icon: Milk, color: '#1E88E5', bg: '#E3F2FD' },
  panaderia: { icon: Croissant, color: '#FB8C00', bg: '#FFF3E0' },
  bebidas: { icon: Coffee, color: '#6D4C41', bg: '#EFEBE9' },
  otros: { icon: Package, color: '#636E72', bg: '#F5F5F5' },
}

function formatDaysLabel(days: number | null): string {
  if (days === null) return '—'
  if (days === 0) return 'hoy'
  if (days === 1) return '1 día'
  return `${days} días`
}

export function MercadoClient({
  insights,
  currency,
}: {
  insights: MarketInsights
  currency: CurrencyCode
}) {
  const fmt = (n: number) => formatMoney(n, currency)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const maxWeekly = Math.max(...insights.weeklySpends.map(w => w.amount), 1)
  const totalGroupSpend = insights.groupStats.reduce((s, g) => s + g.totalSpent, 0) || 1
  const listTotal = insights.shoppingList.reduce((s, i) => s + i.estimatedPrice, 0)

  function toggleItem(name: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function exportShoppingList() {
    if (insights.shoppingList.length === 0) return
    const header = 'Producto,Grupo,Precio estimado,Urgencia,Última compra\n'
    const rows = insights.shoppingList
      .map(item =>
        [
          `"${item.name.replace(/"/g, '""')}"`,
          MARKET_GROUP_LABELS[item.group],
          item.estimatedPrice,
          item.urgency,
          item.lastPurchased ?? '',
        ].join(',')
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lista-compra-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function shareShoppingList() {
    const unchecked = insights.shoppingList.filter(item => !checked.has(item.name))
    if (unchecked.length === 0) return
    const text = [
      '🛒 Lista de compra CoupleCash',
      ...unchecked.map(
        (item, i) => `${i + 1}. ${item.name} (~${fmt(item.estimatedPrice)})`
      ),
      `\nTotal estimado: ~${fmt(unchecked.reduce((s, i) => s + i.estimatedPrice, 0))}`,
    ].join('\n')

    if (navigator.share) {
      navigator.share({ title: 'Lista de compra', text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Lista copiada al portapapeles'))
    }
  }

  const weekTrend =
    insights.avgWeeklySpend > 0
      ? Math.round(
          ((insights.currentWeekSpend - insights.avgWeeklySpend) /
            insights.avgWeeklySpend) *
            100
        )
      : 0

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Link
          href="/predicciones"
          className="w-9 h-9 rounded-xl bg-white/90 border border-white/60 flex items-center justify-center shrink-0 text-[#636E72] hover:text-[#2D3436]"
          aria-label="Volver a predicciones"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-[22px] font-bold text-[#2D3436]">Mercado inteligente</h1>
          <p className="text-[13px] text-[#636E72]">Tu historial de compras, visualizado</p>
        </div>
      </div>

      {!insights.hasMercadoData ? (
        <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-6 text-center">
          <ShoppingCart className="w-10 h-10 text-[#B2BEC3] mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-[#2D3436] mb-2">
            Aún no hay compras de Mercado
          </p>
          <p className="text-[13px] text-[#636E72] mb-4">
            Registra gastos en Mercado con productos individuales para ver estadísticas.
          </p>
          <Link
            href="/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00BFA5] text-white text-[13px] font-bold"
          >
            Registrar compra
          </Link>
        </section>
      ) : (
        <>
          {insights.monthProjection && (
            <ConsumptionPredictionCard
              prediction={insights.monthProjection}
              formatValue={fmt}
              compact
            />
          )}

          <section className="rounded-[24px] bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] shadow-lg p-5 text-white">
            <div className="flex items-center gap-2 mb-4 opacity-90">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[12px] font-semibold">Gasto semanal</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[28px] font-bold tracking-tight">
                  {fmt(insights.currentWeekSpend)}
                </p>
                <p className="text-[11px] opacity-80">Esta semana</p>
              </div>
              <div className="text-right">
                <p className="text-[18px] font-bold">{fmt(insights.avgWeeklySpend)}</p>
                <p className="text-[11px] opacity-80">Promedio</p>
                {weekTrend !== 0 && (
                  <p
                    className={`text-[10px] font-bold mt-1 ${
                      weekTrend > 0 ? 'text-[#FFEB3B]' : 'text-white/90'
                    }`}
                  >
                    {weekTrend > 0 ? '+' : ''}
                    {weekTrend}% vs promedio
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-end gap-1 h-16">
              {[...insights.weeklySpends].reverse().map(week => {
                const h = Math.max(6, (week.amount / maxWeekly) * 56)
                const isCurrent = week.label === 'Actual'
                return (
                  <div key={week.start} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-md ${isCurrent ? 'bg-white' : 'bg-white/40'}`}
                      style={{ height: `${h}px` }}
                    />
                    <span className="text-[8px] opacity-70">
                      {isCurrent ? '•' : week.label.slice(0, 1)}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] opacity-80">
              <span>{insights.totalTrips} visitas</span>
              {insights.avgDaysBetweenTrips !== null && (
                <span>cada ~{insights.avgDaysBetweenTrips}d</span>
              )}
            </div>
          </section>

          {insights.groupStats.length > 0 && (
            <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
              <h2 className="text-[13px] font-bold text-[#2D3436] mb-3">
                ¿En qué gastas?
              </h2>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {insights.groupStats.slice(0, 4).map(group => {
                  const meta = GROUP_META[group.group]
                  const Icon = meta.icon
                  const pct = Math.round((group.totalSpent / totalGroupSpend) * 100)
                  return (
                    <div
                      key={group.group}
                      className="p-3 rounded-2xl flex items-center gap-2.5"
                      style={{ backgroundColor: meta.bg }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/80"
                        style={{ color: meta.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-[#2D3436] truncate">
                          {group.label}
                        </p>
                        <p className="text-[13px] font-bold" style={{ color: meta.color }}>
                          {pct}%
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="space-y-2">
                {insights.groupStats.map(group => {
                  const meta = GROUP_META[group.group]
                  const pct = (group.totalSpent / totalGroupSpend) * 100
                  return (
                    <div key={group.group} className="flex items-center gap-2">
                      <span className="text-[10px] text-[#636E72] w-20 truncate shrink-0">
                        {group.label.split(' ')[0]}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[#F5F5F5] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: meta.color }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#2D3436] w-16 text-right shrink-0">
                        {fmt(group.totalSpent)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#00BFA5]" />
                <h2 className="text-[13px] font-bold text-[#2D3436]">Lista sugerida</h2>
              </div>
              <div className="flex items-center gap-1">
                {insights.shoppingList.length > 0 && (
                  <>
                    <span className="text-[12px] font-bold text-[#00BFA5] mr-1">
                      {fmt(listTotal)}
                    </span>
                    <button
                      type="button"
                      onClick={shareShoppingList}
                      className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#636E72]"
                      aria-label="Compartir"
                    >
                      <Share2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={exportShoppingList}
                      className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#636E72]"
                      aria-label="Exportar"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {insights.shoppingList.length === 0 ? (
              <p className="text-[12px] text-[#636E72]">
                Agrega productos en tus compras para generar la lista.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {insights.shoppingList.map(item => {
                  const isChecked = checked.has(item.name)
                  const meta = GROUP_META[item.group]
                  const urgencyDot =
                    item.urgency === 'overdue'
                      ? 'bg-[#E53935]'
                      : item.urgency === 'soon'
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#00BFA5]'

                  return (
                    <li key={item.name}>
                      <button
                        type="button"
                        onClick={() => toggleItem(item.name)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-opacity ${
                          isChecked ? 'opacity-40' : 'hover:bg-[#F5F5F5]'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 text-[9px] ${
                            isChecked
                              ? 'bg-[#00BFA5] border-[#00BFA5] text-white'
                              : 'border-[#B2BEC3] bg-white'
                          }`}
                        >
                          {isChecked && '✓'}
                        </span>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${urgencyDot}`} />
                        <span
                          className={`flex-1 text-[13px] font-medium truncate ${
                            isChecked ? 'line-through text-[#B2BEC3]' : 'text-[#2D3436]'
                          }`}
                        >
                          {item.name}
                        </span>
                        <span className="text-[12px] font-bold text-[#636E72] shrink-0">
                          {fmt(item.estimatedPrice)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {insights.topProducts.length > 0 && (
            <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
              <h2 className="text-[13px] font-bold text-[#2D3436] mb-3">Top productos</h2>
              <ul className="space-y-2">
                {insights.topProducts.slice(0, 6).map((product, i) => {
                  const meta = GROUP_META[product.group]
                  return (
                    <li key={product.name} className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{
                          backgroundColor: i < 3 ? meta.color : '#B2BEC3',
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#2D3436] truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1 rounded-full bg-[#F5F5F5] overflow-hidden max-w-[80px]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, (product.totalSpent / insights.topProducts[0].totalSpent) * 100)}%`,
                                backgroundColor: meta.color,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-[#B2BEC3]">
                            {product.purchaseCount}x
                            {product.daysSinceLastPurchase !== null &&
                              ` · hace ${formatDaysLabel(product.daysSinceLastPurchase)}`}
                          </span>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-[#2D3436] shrink-0">
                        {fmt(product.totalSpent)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
