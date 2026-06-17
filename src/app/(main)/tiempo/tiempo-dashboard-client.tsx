'use client'

import Link from 'next/link'
import { Clock, Moon, Users } from 'lucide-react'
import { DonutChart } from '@/components/dashboard/donut-chart'
import {
  formatChartPeriodCaption,
  formatDuration,
  formatDurationHours,
} from '@/lib/time/format'
import type { TimeDashboardSummary } from '@/lib/time/types'

function WeekSelector({
  activeOffset,
}: {
  activeOffset: number
}) {
  const blocks = Array.from({ length: 6 }, (_, offset) => ({
    offset,
    label: offset === 0 ? 'Actual' : offset === 1 ? 'Anterior' : `-${offset}`,
    href: offset === 0 ? '/tiempo' : `/tiempo?block=${offset}`,
  }))

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {blocks.map(block => {
        const active = block.offset === activeOffset
        return (
          <Link
            key={block.offset}
            href={block.href}
            prefetch
            className={`shrink-0 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
              active
                ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-sm'
                : 'bg-white/80 text-cc-secondary border border-white/60 dark:bg-[var(--cc-surface-muted)]'
            }`}
          >
            {block.label}
          </Link>
        )
      })}
    </div>
  )
}

export function TiempoDashboardClient({
  summary,
  periodOffset,
  householdName,
}: {
  summary: TimeDashboardSummary
  periodOffset: number
  householdName: string
}) {
  const periodCaption = formatChartPeriodCaption(
    summary.periodLabel,
    summary.periodStart,
    summary.periodEnd
  )

  const slices = summary.byCategory.map(c => ({
    value: c.minutes,
    color: c.color,
    label: c.name,
  }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-cc-primary flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#6366F1]" />
          Tu tiempo
        </h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">{householdName}</p>
      </div>

      <div className="cc-surface rounded-[24px] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-bold text-cc-primary">Periodo semanal</p>
          <p className="text-[10px] text-cc-secondary">{periodCaption}</p>
        </div>
        <WeekSelector activeOffset={periodOffset} />
      </div>

      <div className="cc-surface rounded-[24px] p-5">
        <p className="text-[12px] font-bold text-cc-primary mb-1">Resumen del periodo</p>
        <p className="text-[10px] font-semibold text-cc-secondary mb-4">{periodCaption}</p>
        <p className="text-[28px] font-bold text-[#4F46E5]">
          {formatDurationHours(summary.totalMinutes)}
        </p>
        <p className="text-[11px] text-cc-secondary mt-1">tiempo registrado y programado</p>
        <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-cc-muted">
          <span className="flex items-center gap-1">
            <Moon className="w-3.5 h-3.5 text-[#6366F1]" />
            Sueño: {formatDuration(summary.sleepMinutes)}
          </span>
          <span>Tareas hechas: {summary.doneTasks}</span>
          <span>Pendientes: {summary.pendingTasks}</span>
        </div>
      </div>

      {slices.length > 0 && (
        <div className="cc-surface rounded-[24px] p-5">
          <p className="text-[12px] font-bold text-cc-primary mb-1">
            ¿En qué se va el tiempo?
          </p>
          <p className="text-[10px] font-semibold text-cc-secondary mb-4">{periodCaption}</p>
          <DonutChart
            slices={slices}
            centerValue={formatDurationHours(summary.totalMinutes)}
            centerLabel="Total"
          />
          <ul className="mt-4 space-y-2">
            {summary.byCategory.map(c => (
              <li key={c.name} className="flex justify-between text-[12px]">
                <span className="flex items-center gap-2 text-cc-primary">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </span>
                <span className="font-semibold text-cc-secondary">
                  {formatDuration(c.minutes)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.byMember.length > 0 && (
        <div className="cc-surface rounded-[24px] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#6366F1]" />
            <p className="text-[12px] font-bold text-cc-primary">Por miembro</p>
          </div>
          <p className="text-[10px] font-semibold text-cc-secondary mb-4">{periodCaption}</p>
          <div className="space-y-3">
            {summary.byMember.map(member => (
              <div key={member.userId}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="font-medium text-cc-primary">{member.name}</span>
                  <span className="font-bold text-cc-primary">
                    {formatDuration(member.minutes)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full cc-track overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#8B5CF6]"
                    style={{ width: `${member.percent}%` }}
                  />
                </div>
                <p className="text-[10px] text-cc-muted mt-0.5">{member.percent}% del periodo</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.activeGoals.length > 0 && (
        <div className="cc-surface rounded-[24px] p-5">
          <p className="text-[12px] font-bold text-cc-primary mb-3">Metas activas</p>
          <div className="space-y-3">
            {summary.activeGoals.map(goal => (
              <div key={goal.id}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="font-medium text-cc-primary truncate">{goal.title}</span>
                  <span className="text-cc-secondary shrink-0 ml-2">{goal.percent}%</span>
                </div>
                <div className="h-2 rounded-full cc-track overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#6366F1]"
                    style={{ width: `${goal.percent}%` }}
                  />
                </div>
                {goal.nextMilestoneTitle && goal.daysToNextMilestone !== null && (
                  <p className="text-[10px] text-[#6366F1] font-medium mt-1">
                    Próximo: {goal.nextMilestoneTitle}
                    {goal.daysToNextMilestone >= 0
                      ? ` · en ${goal.daysToNextMilestone} días`
                      : ` · vencido hace ${Math.abs(goal.daysToNextMilestone)} días`}
                  </p>
                )}
                {!goal.nextMilestoneTitle && goal.estimatedRemainingMinutes > 0 && (
                  <p className="text-[10px] text-cc-muted mt-1">
                    Faltan {formatDuration(goal.estimatedRemainingMinutes)} de acciones
                  </p>
                )}
              </div>
            ))}
          </div>
          <Link
            href="/tiempo/metas"
            className="block text-center text-[12px] font-semibold text-[#6366F1] mt-4"
          >
            Ver todas las metas →
          </Link>
        </div>
      )}

      {summary.totalMinutes === 0 && (
        <div className="cc-surface rounded-[24px] p-6 text-center">
          <p className="text-[13px] text-cc-secondary">
            Registra bloques fijos, tiempo puntual o tareas para ver tu semana.
          </p>
          <Link
            href="/tiempo/nuevo"
            className="inline-block mt-3 text-[13px] font-bold text-[#6366F1]"
          >
            Añadir primer registro →
          </Link>
        </div>
      )}
    </div>
  )
}
