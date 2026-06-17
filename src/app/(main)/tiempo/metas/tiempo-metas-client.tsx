'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarClock, Check, Loader2, Plus, Target, Trash2 } from 'lucide-react'
import {
  addGoalStep,
  createProductivityGoal,
  deleteGoalStep,
  deleteProductivityGoal,
  toggleGoalStep,
} from '@/lib/time/actions'
import { formatDuration, formatShortDate } from '@/lib/time/format'
import { TIME_THEME } from '@/lib/time/theme'
import type { ProductivityGoal } from '@/lib/time/types'
import type { HouseholdMember } from '@/lib/household/types'

type DraftStep = { title: string; minutes: string }

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T12:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function TiempoMetasClient({
  goals: initialGoals,
  householdId,
}: {
  goals: ProductivityGoal[]
  householdId: string
  members: HouseholdMember[]
}) {
  const router = useRouter()
  const [goals, setGoals] = useState(initialGoals)

  useEffect(() => {
    setGoals(initialGoals)
  }, [initialGoals])

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [draftSteps, setDraftSteps] = useState<DraftStep[]>([{ title: '', minutes: '' }])
  const [loading, setLoading] = useState(false)
  const [stepLoadingId, setStepLoadingId] = useState<string | null>(null)
  const [addingToGoalId, setAddingToGoalId] = useState<string | null>(null)
  const [newStepTitle, setNewStepTitle] = useState('')
  const [newStepMinutes, setNewStepMinutes] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const steps = draftSteps
      .filter(s => s.title.trim())
      .map(s => ({
        title: s.title.trim(),
        estimatedMinutes: s.minutes ? parseInt(s.minutes, 10) : null,
      }))

    const result = await createProductivityGoal({
      householdId,
      title: title.trim() || 'Nueva meta',
      targetDate: targetDate || null,
      steps,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setShowForm(false)
    setTitle('')
    setTargetDate('')
    setDraftSteps([{ title: '', minutes: '' }])
    setLoading(false)
    router.refresh()
  }

  async function handleToggleStep(goalId: string, stepId: string, done: boolean) {
    setStepLoadingId(stepId)
    const result = await toggleGoalStep(householdId, stepId, !done)
    if (!result.error) {
      setGoals(prev =>
        prev.map(g => {
          if (g.id !== goalId) return g
          const steps = g.steps.map(s =>
            s.id === stepId
              ? ({ ...s, status: done ? 'pending' : 'done' } as const)
              : s
          )
          const doneSteps = steps.filter(s => s.status === 'done').length
          const estimatedRemainingMinutes = steps
            .filter(s => s.status === 'pending')
            .reduce((sum, s) => sum + (s.estimatedMinutes ?? 0), 0)
          return {
            ...g,
            steps,
            doneSteps,
            percent: g.totalSteps > 0 ? Math.round((doneSteps / g.totalSteps) * 100) : 0,
            estimatedRemainingMinutes,
          }
        })
      )
      router.refresh()
    }
    setStepLoadingId(null)
  }

  async function handleAddStep(goalId: string) {
    if (!newStepTitle.trim()) return
    setStepLoadingId(goalId)
    const result = await addGoalStep(householdId, goalId, {
      title: newStepTitle.trim(),
      estimatedMinutes: newStepMinutes ? parseInt(newStepMinutes, 10) : null,
    })
    if (!result.error) {
      setAddingToGoalId(null)
      setNewStepTitle('')
      setNewStepMinutes('')
      router.refresh()
    }
    setStepLoadingId(null)
  }

  async function handleDeleteStep(goalId: string, stepId: string) {
    setStepLoadingId(stepId)
    const result = await deleteGoalStep(householdId, stepId)
    if (!result.error) {
      setGoals(prev =>
        prev.map(g => {
          if (g.id !== goalId) return g
          const steps = g.steps.filter(s => s.id !== stepId)
          const doneSteps = steps.filter(s => s.status === 'done').length
          const estimatedRemainingMinutes = steps
            .filter(s => s.status === 'pending')
            .reduce((sum, s) => sum + (s.estimatedMinutes ?? 0), 0)
          return {
            ...g,
            steps,
            doneSteps,
            totalSteps: steps.length,
            percent: steps.length > 0 ? Math.round((doneSteps / steps.length) * 100) : 0,
            estimatedRemainingMinutes,
          }
        })
      )
      router.refresh()
    }
    setStepLoadingId(null)
  }

  async function handleDeleteGoal(goalId: string) {
    const result = await deleteProductivityGoal(householdId, goalId)
    if (!result.error) {
      setGoals(prev => prev.filter(g => g.id !== goalId))
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-cc-primary flex items-center gap-2">
          <Target className="w-5 h-5 text-[#6366F1]" />
          Metas y proyectos
        </h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">
          Planifica pasos, tiempos estimados y fechas objetivo.
        </p>
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[13px] font-bold"
        >
          <Plus className="w-4 h-4" />
          Nueva meta
        </button>
      ) : (
        <form onSubmit={handleCreate} className="cc-surface rounded-[24px] p-4 space-y-3">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nombre de la meta"
            className={`w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ${TIME_THEME.focus}`}
          />
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ${TIME_THEME.focus}`}
          />
          <p className="text-[11px] font-semibold text-cc-secondary">Pasos</p>
          {draftSteps.map((step, index) => (
            <div key={index} className="grid grid-cols-[1fr_5rem] gap-2">
              <input
                type="text"
                value={step.title}
                onChange={e => {
                  const next = [...draftSteps]
                  next[index] = { ...next[index], title: e.target.value }
                  setDraftSteps(next)
                }}
                placeholder="Ej: Investigar opciones"
                className={`w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ${TIME_THEME.focus}`}
              />
              <input
                type="number"
                min="1"
                value={step.minutes}
                onChange={e => {
                  const next = [...draftSteps]
                  next[index] = { ...next[index], minutes: e.target.value }
                  setDraftSteps(next)
                }}
                placeholder="min"
                className={`w-full px-3 py-3 rounded-xl cc-input text-[14px] outline-none ${TIME_THEME.focus}`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDraftSteps(prev => [...prev, { title: '', minutes: '' }])}
            className="text-[12px] font-bold text-[#6366F1]"
          >
            + Otro paso
          </button>
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl cc-surface-muted text-[13px] font-bold text-cc-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-white text-[13px] font-bold disabled:opacity-60 ${TIME_THEME.submit}`}
            >
              {loading ? 'Guardando…' : 'Crear meta'}
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 && !showForm ? (
        <section className="cc-surface rounded-[24px] p-6 text-center">
          <p className="text-[13px] text-cc-secondary">
            Crea metas con pasos para proyectos personales o del hogar.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const daysLeft = goal.targetDate ? daysUntil(goal.targetDate) : null
            return (
              <section key={goal.id} className="cc-surface rounded-[24px] p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-bold text-cc-primary">{goal.title}</h2>
                    {goal.targetDate && (
                      <p className="text-[11px] text-cc-secondary">
                        Objetivo: {formatShortDate(goal.targetDate)}
                        {daysLeft !== null && daysLeft >= 0 && ` · ${daysLeft} días restantes`}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-cc-muted hover:text-red-500 shrink-0"
                    aria-label="Eliminar meta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-2 rounded-full cc-track overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-[#6366F1]"
                    style={{ width: `${goal.percent}%` }}
                  />
                </div>
                <p className="text-[11px] font-semibold text-[#6366F1] mb-3">
                  {goal.percent}% · {goal.doneSteps}/{goal.totalSteps} pasos
                  {goal.estimatedRemainingMinutes > 0 &&
                    ` · faltan ${formatDuration(goal.estimatedRemainingMinutes)}`}
                </p>
                <ul className="space-y-2">
                  {goal.steps.map(step => (
                    <li key={step.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={stepLoadingId === step.id}
                        onClick={() =>
                          handleToggleStep(goal.id, step.id, step.status === 'done')
                        }
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          step.status === 'done'
                            ? 'bg-[#E8F5E9] text-[#2E7D32]'
                            : 'bg-[#EEF2FF] text-[#6366F1]'
                        }`}
                      >
                        {stepLoadingId === step.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[12px] ${
                            step.status === 'done'
                              ? 'text-cc-muted line-through'
                              : 'text-cc-primary font-medium'
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-[10px] text-cc-muted">
                          {step.estimatedMinutes
                            ? formatDuration(step.estimatedMinutes)
                            : ''}
                          {step.dueDate ? ` · ${formatShortDate(step.dueDate)}` : ''}
                          {step.assigneeName ? ` · ${step.assigneeName}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteStep(goal.id, step.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-cc-muted hover:text-red-500 shrink-0"
                        aria-label="Eliminar paso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
                {addingToGoalId === goal.id ? (
                  <div className="mt-3 grid grid-cols-[1fr_5rem_auto] gap-2">
                    <input
                      type="text"
                      value={newStepTitle}
                      onChange={e => setNewStepTitle(e.target.value)}
                      placeholder="Nuevo paso"
                      className={`px-3 py-2 rounded-xl cc-input text-[13px] outline-none ${TIME_THEME.focus}`}
                    />
                    <input
                      type="number"
                      min="1"
                      value={newStepMinutes}
                      onChange={e => setNewStepMinutes(e.target.value)}
                      placeholder="min"
                      className={`px-3 py-2 rounded-xl cc-input text-[13px] outline-none ${TIME_THEME.focus}`}
                    />
                    <button
                      type="button"
                      disabled={stepLoadingId === goal.id}
                      onClick={() => handleAddStep(goal.id)}
                      className="px-3 py-2 rounded-xl bg-[#6366F1] text-white text-[12px] font-bold"
                    >
                      {stepLoadingId === goal.id ? '…' : 'Añadir'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingToGoalId(goal.id)
                      setNewStepTitle('')
                      setNewStepMinutes('')
                    }}
                    className="mt-3 text-[12px] font-bold text-[#6366F1]"
                  >
                    + Añadir paso
                  </button>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
