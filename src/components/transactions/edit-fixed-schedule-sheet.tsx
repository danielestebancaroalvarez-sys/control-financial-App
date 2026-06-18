'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { CalendarClock, Loader2, X } from 'lucide-react'
import { updateRecurringSchedule } from '@/lib/finance/actions'
import { getCategoryColor } from '@/lib/finance/categories'
import {
  autoRegisterToMode,
  modeToAutoRegister,
  type PaymentMode,
} from '@/lib/finance/payment-mode'
import { getNextBillingDate } from '@/lib/finance/recurring-occurrences'
import { CategoryIcon } from './category-icon'
import { PaymentModeSelector } from './payment-mode-selector'
import type { Category, RecurringScheduleItem } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

export function EditFixedScheduleSheet({
  item,
  categories,
  householdId,
  currency,
  onClose,
  onUpdated,
}: {
  item: RecurringScheduleItem
  categories: Category[]
  householdId: string
  currency: CurrencyCode
  onClose: () => void
  onUpdated: (updated: RecurringScheduleItem) => void
}) {
  const router = useRouter()
  const [scheduleType, setScheduleType] = useState<'income' | 'expense'>(item.type)
  const [categoryId, setCategoryId] = useState(item.categoryId)
  const [description, setDescription] = useState(item.description)
  const [amount, setAmount] = useState(String(item.amount))
  const [startDate, setStartDate] = useState(item.nextOccurrence)
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>(item.frequency)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    autoRegisterToMode(item.autoRegister)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const filteredCategories = useMemo(
    () => categories.filter(c => c.type === scheduleType),
    [categories, scheduleType]
  )

  useEffect(() => {
    setMounted(true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const catId = categoryId || filteredCategories[0]?.id
    if (!catId) {
      setError('Selecciona una categoría.')
      setLoading(false)
      return
    }

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Ingresa un monto válido.')
      setLoading(false)
      return
    }

    const desc =
      description.trim() ||
      filteredCategories.find(c => c.id === catId)?.name ||
      (scheduleType === 'income' ? 'Ingreso fijo' : 'Gasto fijo')

    const result = await updateRecurringSchedule({
      id: item.id,
      householdId,
      type: scheduleType,
      categoryId: catId,
      description: desc,
      amount: parsedAmount,
      currency,
      frequency,
      startDate,
      autoRegister: modeToAutoRegister(paymentMode),
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    const cat = filteredCategories.find(c => c.id === catId)
    onUpdated({
      ...item,
      type: scheduleType,
      categoryId: catId,
      description: desc,
      amount: parsedAmount,
      frequency,
      nextOccurrence: startDate,
      nextBillingDate: getNextBillingDate(startDate, frequency),
      categoryName: cat?.name ?? item.categoryName,
      categoryIcon: cat?.icon ?? item.categoryIcon,
      categoryColor: cat
        ? getCategoryColor(cat.name, cat.color)
        : item.categoryColor,
      autoRegister: modeToAutoRegister(paymentMode),
    })

    setLoading(false)
    onClose()
    router.refresh()
  }

  const sheet = (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md max-h-[min(85dvh,calc(100dvh-7rem))] overflow-y-auto cc-surface-solid rounded-[24px] shadow-xl border border-[var(--cc-border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-cc-primary">
            Editar {item.type === 'income' ? 'ingreso' : 'gasto'} fijo
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full cc-surface-muted flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-cc-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setScheduleType(type)
                  setCategoryId('')
                }}
                className={`flex-1 py-2 rounded-xl text-[12px] font-bold ${
                  scheduleType === type
                    ? 'bg-[#00BFA5] text-white'
                    : 'cc-surface-muted text-cc-secondary'
                }`}
              >
                {type === 'income' ? 'Ingreso' : 'Gasto'}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {filteredCategories.map(cat => {
              const active = (categoryId || filteredCategories[0]?.id) === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`shrink-0 flex flex-col items-center gap-1.5 w-[4.5rem] py-3 rounded-2xl transition-all ${
                    active
                      ? 'bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] text-white shadow-md'
                      : 'cc-surface-muted text-cc-secondary'
                  }`}
                >
                  <CategoryIcon icon={cat.icon} className="w-5 h-5" />
                  <span className="text-[9px] font-semibold text-center leading-tight px-1">
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div>

          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descripción"
            className="w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
          />

          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={`Monto (${currency})`}
            className="w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
          />

          <div>
            <label className="text-[11px] font-semibold text-cc-secondary flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5" />
              Fecha de inicio / ancla
            </label>
            <p className="text-[10px] text-cc-muted mb-1">
              Día del mes o semana en que se repite el movimiento.
            </p>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-cc-secondary">Frecuencia</label>
            <select
              value={frequency}
              onChange={e =>
                setFrequency(e.target.value as 'weekly' | 'monthly')
              }
              className="mt-1 w-full px-3 py-2.5 rounded-xl cc-input text-[13px] font-semibold outline-none"
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          <PaymentModeSelector
            value={paymentMode}
            onChange={setPaymentMode}
            scheduleType={scheduleType}
          />

          {error && <p className="text-[12px] text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#00BFA5] text-white text-[14px] font-bold disabled:opacity-60 flex items-center justify-center gap-2"
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
