'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Pencil, Trash2, Clock } from 'lucide-react'
import {
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from '@/lib/finance/actions'
import { formatMoney } from '@/lib/finance/format'
import { formatEstimatedTime } from '@/lib/finance/savings'
import { SavingsCategoryPicker } from '@/components/savings/savings-category-picker'
import {
  SavingsProjectionChart,
  formToSavingsGoalInput,
} from '@/components/savings/savings-projection-chart'
import { CategoryIcon } from '@/components/transactions/category-icon'
import {
  DEFAULT_SAVINGS_CATEGORY,
  getSavingsCategory,
  isValidSavingsCategoryId,
  type SavingsCategoryId,
} from '@/lib/finance/savings-categories'
import type { SavingsGoal, SavingsGoalInput } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

type FormState = {
  name: string
  category: SavingsCategoryId
  target: string
  current: string
  contribution: string
  contributionFrequency: 'weekly' | 'biweekly' | 'monthly'
  mode: 'static' | 'compound'
  rate: string
  targetDate: string
}

const emptyForm = (): FormState => ({
  name: '',
  category: DEFAULT_SAVINGS_CATEGORY.id,
  target: '',
  current: '0',
  contribution: '',
  contributionFrequency: 'monthly',
  mode: 'static',
  rate: '',
  targetDate: '',
})

function goalToForm(goal: SavingsGoal): FormState {
  const cat = getSavingsCategory(
    isValidSavingsCategoryId(goal.category) ? goal.category : 'other'
  )
  return {
    name: goal.name,
    category: cat.id,
    target: String(goal.target_amount),
    current: String(goal.current_amount),
    contribution: goal.contribution_amount ? String(goal.contribution_amount) : '',
    contributionFrequency: goal.contribution_frequency ?? 'monthly',
    mode: goal.savings_mode,
    rate: goal.annual_interest_rate
      ? String(goal.annual_interest_rate * 100)
      : '',
    targetDate: goal.target_date ?? '',
  }
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-[#2D3436]">{label}</label>
      {hint && <p className="text-[10px] text-[#B2BEC3] mt-0.5 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

function SavingsGoalForm({
  householdId,
  currency,
  initial,
  goalId,
  onDone,
  onCancel,
}: {
  householdId: string
  currency: CurrencyCode
  initial: FormState
  goalId?: string
  onDone: () => void
  onCancel: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const simulationGoal = useMemo(() => formToSavingsGoalInput(form), [form])
  const selectedCategory = getSavingsCategory(form.category)

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const savingsCat = getSavingsCategory(form.category)

    const payload = {
      householdId,
      name: form.name.trim(),
      category: savingsCat.id,
      icon: savingsCat.icon,
      color: savingsCat.color,
      targetAmount: parseFloat(form.target),
      currentAmount: parseFloat(form.current) || 0,
      targetDate: form.targetDate || undefined,
      contributionAmount: form.contribution
        ? parseFloat(form.contribution)
        : undefined,
      contributionFrequency: form.contribution
        ? form.contributionFrequency
        : undefined,
      savingsMode: form.mode,
      annualInterestRate:
        form.mode === 'compound' && form.rate
          ? parseFloat(form.rate) / 100
          : undefined,
    }

    const result = goalId
      ? await updateSavingsGoal({ ...payload, id: goalId })
      : await createSavingsGoal(payload)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    onDone()
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5 space-y-3"
    >
      <h2 className="text-[15px] font-bold text-[#2D3436]">
        {goalId ? 'Editar meta' : 'Nueva meta de ahorro'}
      </h2>

      <Field label="Nombre de la meta" hint="Ej: Vacaciones, Fondo de emergencia">
        <input
          type="text"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
        />
      </Field>

      <SavingsCategoryPicker
        value={form.category}
        onChange={id => set('category', id)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Monto objetivo" hint="Cuánto quieres reunir">
          <input
            type="number"
            value={form.target}
            onChange={e => set('target', e.target.value)}
            required
            min="1"
            step="0.01"
            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
          />
        </Field>
        <Field label="Ya ahorrado" hint="Lo que llevas hoy">
          <input
            type="number"
            value={form.current}
            onChange={e => set('current', e.target.value)}
            min="0"
            step="0.01"
            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Aporte periódico" hint="Cuánto aportarás">
          <input
            type="number"
            value={form.contribution}
            onChange={e => set('contribution', e.target.value)}
            min="0"
            step="0.01"
            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
          />
        </Field>
        <Field label="Cada cuánto">
          <select
            value={form.contributionFrequency}
            onChange={e =>
              set('contributionFrequency', e.target.value)
            }
            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
          >
            <option value="weekly">Semanal</option>
            <option value="biweekly">Quincenal</option>
            <option value="monthly">Mensual</option>
          </select>
        </Field>
      </div>

      <Field label="Fecha objetivo (opcional)" hint="Cuándo te gustaría lograrlo">
        <input
          type="date"
          value={form.targetDate}
          onChange={e => set('targetDate', e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
        />
      </Field>

      <Field label="Tipo de ahorro">
        <div className="flex gap-2 mt-1">
          {(['static', 'compound'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => set('mode', m)}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${
                form.mode === m
                  ? 'bg-[#00BFA5] text-white'
                  : 'bg-[#F5F5F5] text-[#636E72]'
              }`}
            >
              {m === 'static' ? 'Sin interés' : 'Con rentabilidad'}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-[#B2BEC3] mt-1">
          {form.mode === 'static'
            ? 'El dinero no genera rendimiento.'
            : 'Incluye tasa anual para estimar más rápido.'}
        </p>
      </Field>

      {form.mode === 'compound' && (
        <Field label="Tasa de interés anual (%)" hint="Ej: 5 para 5% anual">
          <input
            type="number"
            value={form.rate}
            onChange={e => set('rate', e.target.value)}
            step="0.1"
            min="0"
            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
          />
        </Field>
      )}

      <div className="rounded-2xl bg-[#F5F5F5] p-4">
        <p className="text-[12px] font-bold text-[#2D3436] mb-3">
          Simulación de crecimiento
        </p>
        <SavingsProjectionChart
          goal={simulationGoal}
          accentColor={selectedCategory.color}
        />
      </div>

      {error && <p className="text-[12px] text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-[#F5F5F5] text-[#636E72] font-semibold text-[14px]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-[#00BFA5] text-white font-bold text-[14px] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : goalId ? (
            'Guardar'
          ) : (
            'Crear meta'
          )}
        </button>
      </div>
    </form>
  )
}

export function AhorrosClient({
  goals,
  householdId,
  currency,
}: {
  goals: SavingsGoal[]
  householdId: string
  currency: CurrencyCode
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fmt = (n: number) => formatMoney(n, currency)
  const editingGoal = goals.find(g => g.id === editingId)

  async function handleDelete(goalId: string, name: string) {
    if (!confirm(`¿Eliminar la meta "${name}"?`)) return
    setDeletingId(goalId)
    await deleteSavingsGoal(goalId, householdId)
    setDeletingId(null)
    router.refresh()
  }

  function closeForm() {
    setMode('list')
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#2D3436]">Ahorros</h1>
          <p className="text-[13px] text-[#636E72]">Metas y progreso del hogar</p>
        </div>
        {mode === 'list' && (
          <button
            type="button"
            onClick={() => setMode('create')}
            className="w-10 h-10 rounded-full bg-[#00BFA5] text-white flex items-center justify-center shadow-md"
            aria-label="Nueva meta"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {mode === 'create' && (
        <SavingsGoalForm
          householdId={householdId}
          currency={currency}
          initial={emptyForm()}
          onDone={closeForm}
          onCancel={closeForm}
        />
      )}

      {mode === 'edit' && editingGoal && (
        <SavingsGoalForm
          householdId={householdId}
          currency={currency}
          initial={goalToForm(editingGoal)}
          goalId={editingGoal.id}
          onDone={closeForm}
          onCancel={closeForm}
        />
      )}

      {mode === 'list' && goals.length === 0 && (
        <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 p-8 text-center">
          <p className="text-[14px] text-[#636E72]">
            Crea tu primera meta con el botón +. Define el monto objetivo y tu
            aporte periódico para ver el tiempo estimado.
          </p>
        </div>
      )}

      {mode === 'list' &&
        goals.map(goal => {
          const pct = Math.min(
            100,
            Math.round((goal.current_amount / goal.target_amount) * 100)
          )
          const estimate = formatEstimatedTime(goal)
          const savingsCat = getSavingsCategory(goal.category)
          const simulationGoal: SavingsGoalInput = {
            target_amount: goal.target_amount,
            current_amount: goal.current_amount,
            contribution_amount: goal.contribution_amount,
            contribution_frequency: goal.contribution_frequency,
            savings_mode: goal.savings_mode,
            annual_interest_rate: goal.annual_interest_rate,
            target_date: goal.target_date,
          }

          return (
            <div
              key={goal.id}
              className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${goal.color}22`,
                      color: goal.color,
                    }}
                  >
                    <CategoryIcon icon={goal.icon} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-[#2D3436] truncate">
                      {goal.name}
                    </p>
                    <p className="text-[11px] text-[#636E72] mt-0.5">
                      {savingsCat.label}
                    </p>
                    <p className="text-[12px] text-[#636E72] mt-0.5">
                      {fmt(goal.current_amount)} de {fmt(goal.target_amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(goal.id)
                      setMode('edit')
                    }}
                    className="w-9 h-9 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#636E72] hover:text-[#00BFA5] hover:bg-[#00BFA5]/10 transition-colors"
                    aria-label={`Editar ${goal.name}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id, goal.name)}
                    disabled={deletingId === goal.id}
                    className="w-9 h-9 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#636E72] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    aria-label={`Eliminar ${goal.name}`}
                  >
                    {deletingId === goal.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="h-2.5 rounded-full bg-[#F5F5F5] overflow-hidden mb-3">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${goal.color}, ${goal.color}cc)`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[12px]">
                <span className="font-bold" style={{ color: goal.color }}>
                  {pct}% completado
                </span>
                {goal.target_date && (
                  <span className="text-[#636E72]">Meta: {goal.target_date}</span>
                )}
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#F5F5F5] px-3 py-2.5">
                <Clock className="w-4 h-4 text-[#00BFA5] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#2D3436] font-medium">{estimate}</p>
              </div>

              {goal.contribution_amount && (
                <p className="text-[11px] text-[#636E72] mt-2">
                  Aporte: {fmt(goal.contribution_amount)}{' '}
                  {goal.contribution_frequency === 'weekly'
                    ? 'semanal'
                    : goal.contribution_frequency === 'biweekly'
                      ? 'quincenal'
                      : 'mensual'}
                  {goal.savings_mode === 'compound' &&
                    goal.annual_interest_rate &&
                    ` · ${(goal.annual_interest_rate * 100).toFixed(1)}% anual`}
                </p>
              )}

              <div className="mt-4 rounded-2xl bg-[#F5F5F5] p-3">
                <p className="text-[11px] font-bold text-[#2D3436] mb-2">
                  Simulación
                </p>
                <SavingsProjectionChart
                  goal={simulationGoal}
                  accentColor={goal.color}
                  height={120}
                />
              </div>
            </div>
          )
        })}
    </div>
  )
}
