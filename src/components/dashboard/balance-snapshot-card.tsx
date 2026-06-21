'use client'

import { useState } from 'react'
import { ChevronDown, Loader2, Pencil, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { reconcileBalance } from '@/lib/finance/actions'
import { formatMoney } from '@/lib/finance/format'
import type { CurrencyCode } from '@/lib/household/types'

export function BalanceSnapshotCard({
  householdId,
  currentBalance,
  currency,
  breakdown,
  guiltFreeMoney,
}: {
  householdId: string
  currentBalance: number
  currency: CurrencyCode
  breakdown: { income: number; expense: number; adjustment: number }
  guiltFreeMoney: number
}) {
  const router = useRouter()
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [bankBalance, setBankBalance] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fmt = (n: number) => formatMoney(n, currency)

  const isPositive = currentBalance >= 0
  const netFlow = breakdown.income - breakdown.expense

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const value = parseFloat(bankBalance)
    if (isNaN(value)) {
      setError('Monto inválido.')
      setLoading(false)
      return
    }

    const result = await reconcileBalance(householdId, value)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setBankBalance('')
    setAdjustOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="rounded-[24px] overflow-hidden shadow-lg border border-[#00BFA5]/20">
      <div className="relative bg-gradient-to-br from-[#00796B] via-[#00BFA5] to-[#2DD4BF] p-4 text-white">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-1/3 w-16 h-16 rounded-full bg-white/5" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <Wallet className="w-4 h-4" />
              <span className="text-[11px] font-semibold tracking-wide uppercase">
                Saldo en la app
              </span>
            </div>
            <p className="text-[30px] font-bold tracking-tight leading-none">
              {fmt(currentBalance)}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-white/15">
                {netFlow >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                Flujo {netFlow >= 0 ? '+' : '−'}
                {fmt(Math.abs(netFlow))}
              </span>
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/15">
                Libre {fmt(Math.max(0, guiltFreeMoney))}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAdjustOpen(v => !v)}
            className="shrink-0 w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Ajustar saldo con el banco"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        <div className="relative mt-3 pt-3 border-t border-white/20 grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <p className="opacity-70">Ingresos</p>
            <p className="font-bold">{fmt(breakdown.income)}</p>
          </div>
          <div>
            <p className="opacity-70">Gastos</p>
            <p className="font-bold">{fmt(breakdown.expense)}</p>
          </div>
          <div>
            <p className="opacity-70">Ajustes</p>
            <p className="font-bold">
              {breakdown.adjustment === 0
                ? '—'
                : `${breakdown.adjustment > 0 ? '+' : '−'}${fmt(Math.abs(breakdown.adjustment))}`}
            </p>
          </div>
        </div>
      </div>

      {adjustOpen && (
        <div className="cc-surface px-4 py-3 border-t border-[var(--cc-border-subtle)]">
          <button
            type="button"
            onClick={() => setAdjustOpen(false)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-cc-secondary mb-2"
          >
            Cuadrar con el banco
            <ChevronDown className="w-4 h-4 rotate-180" />
          </button>
          <p className="text-[10px] text-cc-muted mb-2">
            Ingresa el saldo que ves en tu cuenta para crear un ajuste automático.
          </p>
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="number"
              step="0.01"
              value={bankBalance}
              onChange={e => setBankBalance(e.target.value)}
              placeholder={`Saldo en ${currency}`}
              className="w-full px-3 py-2.5 rounded-xl cc-input text-[13px] outline-none focus:ring-2 focus:ring-[#00BFA5]/30"
            />
            {error && <p className="text-[11px] text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !bankBalance.trim()}
              className="w-full py-2.5 rounded-xl bg-[#00BFA5] text-white text-[12px] font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar ajuste'}
            </button>
          </form>
        </div>
      )}

      {!isPositive && !adjustOpen && (
        <p className="px-4 py-2 text-[10px] font-semibold text-[#C62828] bg-[#FFEBEE]">
          Saldo negativo — revisa gastos o ajusta con tu banco.
        </p>
      )}
    </div>
  )
}
