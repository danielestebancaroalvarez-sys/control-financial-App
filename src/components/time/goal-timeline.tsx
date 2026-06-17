'use client'

import { Check, Loader2, Trash2 } from 'lucide-react'
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

  return (
    <div className="space-y-4">
      {!compact && goal.vision && (
        <p className="text-[12px] text-cc-secondary italic border-l-2 border-[#6366F1] pl-3">
          {goal.vision}
        </p>
      )}

      <div className="space-y-0">
        {sortedMilestones.map((step, index) => {
          const isDone = step.status === 'done'
          const isCurrent = !isDone && index === firstPendingIdx
          return (
            <TimelineNode
              key={step.id}
              step={step}
              isLast={index === sortedMilestones.length - 1 && actions.length === 0}
              isDone={isDone}
              isCurrent={isCurrent}
              goalId={goal.id}
              onToggle={onToggleStep}
              onDelete={onDeleteStep}
              loadingId={stepLoadingId}
              isFinal={index === sortedMilestones.length - 1 && !!goal.targetDate}
            />
          )
        })}
      </div>

      {actions.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] font-bold text-cc-secondary mb-2">Próximas acciones</p>
          <ul className="space-y-2">
            {actions.map(step => (
              <li key={step.id} className="flex items-center gap-2 pl-4">
                {onToggleStep && (
                  <button
                    type="button"
                    disabled={stepLoadingId === step.id}
                    onClick={() => onToggleStep(goal.id, step.id, step.status === 'done')}
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      step.status === 'done'
                        ? 'bg-[#E8F5E9] text-[#2E7D32]'
                        : 'bg-[#EEF2FF] text-[#6366F1]'
                    }`}
                  >
                    {stepLoadingId === step.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[12px] ${
                      step.status === 'done' ? 'line-through text-cc-muted' : 'text-cc-primary font-medium'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-cc-muted">
                    {step.estimatedMinutes ? formatDuration(step.estimatedMinutes) : ''}
                    {step.dueDate ? ` · ${formatShortDate(step.dueDate)}` : ''}
                  </p>
                </div>
                {onDeleteStep && (
                  <button
                    type="button"
                    onClick={() => onDeleteStep(goal.id, step.id)}
                    className="text-cc-muted hover:text-red-500"
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

function TimelineNode({
  step,
  isLast,
  isDone,
  isCurrent,
  goalId,
  onToggle,
  onDelete,
  loadingId,
  isFinal,
}: {
  step: GoalStep
  isLast: boolean
  isDone: boolean
  isCurrent: boolean
  goalId: string
  onToggle?: (goalId: string, stepId: string, done: boolean) => void
  onDelete?: (goalId: string, stepId: string) => void
  loadingId?: string | null
  isFinal?: boolean
}) {
  const nodeColor = isDone ? '#2E7D32' : isCurrent ? '#6366F1' : '#CBD5E1'

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0 w-5">
        <div
          className="w-3.5 h-3.5 rounded-full border-2 shrink-0 mt-1"
          style={{
            borderColor: nodeColor,
            backgroundColor: isDone ? nodeColor : isCurrent ? nodeColor : 'transparent',
          }}
        />
        {!isLast && <div className="w-0.5 flex-1 bg-[var(--cc-border)] min-h-[2rem]" />}
      </div>
      <div className={`flex-1 pb-4 ${isLast ? 'pb-0' : ''}`}>
        <div className="flex items-start gap-2">
          {onToggle && (
            <button
              type="button"
              disabled={loadingId === step.id}
              onClick={() => onToggle(goalId, step.id, step.status === 'done')}
              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                isDone ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#EEF2FF] text-[#6366F1]'
              }`}
            >
              {loadingId === step.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`text-[13px] font-semibold ${
                isDone ? 'line-through text-cc-muted' : 'text-cc-primary'
              }`}
            >
              {step.title}
            </p>
            {step.dueDate && (
              <p className="text-[11px] text-cc-secondary mt-0.5">
                {formatShortDate(step.dueDate)}
                {' · '}
                {formatRelativeDate(step.dueDate)}
                {isFinal && ' · meta final'}
              </p>
            )}
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(goalId, step.id)}
              className="text-cc-muted hover:text-red-500 shrink-0"
              aria-label="Eliminar hito"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function GoalProgressSummary({ goal }: { goal: ProductivityGoal }) {
  return (
    <p className="text-[11px] font-semibold text-[#6366F1]">
      {goal.percent}% · {goal.doneSteps}/{goal.totalSteps} pasos
      {goal.nextMilestoneDate && goal.daysToNextMilestone !== null && (
        <>
          {' · próximo hito '}
          {goal.daysToNextMilestone >= 0
            ? `en ${goal.daysToNextMilestone} días`
            : `vencido hace ${Math.abs(goal.daysToNextMilestone)} días`}
        </>
      )}
      {goal.estimatedRemainingMinutes > 0 && (
        <> · {formatDuration(goal.estimatedRemainingMinutes)} de acciones pendientes</>
      )}
    </p>
  )
}
