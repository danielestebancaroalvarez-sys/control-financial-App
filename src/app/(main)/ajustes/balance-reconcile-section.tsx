'use client'

import { useState } from 'react'
import { Loader2, Scale } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { reconcileBalance } from '@/lib/finance/actions'
import { formatMoney } from '@/lib/finance/format'
import type { CurrencyCode } from '@/lib/household/types'

export function BalanceReconcileSection({
  householdId,
  currentBalance,
  currency,
}: {
  householdId: string
  currentBalance: number
  currency: CurrencyCode
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
    <section className="cc-surface rounded-[24px] p-5">
      <h2 className="text-[15px] font-bold text-cc-primary mb-1 flex items-center gap-2">
        <Scale className="w-4 h-4 text-[#00BFA5]" />
        Ajustar saldo con el banco
      </h2>
      <p className="text-[12px] text-cc-secondary mb-4">
        Saldo en la app: <span className="font-semibold text-cc-primary">{fmt(currentBalance)}</span>.
        Si no coincide con tu banco, ingresa el saldo real para crear un ajuste.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="number"
          step="0.01"
          value={bankBalance}
          onChange={e => setBankBalance(e.target.value)}
          placeholder={`Saldo en ${currency}`}
          className="w-full px-3 py-2.5 rounded-xl bg-[#F5F5F5] text-cc-primary placeholder:text-cc-muted text-[13px] outline-none focus:ring-2 focus:ring-[#00BFA5]/30"
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
    </section>
  )
}
