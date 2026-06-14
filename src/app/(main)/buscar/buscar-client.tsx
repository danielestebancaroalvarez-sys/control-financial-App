'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { Download, Search, Pencil, Trash2, Loader2 } from 'lucide-react'
import { deleteTransaction } from '@/lib/finance/actions'
import { EditTransactionSheet } from '@/components/transactions/edit-transaction-sheet'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { formatMoney, getPeriodLabels, type SearchDatePreset } from '@/lib/finance/format'
import type { Category, Period, TransactionListItem } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

const DATE_PRESETS: { id: SearchDatePreset; label: string }[] = [
  { id: 'period', label: 'Periodo actual' },
  { id: 'this-week', label: 'Esta semana' },
  { id: 'last-week', label: 'Última semana' },
  { id: 'this-month', label: 'Este mes' },
  { id: 'last-month', label: 'Mes pasado' },
]

export function BuscarClient({
  results,
  categories,
  householdId,
  currency,
  filters,
  period,
}: {
  results: TransactionListItem[]
  categories: Category[]
  householdId: string
  currency: CurrencyCode
  filters: { q: string; type: string; preset: SearchDatePreset }
  period: Period
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState<TransactionListItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const labels = getPeriodLabels(period)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== 'all') params.set(key, value)
        else params.delete(key)
      }
      startTransition(() => {
        router.replace(`/buscar?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  function exportCsv() {
    const header = 'Fecha,Tipo,Descripción,Categoría,Monto,Autor\n'
    const rows = results
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#2D3436]">Búsqueda</h1>
          <p className="text-[13px] text-[#636E72]">
            {results.length} resultado{results.length !== 1 ? 's' : ''} · Vista {labels.view}
            {pending && ' · buscando...'}
          </p>
        </div>
        {results.length > 0 && (
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

      <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B2BEC3]" />
          <input
            type="search"
            defaultValue={filters.q}
            placeholder="Buscar por descripción..."
            onChange={e => updateParams({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none focus:ring-2 focus:ring-[#00BFA5]/30"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {DATE_PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => updateParams({ preset: p.id })}
              className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold transition-colors ${
                filters.preset === p.id
                  ? 'bg-[#00BFA5] text-white'
                  : 'bg-[#F5F5F5] text-[#636E72]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'expense', label: 'Gastos' },
            { id: 'income', label: 'Ingresos' },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => updateParams({ type: t.id })}
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
      </div>

      <div className="space-y-2">
        {results.length === 0 ? (
          <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 p-8 text-center">
            <p className="text-[14px] text-[#636E72]">No hay movimientos que coincidan.</p>
          </div>
        ) : (
          results.map(tx => (
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
