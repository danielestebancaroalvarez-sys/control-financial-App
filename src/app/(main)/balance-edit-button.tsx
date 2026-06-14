'use client'

import { useState } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import { reconcileBalance } from '@/lib/finance/actions'
import { useRouter } from 'next/navigation'

export function BalanceEditButton({
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

    setOpen(false)
    setBankBalance('')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        aria-label="Ajustar saldo con el banco"
      >
        <Pencil className="w-4 h-4 text-white" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
          />
          <form
            onSubmit={handleSubmit}
            className="absolute right-0 top-10 z-50 w-64 rounded-2xl bg-white shadow-xl border border-[#EEEEEE] p-4 space-y-3"
          >
            <p className="text-[12px] font-bold text-[#2D3436]">Ajustar saldo</p>
            <p className="text-[11px] text-[#636E72]">
              App: {currentBalance.toFixed(2)} {currency}. Ingresa el saldo de tu banco.
            </p>
            <input
              type="number"
              step="0.01"
              value={bankBalance}
              onChange={e => setBankBalance(e.target.value)}
              placeholder={`Saldo en ${currency}`}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F5F5F5] text-[13px] outline-none"
              autoFocus
            />
            {error && <p className="text-[11px] text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#00BFA5] text-white text-[12px] font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
