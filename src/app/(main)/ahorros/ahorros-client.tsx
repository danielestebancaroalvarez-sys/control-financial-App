'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Plus, Pencil, Trash2, Clock } from 'lucide-react'
import {
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from '@/lib/finance/actions'
import { formatMoney, getTodayString } from '@/lib/finance/format'
import {
  estimateContributionFromTargetDate,
  estimateTargetDateFromContribution,
  formatPlanningSummary,
  goalInputFromForm,
  inferPlanningMode,
  resolveSavingsPayloadFromForm,
  type SavingsPlanningMode,
} from '@/lib/finance/savings-plan'
import {
  autoRegisterToMode,
  modeToAutoRegister,
  type PaymentMode,
} from '@/lib/finance/payment-mode'
import { SavingsCategoryPicker } from '@/components/savings/savings-category-picker'
import { SavingsSimulationCollapsible } from '@/components/savings/savings-simulation-collapsible'
import { SavingsContributionButton } from '@/components/savings/savings-contribution-sheet'
import { formatEstimatedTime } from '@/lib/finance/savings'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { PaymentModeBadge, PaymentModeSelector } from '@/components/transactions/payment-mode-selector'
import {
  DEFAULT_SAVINGS_CATEGORY,
  getSavingsCategory,
  isValidSavingsCategoryId,
  type SavingsCategoryId,
} from '@/lib/finance/savings-categories'
import { SAVINGS_ACCENT } from '@/lib/setup/tour-step-theme'
import { refreshAssistantProgress } from '@/lib/setup/assistant-actions'
import { getNextFinanceStepHref } from '@/lib/setup/tour-advance'
import { parseTourParam } from '@/lib/setup/tour-config'
import type { SavingsGoal, SavingsGoalInput } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

type FormState = {
  name: string
  category: SavingsCategoryId
  target: string
  current: string
  contribution: string
  contributionFrequency: 'weekly' | 'monthly'
  contributionMode: PaymentMode
  contributionStartDate: string
  mode: 'static' | 'compound'
  rate: string
  targetDate: string
  planningMode: SavingsPlanningMode
}

const emptyForm = (): FormState => ({
  name: '',
  category: DEFAULT_SAVINGS_CATEGORY.id,
  target: '',
  current: '0',
  contribution: '',
  contributionFrequency: 'monthly',
  contributionMode: 'reminder',
  contributionStartDate: getTodayString(),
  mode: 'static',
  rate: '',
  targetDate: '',
  planningMode: 'by_contribution',
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
    contributionMode: autoRegisterToMode(goal.auto_contribute),
    contributionStartDate: goal.next_contribution ?? getTodayString(),
    mode: goal.savings_mode,
    rate: goal.annual_interest_rate
      ? String(goal.annual_interest_rate * 100)
      : '',
    targetDate: goal.target_date ?? '',
    planningMode: inferPlanningMode(goal),
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
      <label className="text-[12px] font-semibold text-cc-primary">{label}</label>
      {hint && <p className="text-[10px] text-cc-muted mt-0.5 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

function SavingsGoalForm({
  householdId,
  currency,
  initial,
  goalId,
  guiltFreeMoney,
  periodSavings,
  onDone,
  onCancel,
}: {
  householdId: string
  currency: CurrencyCode
  initial: FormState
  goalId?: string
  guiltFreeMoney?: number
  periodSavings?: number
  onDone: () => void
  onCancel: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const simulationGoal = useMemo(() => goalInputFromForm(form), [form])
  const selectedCategory = getSavingsCategory(form.category)

  const planningPreview = useMemo(() => {
    const input = goalInputFromForm(form)
    if (form.planningMode === 'by_date') {
      if (!form.targetDate) return null
      const needed = estimateContributionFromTargetDate(
        input,
        form.targetDate,
        form.contributionFrequency
      )
      if (needed === null) return 'La fecha debe ser futura.'
      const freq = form.contributionFrequency === 'weekly' ? 'semana' : 'mes'
      return `Necesitas aportar ${formatMoney(needed, currency)} por ${freq}`
    }
    if (!form.contribution || parseFloat(form.contribution) <= 0) return null
    const date = estimateTargetDateFromContribution(input)
    if (!date) return null
    return `Llegarías el ${new Date(`${date}T12:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }, [form, currency])

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const resolved = resolveSavingsPayloadFromForm(form)
    if ('error' in resolved) {
      setError(resolved.error)
      setLoading(false)
      return
    }

    const savingsCat = getSavingsCategory(form.category)

    const payload = {
      householdId,
      name: form.name.trim(),
      category: savingsCat.id,
      icon: savingsCat.icon,
      color: savingsCat.color,
      targetAmount: parseFloat(form.target),
      currentAmount: parseFloat(form.current) || 0,
      targetDate: resolved.targetDate,
      contributionAmount: resolved.contributionAmount,
      contributionFrequency: resolved.contributionFrequency,
      autoContribute: resolved.contributionAmount
        ? modeToAutoRegister(form.contributionMode)
        : undefined,
      nextContribution: resolved.contributionAmount
        ? form.contributionStartDate
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
      className="cc-surface rounded-[24px] p-5 space-y-3"
      data-tour="savings-form"
    >
      <h2 className="text-[15px] font-bold text-cc-primary">
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

      <Field label="¿Cómo quieres planificar?">
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() =>
              setForm(prev => ({ ...prev, planningMode: 'by_contribution' }))
            }
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold leading-tight px-2 ${
              form.planningMode === 'by_contribution'
                ? 'text-white'
                : 'bg-[#F5F5F5] text-cc-secondary dark:bg-[var(--cc-input-bg)]'
            }`}
            style={
              form.planningMode === 'by_contribution'
                ? { backgroundColor: SAVINGS_ACCENT }
                : undefined
            }
          >
            Sé cuánto aporto
          </button>
          <button
            type="button"
            onClick={() =>
              setForm(prev => ({ ...prev, planningMode: 'by_date' }))
            }
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold leading-tight px-2 ${
              form.planningMode === 'by_date'
                ? 'text-white'
                : 'bg-[#F5F5F5] text-cc-secondary dark:bg-[var(--cc-input-bg)]'
            }`}
            style={
              form.planningMode === 'by_date'
                ? { backgroundColor: SAVINGS_ACCENT }
                : undefined
            }
          >
            Tengo fecha límite
          </button>
        </div>
        <p className="text-[10px] text-cc-muted mt-1">
          {form.planningMode === 'by_contribution'
            ? 'Indicas el aporte y calculamos cuándo llegarías.'
            : 'Indicas la fecha y calculamos cuánto aportar cada periodo.'}
        </p>
      </Field>

      {form.planningMode === 'by_contribution' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Aporte periódico" hint="Cuánto puedes aportar">
            <input
              type="number"
              value={form.contribution}
              onChange={e => set('contribution', e.target.value)}
              min="0"
              step="0.01"
              required
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
              <option value="monthly">Mensual</option>
            </select>
          </Field>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha objetivo" hint="Cuándo quieres lograrlo">
            <input
              type="date"
              value={form.targetDate}
              onChange={e => set('targetDate', e.target.value)}
              required
              min={getTodayString()}
              className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
            />
          </Field>
          <Field label="Frecuencia del aporte">
            <select
              value={form.contributionFrequency}
              onChange={e =>
                set('contributionFrequency', e.target.value)
              }
              className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </Field>
        </div>
      )}

      {planningPreview && (
        <div className="rounded-xl px-3 py-2.5 text-[12px] font-semibold cc-accent-warn text-[#B45309] dark:text-[#FBBF24]">
          {planningPreview}
        </div>
      )}

      {(form.planningMode === 'by_contribution'
        ? form.contribution && parseFloat(form.contribution) > 0
        : form.targetDate) && (
        <>
          <Field
            label="Fecha del primer aporte"
            hint="Día en que se repite el aporte según la frecuencia"
          >
            <input
              type="date"
              value={form.contributionStartDate}
              onChange={e => set('contributionStartDate', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
            />
          </Field>

          <PaymentModeSelector
            variant="savings"
            value={form.contributionMode}
            onChange={mode => setForm(prev => ({ ...prev, contributionMode: mode }))}
          />
        </>
      )}

      <Field label="Tipo de ahorro">
        <div className="flex gap-2 mt-1">
          {(['static', 'compound'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => set('mode', m)}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${
                form.mode === m
                  ? 'text-white'
                  : 'bg-[#F5F5F5] text-cc-secondary dark:bg-[var(--cc-input-bg)]'
              }`}
              style={form.mode === m ? { backgroundColor: SAVINGS_ACCENT } : undefined}
            >
              {m === 'static' ? 'Sin interés' : 'Con rentabilidad'}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-cc-muted mt-1">
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

      <SavingsSimulationCollapsible
        goal={simulationGoal}
        accentColor={selectedCategory.color}
        currency={currency}
        guiltFreeMoney={guiltFreeMoney}
        periodSavings={periodSavings}
        defaultOpen
      />

      {error && <p className="text-[12px] text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-[#F5F5F5] text-cc-secondary font-semibold text-[14px]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-white font-bold text-[14px] disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: SAVINGS_ACCENT }}
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
  guiltFreeMoney,
  periodSavings,
}: {
  goals: SavingsGoal[]
  householdId: string
  currency: CurrencyCode
  guiltFreeMoney?: number
  periodSavings?: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSavingsTour = parseTourParam(searchParams.get('tour')) === 'savings'
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (isSavingsTour) setMode('create')
  }, [isSavingsTour])

  async function handleTourSave() {
    await refreshAssistantProgress('finance')
    const next = await getNextFinanceStepHref()
    router.refresh()
    closeForm()
    if (next) router.push(next)
  }

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
          <h1 className="text-[22px] font-bold text-cc-primary">Ahorros</h1>
          <p className="text-[13px] text-cc-secondary">Metas y progreso del hogar</p>
        </div>
        {mode === 'list' && (
          <button
            type="button"
            data-tour="new-savings-goal"
            onClick={() => setMode('create')}
            className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md"
            style={{ backgroundColor: SAVINGS_ACCENT }}
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
          guiltFreeMoney={guiltFreeMoney}
          periodSavings={periodSavings}
          onDone={() => {
            if (isSavingsTour) void handleTourSave()
            else closeForm()
          }}
          onCancel={closeForm}
        />
      )}

      {mode === 'edit' && editingGoal && (
        <SavingsGoalForm
          householdId={householdId}
          currency={currency}
          initial={goalToForm(editingGoal)}
          goalId={editingGoal.id}
          guiltFreeMoney={guiltFreeMoney}
          periodSavings={periodSavings}
          onDone={closeForm}
          onCancel={closeForm}
        />
      )}

      {mode === 'list' &&
        goals.map(goal => {
          const pct = Math.min(
            100,
            Math.round((goal.current_amount / goal.target_amount) * 100)
          )
          const estimate = formatEstimatedTime(goal)
          const planning = formatPlanningSummary(goal, currency)
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
              className="cc-surface rounded-[24px] p-5"
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
                    <p className="text-[16px] font-bold text-cc-primary truncate flex items-center gap-1.5 flex-wrap">
                      {goal.name}
                      {goal.contribution_amount && goal.contribution_amount > 0 && (
                        <PaymentModeBadge autoRegister={goal.auto_contribute} />
                      )}
                    </p>
                    <p className="text-[11px] text-cc-secondary mt-0.5">
                      {savingsCat.label}
                    </p>
                    <p className="text-[12px] text-cc-secondary mt-0.5">
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
                    className="w-9 h-9 rounded-xl bg-[var(--cc-surface-muted)] flex items-center justify-center text-cc-secondary hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
                    aria-label={`Editar ${goal.name}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id, goal.name)}
                    disabled={deletingId === goal.id}
                    className="w-9 h-9 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-cc-secondary hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
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
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#F5F5F5] px-3 py-2.5">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: SAVINGS_ACCENT }} />
                <div>
                  <p className="text-[12px] text-cc-primary font-medium">{estimate}</p>
                  {planning.secondary && (
                    <p className="text-[11px] text-cc-secondary mt-0.5">
                      {planning.secondary}
                    </p>
                  )}
                </div>
              </div>

              {goal.contribution_amount && (
                <p className="text-[11px] text-cc-secondary mt-2">
                  Aporte: {fmt(goal.contribution_amount)}{' '}
                  {goal.contribution_frequency === 'weekly' ? 'semanal' : 'mensual'}
                  {goal.auto_contribute ? ' · automático' : ' · recordatorio'}
                  {goal.savings_mode === 'compound' &&
                    goal.annual_interest_rate &&
                    ` · ${(goal.annual_interest_rate * 100).toFixed(1)}% anual`}
                </p>
              )}

              <SavingsContributionButton
                goal={goal}
                householdId={householdId}
                currency={currency}
              />

              <SavingsSimulationCollapsible
                goal={simulationGoal}
                accentColor={goal.color}
                currency={currency}
                guiltFreeMoney={guiltFreeMoney}
                periodSavings={periodSavings}
              />
            </div>
          )
        })}
    </div>
  )
}
