'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Check, Loader2 } from 'lucide-react'
import { createRecurringSchedule } from '@/lib/finance/actions'
import { getCategoryRadarKind } from '@/lib/finance/category-radar'
import { getTodayString } from '@/lib/finance/format'
import { TX_TYPE_THEME, type TxType } from './tx-type-theme'
import { CategoryIcon } from './category-icon'
import type { Category } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

export function FixedScheduleForm({
  householdId,
  baseCurrency,
  categories,
  defaultType = 'expense',
  hideTypeSelector = false,
}: {
  householdId: string
  baseCurrency: CurrencyCode
  categories: Category[]
  defaultType?: TxType
  hideTypeSelector?: boolean
}) {
  const router = useRouter()
  const [scheduleType, setScheduleType] = useState<TxType>(defaultType)
  const theme = TX_TYPE_THEME[scheduleType]
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(getTodayString())
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setScheduleType(defaultType)
    setCategoryId('')
  }, [defaultType])

  const filteredCategories = useMemo(
    () => categories.filter(c => c.type === scheduleType),
    [categories, scheduleType]
  )

  const selectedCategory = filteredCategories.find(
    c => c.id === (categoryId || filteredCategories[0]?.id)
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

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
      selectedCategory?.name ||
      (scheduleType === 'income' ? 'Ingreso fijo' : 'Gasto fijo')

    const result = await createRecurringSchedule({
      householdId,
      type: scheduleType,
      categoryId: catId,
      description: desc,
      amount: parsedAmount,
      currency: baseCurrency,
      frequency,
      startDate,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setDescription('')
    setAmount('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-[11px] text-cc-secondary leading-relaxed cc-surface rounded-2xl px-4 py-3">
        No crea un movimiento hoy: programa el {scheduleType === 'income' ? 'ingreso' : 'gasto'}{' '}
        para el radar y el presupuesto (arriendo, salario, servicios…).
      </p>

      {!hideTypeSelector && (
        <div className="flex rounded-2xl cc-surface-muted p-1">
          {(['expense', 'income'] as const).map(type => {
            const t = TX_TYPE_THEME[type]
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setScheduleType(type)
                  setCategoryId('')
                }}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                  scheduleType === type
                    ? `bg-gradient-to-r ${t.gradient} text-white shadow-sm`
                    : 'text-cc-secondary'
                }`}
              >
                {t.fixedLabel}
              </button>
            )
          })}
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold text-cc-secondary mb-2">Categoría</p>
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
                    ? `bg-gradient-to-br ${theme.gradient} text-white shadow-md`
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
        {selectedCategory && (
          <p className="text-[10px] text-cc-muted mt-2">
            {getCategoryRadarKind(selectedCategory) === 'service' &&
              'Aparecerá en pagos fijos del radar.'}
            {getCategoryRadarKind(selectedCategory) === 'subscription' &&
              'Aparecerá en Suscripciones. Usa la descripción para el nombre.'}
            {getCategoryRadarKind(selectedCategory) === 'shopping' &&
              'Aparecerá en predicción de Mercado.'}
          </p>
        )}
      </div>

      <div>
        <label className="text-[11px] font-semibold text-cc-secondary">Descripción</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={
            scheduleType === 'income' ? 'Ej: Salario mensual' : 'Ej: Arriendo, Netflix...'
          }
          className={`mt-1 w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ring-2 ring-transparent ${theme.focus}`}
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-cc-secondary">
          Monto ({baseCurrency})
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          className={`mt-1 w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ring-2 ring-transparent ${theme.focus}`}
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-cc-secondary flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          Primera fecha programada
        </label>
        <p className="text-[10px] text-cc-muted mb-1">
          Día del mes o semana en que se repite. Puede ser hoy, pasada o futura.
        </p>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ring-2 ring-transparent ${theme.focus}`}
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-cc-secondary">Frecuencia</label>
        <select
          value={frequency}
          onChange={e =>
            setFrequency(e.target.value as 'weekly' | 'biweekly' | 'monthly')
          }
          className={`mt-1 w-full px-3 py-2.5 rounded-xl cc-input text-[13px] font-semibold outline-none ring-2 ring-transparent ${theme.focus}`}
        >
          <option value="weekly">Semanal</option>
          <option value="biweekly">Quincenal</option>
          <option value="monthly">Mensual</option>
        </select>
      </div>

      {error && <p className="text-[12px] text-red-600 text-center">{error}</p>}
      {success && (
        <p className={`text-[12px] text-center cc-surface-muted rounded-xl px-3 py-2 ${theme.text}`}>
          {theme.fixedLabel} guardado. Aparecerá en el radar y el presupuesto.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3.5 rounded-2xl text-white text-[14px] font-bold disabled:opacity-60 flex items-center justify-center gap-2 bg-gradient-to-r ${theme.gradient}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4" />
            Guardar {theme.fixedLabel.toLowerCase()}
          </>
        )}
      </button>
    </form>
  )
}
