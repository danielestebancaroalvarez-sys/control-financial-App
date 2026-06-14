'use client'

import { useState } from 'react'
import { Loader2, Scale } from 'lucide-react'
import { reconcileBalance } from '@/lib/finance/actions'
import { useRouter } from 'next/navigation'

export function ReconcileForm({
  householdId,
  currentBalance,
  currency,
}: {
  householdId: string
  currentBalance: number
  currency: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [bankBalance, setBankBalance] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const value = parseFloat(bankBalance)
    if (isNaN(value)) {
      setError('Ingresa un monto válido.')
      setLoading(false)
      return
    }

    const result = await reconcileBalance(householdId, value)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(
      `Ajuste aplicado: ${result.adjustment! >= 0 ? '+' : ''}${result.adjustment} ${currency}`
    )
    setBankBalance('')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="rounded-2xl bg-[#F5F5F5] p-4">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#00BFA5]" />
          <span className="text-[13px] font-semibold text-[#2D3436]">
            Reconciliar con el banco
          </span>
        </div>
        <span className="text-[12px] text-[#636E72]">
          App: {currentBalance.toFixed(2)} {currency}
        </span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <p className="text-[11px] text-[#636E72]">
            Si tu banco muestra un saldo distinto, ingrésalo aquí. Se creará un
            ajuste automático sin alterar el historial.
          </p>
          <input
            type="number"
            step="0.01"
            value={bankBalance}
            onChange={e => setBankBalance(e.target.value)}
            placeholder={`Saldo real en ${currency}`}
            className="w-full px-4 py-3 rounded-xl bg-white text-[14px] outline-none focus:ring-2 focus:ring-[#00BFA5]/30"
          />
          {error && (
            <p className="text-[12px] text-red-600 text-center">{error}</p>
          )}
          {success && (
            <p className="text-[12px] text-[#00BFA5] text-center font-medium">{success}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#00BFA5] text-white text-[13px] font-bold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Ajustando...</> : 'Aplicar ajuste'}
          </button>
        </form>
      )}
    </div>
  )
}
