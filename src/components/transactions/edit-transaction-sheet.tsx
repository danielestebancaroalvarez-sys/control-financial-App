'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Loader2, ShoppingCart, X } from 'lucide-react'
import { updateTransaction } from '@/lib/finance/actions'
import { getTodayString } from '@/lib/finance/format'
import { ReceiptThumbnail } from './receipt-thumbnail'
import { LineItemsEditor } from './line-items-editor'
import type { Category, LineItem, TransactionListItem } from '@/lib/finance/types'
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
  const [txType, setTxType] = useState<'income' | 'expense'>(
    transaction.type as 'income' | 'expense'
  )
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? '')
  const [description, setDescription] = useState(transaction.description)
  const [amount, setAmount] = useState(String(transaction.amount_original))
  const [date, setDate] = useState(transaction.transaction_date)
  const [lineItems, setLineItems] = useState<LineItem[]>(
    transaction.line_items?.length
      ? transaction.line_items
      : [{ name: '', price: 0 }]
  )
  const [lineItemsEnabled, setLineItemsEnabled] = useState(
    (transaction.line_items?.length ?? 0) > 0
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const filteredCategories = categories.filter(c => c.type === txType)
  const selectedCategory = categories.find(c => c.id === categoryId)
  const isMercado =
    selectedCategory?.name === 'Mercado' ||
    transaction.category_name === 'Mercado'
  const today = getTodayString()

  useEffect(() => {
    setMounted(true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    if (lineItemsEnabled && isMercado && txType === 'expense') {
      const total = lineItems.reduce((sum, item) => sum + (item.price || 0), 0)
      if (total > 0) setAmount(String(total))
    }
  }, [lineItems, lineItemsEnabled, isMercado, txType])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const useLineItems =
      lineItemsEnabled &&
      isMercado &&
      txType === 'expense' &&
      lineItems.some(item => item.name.trim() && item.price > 0)

    const parsedItems = useLineItems
      ? lineItems
          .filter(item => item.name.trim() && item.price > 0)
          .map(item => ({
            name: item.name.trim(),
            price: Math.round(item.price * 100) / 100,
          }))
      : undefined

    const parsedAmount = parsedItems?.length
      ? parsedItems.reduce((sum, item) => sum + item.price, 0)
      : parseFloat(amount)

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
      lineItems: parsedItems,
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
      <div className="w-full max-w-md max-h-[min(85dvh,calc(100dvh-7rem))] overflow-y-auto cc-surface-solid rounded-[24px] shadow-xl border border-[var(--cc-border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-cc-primary">Editar movimiento</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full cc-surface-muted flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-cc-secondary" />
          </button>
        </div>

        {transaction.receipt_image_path && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-xl cc-surface-muted">
            <ReceiptThumbnail
              path={transaction.receipt_image_path}
              householdId={householdId}
              className="w-16 h-16"
            />
            <p className="text-[11px] text-cc-secondary">Recibo adjunto a este gasto</p>
          </div>
        )}

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
                  txType === t ? 'bg-[#00BFA5] text-white' : 'cc-surface-muted text-cc-secondary'
                }`}
              >
                {t === 'expense' ? 'Gasto' : 'Ingreso'}
              </button>
            ))}
          </div>

          <select
            value={categoryId || filteredCategories[0]?.id || ''}
            onChange={e => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
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
            className="w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
          />

          {isMercado && txType === 'expense' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#00BFA5]" />
                  <span className="text-[13px] font-semibold text-cc-primary">
                    Productos de la compra
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={lineItemsEnabled}
                  onClick={() => setLineItemsEnabled(v => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    lineItemsEnabled ? 'bg-[#00BFA5]' : 'bg-[#DFE6E9]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      lineItemsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              {lineItemsEnabled && (
                <LineItemsEditor
                  items={lineItems}
                  onChange={setLineItems}
                  currency={transaction.currency_original ?? currency}
                />
              )}
            </div>
          )}

          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Monto"
            required
            disabled={lineItemsEnabled && isMercado && txType === 'expense'}
            className="w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none disabled:opacity-70"
          />

          <input
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
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

  if (!mounted) return null
  return createPortal(sheet, document.body)
}
