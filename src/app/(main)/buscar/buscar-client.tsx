'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Download, Search } from 'lucide-react'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { formatMoney } from '@/lib/finance/format'
import type { Category, TransactionListItem } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'
import type { HouseholdMember } from '@/lib/household/types'

export function BuscarClient({
  results,
  categories,
  members,
  currency,
  filters,
}: {
  results: TransactionListItem[]
  categories: Category[]
  members: HouseholdMember[]
  currency: CurrencyCode
  filters: Record<string, string>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
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

  const fmt = (n: number) => formatMoney(n, currency)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#2D3436]">Búsqueda</h1>
          <p className="text-[13px] text-[#636E72]">
            {results.length} resultado{results.length !== 1 ? 's' : ''}
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
            defaultValue={filters.q ?? ''}
            placeholder="Buscar por descripción..."
            onChange={e => updateFilter('q', e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none focus:ring-2 focus:ring-[#00BFA5]/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            defaultValue={filters.type ?? 'all'}
            onChange={e => updateFilter('type', e.target.value === 'all' ? '' : e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#F5F5F5] text-[12px] font-semibold outline-none"
          >
            <option value="all">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          <select
            defaultValue={filters.categoryId ?? ''}
            onChange={e => updateFilter('categoryId', e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#F5F5F5] text-[12px] font-semibold outline-none"
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            defaultValue={filters.createdBy ?? ''}
            onChange={e => updateFilter('createdBy', e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#F5F5F5] text-[12px] font-semibold outline-none"
          >
            <option value="">Todos los autores</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name ?? 'Usuario'}
              </option>
            ))}
          </select>
          <input
            type="date"
            defaultValue={filters.startDate ?? ''}
            onChange={e => updateFilter('startDate', e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#F5F5F5] text-[12px] outline-none"
          />
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
                  {tx.author_name && ` · ${tx.author_name}`}
                </p>
              </div>
              <span
                className={`text-[14px] font-bold shrink-0 ${
                  tx.type === 'income' ? 'text-[#00BFA5]' : 'text-[#EC4899]'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}
                {fmt(tx.amount_base)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
