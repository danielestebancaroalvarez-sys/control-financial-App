'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { updateTransaction } from '@/lib/finance/actions'
import { getTodayString } from '@/lib/finance/format'
import type { Category, TransactionListItem } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

export function EditTransactionSheet({
  transaction,
  categories,
  householdId,
  currency,
  onClose,
}: {
  transaction: TransactionListItem
  categories: Category[]
  householdId: string
  currency: CurrencyCode
  onClose: () => void
}) {
  const router = useRouter()
  const [txType, setTxType] = useState<'income' | 'expense'>(transaction.type as 'income' | 'expense')
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? '')
  const [description, setDescription] = useState(transaction.description)
  const [amount, setAmount] = useState(String(transaction.amount_original))
  const [date, setDate] = useState(transaction.transaction_date)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredCategories = categories.filter(c => c.type === txType)
  const today = getTodayString()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('El monto debe ser mayor a cero.')
      setLoading(false)
      return
    }

    const result = await updateTransaction({
      id: transaction.id,
      householdId,
      type: txType,
      categoryId: categoryId || filteredCategories[0]?.id || '',
      description,
      amount: parsedAmount,
      currency: transaction.currency_original ?? currency,
      transactionDate: date,
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

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md rounded-[24px] bg-white shadow-xl border border-white/80 p-5 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-[#2D3436]">Editar movimiento</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-[#636E72]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTxType(t)
                  setCategoryId('')
                }}
                className={`flex-1 py-2 rounded-xl text-[12px] font-bold ${
                  txType === t ? 'bg-[#00BFA5] text-white' : 'bg-[#F5F5F5] text-[#636E72]'
                }`}
              >
                {t === 'expense' ? 'Gasto' : 'Ingreso'}
              </button>
            ))}
          </div>

          <select
            value={categoryId || filteredCategories[0]?.id || ''}
            onChange={e => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
            required
          >
            {filteredCategories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descripción"
            required
            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
          />

          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Monto"
            required
            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
          />

          <input
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
          />

          {error && <p className="text-[12px] text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#00BFA5] text-white font-bold text-[13px] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
