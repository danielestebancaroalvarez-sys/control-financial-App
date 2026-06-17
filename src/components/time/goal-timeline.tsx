'use client'

import { Check, Loader2, MapPin, Trash2, Zap } from 'lucide-react'
import { formatDuration, formatRelativeDate, formatShortDate } from '@/lib/time/format'
import type { GoalStep, ProductivityGoal } from '@/lib/time/types'

export function GoalTimeline({
  goal,
  onToggleStep,
  onDeleteStep,
  stepLoadingId,
  compact = false,
}: {
  goal: ProductivityGoal
  onToggleStep?: (goalId: string, stepId: string, done: boolean) => void
  onDeleteStep?: (goalId: string, stepId: string) => void
  stepLoadingId?: string | null
  compact?: boolean
}) {
  const milestones = goal.steps.filter(s => s.stepType === 'milestone')
  const actions = goal.steps.filter(s => s.stepType === 'action')
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return a.stepOrder - b.stepOrder
  })

  const firstPendingIdx = sortedMilestones.findIndex(s => s.status === 'pending')

  if (compact) {
    const next = sortedMilestones[firstPendingIdx]
    if (!next) return null
    return (
      <p className="text-[11px] text-cc-secondary">
        Próximo: <span className="font-semibold text-cc-primary">{next.title}</span>
        {next.dueDate && ` · ${formatShortDate(next.dueDate)}`}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {goal.vision && (
        <p className="text-[12px] text-cc-secondary leading-relaxed px-1">{goal.vision}</p>
      )}

      {sortedMilestones.length > 0 && (
        <div className="relative">
          <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-[#6366F1] via-[#A5B4FC] to-[#E2E8F0] rounded-full" />
          <ul className="space-y-3">
            {sortedMilestones.map((step, index) => {
              const isDone = step.status === 'done'
              const isCurrent = !isDone && index === firstPendingIdx
              return (
                <MilestoneCard
                  key={step.id}
                  step={step}
                  isDone={isDone}
                  isCurrent={isCurrent}
                  isFinal={index === sortedMilestones.length - 1 && !!goal.targetDate}
                  goalId={goal.id}
                  onToggle={onToggleStep}
                  onDelete={onDeleteStep}
                  loadingId={stepLoadingId}
                />
              )
            })}
          </ul>
        </div>
      )}

      {actions.length > 0 && (
        <div className="rounded-2xl bg-[#F8FAFC] dark:bg-[var(--cc-surface-muted)] p-3">
          <p className="text-[11px] font-bold text-cc-secondary mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
            Acciones rápidas
          </p>
          <ul className="space-y-2">
            {actions.map(step => (
              <li
                key={step.id}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[var(--cc-surface)]"
              >
                {onToggleStep && (
                  <StepCheckbox
                    done={step.status === 'done'}
                    loading={stepLoadingId === step.id}
                    onClick={() => onToggleStep(goal.id, step.id, step.status === 'done')}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[12px] font-medium ${
                      step.status === 'done' ? 'line-through text-cc-muted' : 'text-cc-primary'
                    }`}
                  >
                    {step.title}
                  </p>
                  {(step.estimatedMinutes || step.dueDate) && (
                    <p className="text-[10px] text-cc-muted">
                      {step.estimatedMinutes ? formatDuration(step.estimatedMinutes) : ''}
                      {step.dueDate ? ` · ${formatShortDate(step.dueDate)}` : ''}
                    </p>
                  )}
                </div>
                {onDeleteStep && (
                  <button
                    type="button"
                    onClick={() => onDeleteStep(goal.id, step.id)}
                    className="text-cc-muted hover:text-red-500 p-1"
                    aria-label="Eliminar acción"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function MilestoneCard({
  step,
  isDone,
  isCurrent,
  isFinal,
  goalId,
  onToggle,
  onDelete,
  loadingId,
}: {
  step: GoalStep
  isDone: boolean
  isCurrent: boolean
  isFinal?: boolean
  goalId: string
  onToggle?: (goalId: string, stepId: string, done: boolean) => void
  onDelete?: (goalId: string, stepId: string) => void
  loadingId?: string | null
}) {
  const accent = isDone ? '#10B981' : isCurrent ? '#6366F1' : '#94A3B8'

  return (
    <li className="flex gap-3 pl-0">
      <div
        className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-2 border-2 bg-white dark:bg-[var(--cc-surface)]"
        style={{ borderColor: accent }}
      >
        <MapPin className="w-3.5 h-3.5" style={{ color: accent }} />
      </div>
      <div
        className={`flex-1 rounded-2xl border p-3 transition-shadow ${
          isCurrent ? 'border-[#6366F1]/40 shadow-md shadow-[#6366F1]/10' : 'border-[var(--cc-border)]'
        } ${isDone ? 'opacity-75' : ''}`}
        style={isCurrent ? { backgroundColor: '#EEF2FF33' } : undefined}
      >
        <div className="flex items-start gap-2">
          {onToggle && (
            <StepCheckbox
              done={isDone}
              loading={loadingId === step.id}
              onClick={() => onToggle(goalId, step.id, step.status === 'done')}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={`text-[13px] font-bold ${
                  isDone ? 'line-through text-cc-muted' : 'text-cc-primary'
                }`}
              >
                {step.title}
              </p>
              {isCurrent && (
                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-[#6366F1] text-white">
                  Actual
                </span>
              )}
              {isFinal && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#FEF3C7] text-[#B45309]">
                  Meta final
                </span>
              )}
            </div>
            {step.dueDate && (
              <p className="text-[11px] text-cc-secondary mt-1">
                {formatShortDate(step.dueDate)} · {formatRelativeDate(step.dueDate)}
              </p>
            )}
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(goalId, step.id)}
              className="text-cc-muted hover:text-red-500 shrink-0 p-1"
              aria-label="Eliminar hito"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

function StepCheckbox({
  done,
  loading,
  onClick,
}: {
  done: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
        done ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#EEF2FF] text-[#6366F1]'
      }`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
    </button>
  )
}

export function GoalProgressSummary({ goal }: { goal: ProductivityGoal }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-cc-secondary">
      <span className="font-bold text-[#6366F1]">{goal.percent}% completado</span>
      <span>
        {goal.doneSteps}/{goal.totalSteps} pasos
      </span>
      {goal.nextMilestoneDate && goal.daysToNextMilestone !== null && (
        <span>
          Próximo hito{' '}
          {goal.daysToNextMilestone >= 0
            ? `en ${goal.daysToNextMilestone} días`
            : `vencido hace ${Math.abs(goal.daysToNextMilestone)} días`}
        </span>
      )}
      {goal.estimatedRemainingMinutes > 0 && (
        <span>{formatDuration(goal.estimatedRemainingMinutes)} de acciones pendientes</span>
      )}
    </div>
  )
}

export function GoalProgressRing({ percent }: { percent: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c

  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--cc-border)" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#6366F1"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#6366F1]">
        {percent}%
      </span>
    </div>
  )
}
