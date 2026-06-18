'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, X } from 'lucide-react'
import { recordSavingsContribution } from '@/lib/finance/actions'
import { getTodayString } from '@/lib/finance/format'
import { formatMoney } from '@/lib/finance/format'
import type { SavingsGoal } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

export function SavingsContributionSheet({
  goal,
  householdId,
  currency,
  onClose,
}: {
  goal: SavingsGoal
  householdId: string
  currency: CurrencyCode
  onClose: () => void
}) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(getTodayString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const fmt = (n: number) => formatMoney(n, currency)
  const remaining = Math.max(0, goal.target_amount - goal.current_amount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) {
      setError('Ingresa un monto válido.')
      return
    }

    setLoading(true)
    setError(null)

    const result = await recordSavingsContribution({
      householdId,
      goalId: goal.id,
      amount: parsed,
      transactionDate: date,
      note: note.trim() || undefined,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    onClose()
    router.refresh()
  }

  const sheet = (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md max-h-[min(85dvh,calc(100dvh-7rem))] overflow-y-auto cc-surface-solid rounded-[24px] shadow-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-bold text-cc-primary">Registrar aporte</h3>
            <p className="text-[12px] text-cc-secondary">{goal.name}</p>
            <p className="text-[11px] text-cc-muted mt-0.5">
              {fmt(goal.current_amount)} de {fmt(goal.target_amount)}
              {remaining > 0 && ` · faltan ${fmt(remaining)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-cc-secondary">Monto del aporte</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="mt-1 w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-cc-secondary">Nota (opcional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={`Aporte a ${goal.name}`}
              className="mt-1 w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-cc-secondary">Fecha</label>
            <input
              type="date"
              value={date}
              max={getTodayString()}
              onChange={e => setDate(e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
            />
          </div>

          <p className="text-[10px] text-cc-muted">
            Se registra como gasto en &quot;Otros gastos&quot; y actualiza el progreso de la meta.
          </p>

          {error && <p className="text-[12px] text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#00BFA5] text-white font-bold text-[13px] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar aporte'}
          </button>
        </form>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(sheet, document.body)
}

export function SavingsContributionButton({
  goal,
  householdId,
  currency,
}: {
  goal: SavingsGoal
  householdId: string
  currency: CurrencyCode
}) {
  const [open, setOpen] = useState(false)

  if (goal.current_amount >= goal.target_amount) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#E0F2F1] text-[#00796B] text-[12px] font-bold"
      >
        <Plus className="w-4 h-4" />
        {goal.auto_contribute ? 'Registrar aporte extra' : 'Registrar aporte real'}
      </button>
      {open && (
        <SavingsContributionSheet
          goal={goal}
          householdId={householdId}
          currency={currency}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
