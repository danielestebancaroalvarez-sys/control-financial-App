'use client'

import { useState } from 'react'
import { Loader2, Scale } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { reconcileBalance } from '@/lib/finance/actions'
import { formatMoney } from '@/lib/finance/format'
import type { CurrencyCode } from '@/lib/household/types'

export function BalanceReconcileCollapsible({
  householdId,
  currentBalance,
  currency,
  breakdown,
}: {
  householdId: string
  currentBalance: number
  currency: CurrencyCode
  breakdown: { income: number; expense: number; adjustment: number }
}) {
  const router = useRouter()
  const [bankBalance, setBankBalance] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fmt = (n: number) => formatMoney(n, currency)

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
    setLoading(false)
    router.refresh()
  }

  return (
    <CollapsibleSection
      title="Saldo real"
      summary={fmt(currentBalance)}
      icon={<Scale className="w-4 h-4 text-[#00BFA5]" />}
      defaultOpen={false}
    >
      <div className="pt-3 space-y-3">
        <p className="text-[11px] text-cc-secondary">
          Ingresos {fmt(breakdown.income)} − Gastos {fmt(breakdown.expense)}
          {breakdown.adjustment !== 0 && (
            <>
              {' '}
              {breakdown.adjustment > 0 ? '+' : '−'}{' '}
              {fmt(Math.abs(breakdown.adjustment))} ajustes
            </>
          )}
        </p>
        <p className="text-[11px] text-cc-secondary">
          Si no coincide con tu banco, ingresa el saldo real para crear un ajuste.
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
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ajustar con el banco'}
          </button>
        </form>
      </div>
    </CollapsibleSection>
  )
}
