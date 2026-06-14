'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  Download,
  Search,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react'
import { deleteTransaction } from '@/lib/finance/actions'
import { EditTransactionSheet } from '@/components/transactions/edit-transaction-sheet'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { formatMoney, getPeriodLabels } from '@/lib/finance/format'
import {
  getSearchCacheKey,
  readSearchCache,
  writeSearchCache,
} from '@/lib/finance/search-cache'
import type { Category, Period, TransactionListItem } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

type DateFilterPreset = 'period' | 'last-week' | 'custom'

function FilterSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-[#636E72] uppercase tracking-wide">
        {label}
      </p>
      {children}
    </div>
  )
}

export function BuscarClient({
  results,
  categories,
  householdId,
  currency,
  filters,
  period,
  rangeStart,
  rangeEnd,
}: {
  results: TransactionListItem[]
  categories: Category[]
  householdId: string
  currency: CurrencyCode
  filters: {
    q: string
    type: string
    preset: DateFilterPreset
    startDate: string
    endDate: string
  }
  period: Period
  rangeStart: string
  rangeEnd: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cacheKey = getSearchCacheKey(searchParams.toString())
  const [pending, startTransition] = useTransition()
  const [displayResults, setDisplayResults] = useState<TransactionListItem[]>(() => {
    if (typeof window === 'undefined') return results
    return readSearchCache(cacheKey) ?? results
  })
  const latestResults = useRef(results)
  const [editing, setEditing] = useState<TransactionListItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(
    filters.preset === 'custom' || !!(filters.startDate && filters.endDate)
  )
  const [customStart, setCustomStart] = useState(filters.startDate || rangeStart)
  const [customEnd, setCustomEnd] = useState(filters.endDate || rangeEnd)
  const labels = getPeriodLabels(period)

  useEffect(() => {
    latestResults.current = results
    setDisplayResults(results)
    writeSearchCache(cacheKey, results)
  }, [results, cacheKey])

  useEffect(() => {
    const cached = readSearchCache(cacheKey)
    if (cached?.length) setDisplayResults(cached)
  }, [cacheKey])

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      startTransition(() => {
        router.replace(`/buscar?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  const updateFilter = useCallback(
    (updates: Record<string, string | null>) => {
      replaceParams(params => {
        for (const [key, value] of Object.entries(updates)) {
          if (value) params.set(key, value)
          else params.delete(key)
        }
      })
    },
    [replaceParams]
  )

  function selectPeriodPreset(preset: 'period' | 'last-week') {
    updateFilter({
      preset,
      startDate: null,
      endDate: null,
    })
    setAdvancedOpen(false)
  }

  function applyCustomRange() {
    if (!customStart || !customEnd) return
    if (customStart > customEnd) {
      alert('La fecha inicial no puede ser posterior a la final.')
      return
    }
    replaceParams(params => {
      params.delete('preset')
      params.set('startDate', customStart)
      params.set('endDate', customEnd)
    })
  }

  function exportCsv() {
    const header = 'Fecha,Tipo,Descripción,Categoría,Monto,Autor\n'
    const rows = displayResults
      .map(tx =>
        [
          tx.transaction_date,
          tx.type === 'income' ? 'Ingreso' : 'Gasto',
          `"${tx.description.replace(/"/g, '""')}"`,
          tx.category_name ?? '',
          tx.amount_base,
          tx.author_name ?? '',
        ].join(',')
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `couplecash-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete(tx: TransactionListItem) {
    if (!confirm(`¿Eliminar "${tx.description}"?`)) return
    setDeletingId(tx.id)
    const result = await deleteTransaction(tx.id, householdId)
    setDeletingId(null)
    if (result.error) {
      alert(result.error)
      return
    }
    router.refresh()
  }

  const fmt = (n: number) => formatMoney(n, currency)
  const periodLabel =
    filters.preset === 'custom'
      ? `${rangeStart} → ${rangeEnd}`
      : filters.preset === 'last-week'
        ? 'Semana pasada'
        : labels.current

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#2D3436]">Búsqueda</h1>
          <p className="text-[13px] text-[#636E72]">
            {displayResults.length} resultado{displayResults.length !== 1 ? 's' : ''} · {periodLabel}
            {pending && ' · actualizando...'}
          </p>
        </div>
        {displayResults.length > 0 && (
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00BFA5] text-white text-[11px] font-bold shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        )}
      </div>

      <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-4 space-y-4 relative">
        {pending && (
          <div className="absolute top-0 left-4 right-4 h-0.5 overflow-hidden rounded-full">
            <div className="h-full w-1/3 bg-[#00BFA5] animate-pulse" />
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B2BEC3]" />
          <input
            type="search"
            defaultValue={filters.q}
            placeholder="Buscar por descripción..."
            onChange={e => updateFilter({ q: e.target.value || null })}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none focus:ring-2 focus:ring-[#00BFA5]/30"
          />
        </div>

        <FilterSection label="Tipo">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'expense', label: 'Gastos' },
              { id: 'income', label: 'Ingresos' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => updateFilter({ type: t.id === 'all' ? null : t.id })}
                className={`flex-1 py-2 rounded-xl text-[12px] font-bold ${
                  (filters.type || 'all') === t.id
                    ? 'bg-[#2D3436] text-white'
                    : 'bg-[#F5F5F5] text-[#636E72]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection label="Periodo">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => selectPeriodPreset('period')}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${
                filters.preset === 'period'
                  ? 'bg-[#00BFA5] text-white'
                  : 'bg-[#F5F5F5] text-[#636E72]'
              }`}
            >
              Periodo actual
              <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                {labels.current}
              </span>
            </button>
            <button
              type="button"
              onClick={() => selectPeriodPreset('last-week')}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${
                filters.preset === 'last-week'
                  ? 'bg-[#00BFA5] text-white'
                  : 'bg-[#F5F5F5] text-[#636E72]'
              }`}
            >
              Semana pasada
              <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                Lun – dom anterior
              </span>
            </button>
          </div>
        </FilterSection>

        <div className="rounded-xl border border-[#EEEEEE] overflow-hidden">
          <button
            type="button"
            onClick={() => setAdvancedOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAFAFA] text-left"
          >
            <span className="flex items-center gap-2 text-[12px] font-bold text-[#636E72]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Avanzado
              {filters.preset === 'custom' && (
                <span className="text-[10px] font-semibold text-[#00BFA5]">
                  · rango activo
                </span>
              )}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#B2BEC3] transition-transform ${
                advancedOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {advancedOpen && (
            <div className="p-3 space-y-3 border-t border-[#EEEEEE] bg-white">
              <p className="text-[11px] text-[#636E72]">Rango de fechas personalizado</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-[#636E72] mb-1 block">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F5F5F5] text-[12px] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#636E72] mb-1 block">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F5F5F5] text-[12px] outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={applyCustomRange}
                className="w-full py-2.5 rounded-xl bg-[#2D3436] text-white text-[12px] font-bold"
              >
                Aplicar rango
              </button>
            </div>
          )}
        </div>
      </div>

      {pending && displayResults.length > 0 && (
        <div className="h-1 rounded-full bg-[#F5F5F5] overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-[#00BFA5] animate-pulse" />
        </div>
      )}

      <div className={`space-y-2 transition-opacity ${pending ? 'opacity-70' : 'opacity-100'}`}>
        {displayResults.length === 0 && !pending ? (
          <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 p-8 text-center">
            <p className="text-[14px] text-[#636E72]">No hay movimientos que coincidan.</p>
          </div>
        ) : displayResults.length === 0 && pending ? (
          <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 p-8 text-center">
            <Loader2 className="w-6 h-6 text-[#00BFA5] animate-spin mx-auto mb-2" />
            <p className="text-[14px] text-[#636E72]">Buscando movimientos...</p>
          </div>
        ) : (
          displayResults.map(tx => (
            <div
              key={tx.id}
              className="rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-4 flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${tx.category_color ?? '#636E72'}20`,
                  color: tx.category_color ?? '#636E72',
                }}
              >
                <CategoryIcon icon={tx.category_icon} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#2D3436] truncate">
                  {tx.description}
                </p>
                <p className="text-[11px] text-[#636E72]">
                  {tx.category_name} · {tx.transaction_date}
                  {tx.author_name ? ` · ${tx.author_name}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={`text-[14px] font-bold ${
                    tx.type === 'income' ? 'text-[#00BFA5]' : 'text-[#EC4899]'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {fmt(tx.amount_base)}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(tx)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#B2BEC3] hover:text-[#00BFA5] hover:bg-[#E0F2F1]"
                  aria-label={`Editar ${tx.description}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(tx)}
                  disabled={deletingId === tx.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#B2BEC3] hover:text-red-500 hover:bg-red-50 disabled:opacity-50"
                  aria-label={`Eliminar ${tx.description}`}
                >
                  {deletingId === tx.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editing && (
        <EditTransactionSheet
          transaction={editing}
          categories={categories}
          householdId={householdId}
          currency={currency}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
