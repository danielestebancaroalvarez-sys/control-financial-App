'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Check, Loader2, Repeat } from 'lucide-react'
import { createRecurringSchedule } from '@/lib/finance/actions'
import { getCategoryRadarKind } from '@/lib/finance/category-radar'
import { getTodayString } from '@/lib/finance/format'
import { CategoryIcon } from './category-icon'
import type { Category } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

type ScheduleType = 'income' | 'expense'

export function FixedScheduleForm({
  householdId,
  baseCurrency,
  categories,
}: {
  householdId: string
  baseCurrency: CurrencyCode
  categories: Category[]
}) {
  const router = useRouter()
  const [scheduleType, setScheduleType] = useState<ScheduleType>('expense')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(getTodayString())
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
    <form onSubmit={handleSubmit} className="cc-surface rounded-[24px] p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Repeat className="w-4 h-4 text-[#00BFA5]" />
          <h2 className="text-[15px] font-bold text-cc-primary">
            Ingresos y gastos fijos
          </h2>
        </div>
        <p className="text-[11px] text-cc-secondary leading-relaxed">
          Configura lo que se repite automáticamente (arriendo, salario, servicios).
          No crea un registro del día: solo programa el parámetro para el radar y el
          presupuesto.
        </p>
      </div>

      <div className="flex rounded-2xl cc-surface-muted p-1">
        {(['expense', 'income'] as const).map(type => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setScheduleType(type)
              setCategoryId('')
            }}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
              scheduleType === type
                ? 'bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF] text-white shadow-sm'
                : 'text-cc-secondary'
            }`}
          >
            {type === 'income' ? 'Ingreso fijo' : 'Gasto fijo'}
          </button>
        ))}
      </div>

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
          className="mt-1 w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
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
          className="mt-1 w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-cc-secondary flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          Primera fecha programada
        </label>
        <p className="text-[10px] text-cc-muted mb-1">
          Puede ser hoy, pasada o futura. Ahí empieza la repetición automática.
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
            setFrequency(e.target.value as 'weekly' | 'biweekly' | 'monthly')
          }
          className="mt-1 w-full px-3 py-2.5 rounded-xl cc-input text-[13px] font-semibold outline-none"
        >
          <option value="weekly">Semanal</option>
          <option value="biweekly">Quincenal</option>
          <option value="monthly">Mensual</option>
        </select>
      </div>

      {error && <p className="text-[12px] text-red-600 text-center">{error}</p>}
      {success && (
        <p className="text-[12px] text-[#00796B] text-center cc-surface-muted rounded-xl px-3 py-2">
          Movimiento fijo guardado. Se registrará automáticamente en la fecha indicada.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-2xl bg-[#00BFA5] text-white text-[14px] font-bold disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4" />
            Guardar {scheduleType === 'income' ? 'ingreso' : 'gasto'} fijo
          </>
        )}
      </button>
    </form>
  )
}
