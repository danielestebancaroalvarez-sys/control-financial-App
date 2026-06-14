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
  CalendarDays,
  Package,
  Download,
  Share2,
} from 'lucide-react'
import { formatMoney, formatShortDate } from '@/lib/finance/format'
import { ConsumptionPredictionCard } from '@/components/predictions/consumption-prediction-card'
import {
  MARKET_GROUP_LABELS,
  type MarketInsights,
  type MarketProductGroup,
} from '@/lib/finance/market-analytics'
import type { CurrencyCode } from '@/lib/household/types'

const GROUP_ICONS: Partial<Record<MarketProductGroup, typeof Beef>> = {
  carne: Beef,
  aseo: Sparkles,
}

function formatDaysLabel(days: number | null): string {
  if (days === null) return '—'
  if (days === 0) return 'hoy'
  if (days === 1) return '1 día'
  return `${days} días`
}

function formatFrequency(days: number | null): string {
  if (days === null) return 'Sin patrón claro'
  if (days <= 7) return `cada ~${days} días`
  const weeks = Math.round(days / 7)
  if (weeks === 1) return 'cada ~1 semana'
  return `cada ~${weeks} semanas`
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
        (item, i) =>
          `${i + 1}. ${item.name} (~${fmt(item.estimatedPrice)})`
      ),
      `\nTotal estimado: ~${fmt(unchecked.reduce((s, i) => s + i.estimatedPrice, 0))}`,
    ].join('\n')

    if (navigator.share) {
      navigator.share({ title: 'Lista de compra', text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Lista copiada al portapapeles'))
    }
  }

  const aseoGroup = insights.groupStats.find(g => g.group === 'aseo')
  const carneGroup = insights.groupStats.find(g => g.group === 'carne')

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
          <p className="text-[13px] text-[#636E72]">
            Gastos, hábitos y lista de compra según tu historial
          </p>
        </div>
      </div>

      {!insights.hasMercadoData ? (
        <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-6 text-center">
          <ShoppingCart className="w-10 h-10 text-[#B2BEC3] mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-[#2D3436] mb-2">
            Aún no hay compras de Mercado
          </p>
          <p className="text-[13px] text-[#636E72] mb-4">
            Registra gastos en la categoría Mercado y, si puedes, agrega los productos
            individuales para ver estadísticas y una lista sugerida.
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

          <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00BFA5]" />
              <h2 className="text-[14px] font-bold text-[#2D3436]">Gasto semanal en mercado</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-[#F5F5F5]">
                <p className="text-[11px] text-[#636E72]">Esta semana</p>
                <p className="text-[18px] font-bold text-[#2D3436]">
                  {fmt(insights.currentWeekSpend)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#F5F5F5]">
                <p className="text-[11px] text-[#636E72]">Promedio semanal</p>
                <p className="text-[18px] font-bold text-[#2D3436]">
                  {fmt(insights.avgWeeklySpend)}
                </p>
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {[...insights.weeklySpends].reverse().map(week => (
                <div key={week.start} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-[#00BFA5]/80 min-h-[4px]"
                    style={{
                      height: `${Math.max(8, (week.amount / maxWeekly) * 72)}px`,
                    }}
                    title={`${week.label}: ${fmt(week.amount)}`}
                  />
                  <span className="text-[9px] text-[#B2BEC3] truncate w-full text-center">
                    {week.label === 'Actual' ? 'Hoy' : week.label.slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#636E72]">
              {insights.totalTrips} visitas al mercado ·{' '}
              {formatFrequency(insights.avgDaysBetweenTrips)}
            </p>
          </section>

          {(carneGroup || aseoGroup) && (
            <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5 space-y-3">
              <h2 className="text-[14px] font-bold text-[#2D3436]">Lo que más compras</h2>
              <div className="space-y-2">
                {[carneGroup, aseoGroup].filter(Boolean).map(group => {
                  const Icon = GROUP_ICONS[group!.group] ?? Package
                  return (
                    <div
                      key={group!.group}
                      className="p-3 rounded-2xl bg-[#F5F5F5] flex items-start gap-3"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 text-[#00BFA5]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[#2D3436]">
                          {group!.label}
                        </p>
                        <p className="text-[11px] text-[#636E72]">
                          {fmt(group!.totalSpent)} total · ~{fmt(group!.avgWeeklySpend)}/sem
                        </p>
                        <p className="text-[11px] text-[#636E72]">
                          {group!.purchaseTrips} compras ·{' '}
                          {formatFrequency(group!.avgDaysBetweenTrips)}
                        </p>
                        {group!.topProducts.length > 0 && (
                          <p className="text-[11px] text-[#B2BEC3] mt-1 truncate">
                            {group!.topProducts.join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#00BFA5]" />
                <h2 className="text-[14px] font-bold text-[#2D3436]">Lista de compra sugerida</h2>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-[#00BFA5] mr-1">
                  ~{fmt(insights.shoppingList.reduce((s, i) => s + i.estimatedPrice, 0))}
                </span>
                {insights.shoppingList.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={shareShoppingList}
                      className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#636E72] hover:text-[#00BFA5]"
                      aria-label="Compartir lista"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={exportShoppingList}
                      className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#636E72] hover:text-[#00BFA5]"
                      aria-label="Exportar lista"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="text-[11px] text-[#636E72]">
              Basada en productos que sueles comprar y cuándo los compraste por última vez.
            </p>
            {insights.shoppingList.length === 0 ? (
              <p className="text-[13px] text-[#636E72]">
                Agrega ítems detallados en tus compras de Mercado para generar la lista.
              </p>
            ) : (
              <ul className="space-y-2">
                {insights.shoppingList.map(item => {
                  const isChecked = checked.has(item.name)
                  const urgencyClass =
                    item.urgency === 'overdue'
                      ? 'bg-[#FFEBEE] text-[#E53935]'
                      : item.urgency === 'soon'
                        ? 'bg-[#FFF8E1] text-[#F59E0B]'
                        : 'bg-[#E0F2F1] text-[#00BFA5]'

                  return (
                    <li key={item.name}>
                      <button
                        type="button"
                        onClick={() => toggleItem(item.name)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-opacity ${
                          isChecked ? 'opacity-50' : 'bg-[#F5F5F5]'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'bg-[#00BFA5] border-[#00BFA5] text-white'
                              : 'border-[#B2BEC3] bg-white'
                          }`}
                        >
                          {isChecked && '✓'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-[14px] font-semibold truncate ${
                              isChecked
                                ? 'line-through text-[#B2BEC3]'
                                : 'text-[#2D3436]'
                            }`}
                          >
                            {item.name}
                          </p>
                          <p className="text-[11px] text-[#636E72]">
                            {MARKET_GROUP_LABELS[item.group]} · {fmt(item.estimatedPrice)}
                            {item.lastPurchased &&
                              ` · última ${formatShortDate(item.lastPurchased)}`}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${urgencyClass}`}
                        >
                          {item.urgency === 'overdue'
                            ? 'Toca'
                            : item.urgency === 'soon'
                              ? 'Pronto'
                              : 'Habitual'}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {insights.groupStats.length > 0 && (
            <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#00BFA5]" />
                <h2 className="text-[14px] font-bold text-[#2D3436]">
                  Gasto por tipo de producto
                </h2>
              </div>
              <ul className="space-y-2">
                {insights.groupStats.map(group => (
                  <li
                    key={group.group}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F5]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#2D3436]">
                        {group.label}
                      </p>
                      <p className="text-[11px] text-[#636E72]">
                        ~{fmt(group.avgWeeklySpend)}/sem ·{' '}
                        {formatFrequency(group.avgDaysBetweenTrips)}
                      </p>
                    </div>
                    <span className="text-[14px] font-bold text-[#2D3436] shrink-0">
                      {fmt(group.totalSpent)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {insights.topProducts.length > 0 && (
            <section className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5 space-y-3">
              <h2 className="text-[14px] font-bold text-[#2D3436]">
                Productos que más compras
              </h2>
              <ul className="space-y-2">
                {insights.topProducts.map(product => (
                  <li
                    key={product.name}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F5]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#2D3436] truncate">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-[#636E72]">
                        {product.purchaseCount} compras · {fmt(product.avgUnitPrice)} c/u ·{' '}
                        {formatFrequency(product.avgDaysBetween)}
                        {product.daysSinceLastPurchase !== null &&
                          ` · hace ${formatDaysLabel(product.daysSinceLastPurchase)}`}
                      </p>
                    </div>
                    <span className="text-[14px] font-bold text-[#2D3436] shrink-0">
                      {fmt(product.totalSpent)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
