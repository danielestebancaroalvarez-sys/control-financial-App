'use client'

import Link from 'next/link'
import {
  BarChart3,
  Clock,
  Gamepad2,
  Moon,
  PieChart,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { DonutChart } from '@/components/dashboard/donut-chart'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { WeekSelector } from '@/components/time/week-selector'
import { UserAvatar } from '@/components/profile/user-avatar'
import {
  formatChartPeriodCaption,
  formatDuration,
  formatDurationHours,
} from '@/lib/time/format'
import { productivityScoreLabel } from '@/lib/time/productivity-metrics'
import type { TimeDashboardSummary } from '@/lib/time/types'
import type { SleepTrackerData } from '@/lib/time/sleep-queries'
import { SleepTracker } from '@/components/time/sleep-tracker'

export function TiempoDashboardClient({
  summary,
  periodOffset,
  householdName,
  householdId,
  sleepData,
}: {
  summary: TimeDashboardSummary
  periodOffset: number
  householdName: string
  householdId: string
  sleepData: SleepTrackerData
}) {
  const periodCaption = formatChartPeriodCaption(
    summary.periodLabel,
    summary.periodStart,
    summary.periodEnd
  )

  const generalSlices = summary.byCategory.map(c => ({
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
        <WeekSelector activeOffset={periodOffset} basePath="/tiempo" />
      </div>

      <SleepTracker householdId={householdId} data={sleepData} />

      {/* KPIs compactos */}
      <div className="grid grid-cols-2 gap-2">
        <div className="cc-surface rounded-[20px] p-3.5">
          <p className="text-[10px] font-bold text-cc-secondary uppercase tracking-wide">
            Registrado
          </p>
          <p className="text-[22px] font-bold text-[#4F46E5] mt-0.5">
            {formatDurationHours(summary.totalMinutes)}
          </p>
          <p className="text-[10px] text-cc-muted mt-0.5">en la semana</p>
        </div>
        <div className="cc-surface rounded-[20px] p-3.5">
          <p className="text-[10px] font-bold text-cc-secondary uppercase tracking-wide flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#6366F1]" />
            Productividad
          </p>
          <p className="text-[22px] font-bold text-[#6366F1] mt-0.5">
            {summary.productivityPercent}%
          </p>
          <p className="text-[10px] text-cc-muted mt-0.5">
            {formatDuration(summary.productivityMinutes)}
          </p>
        </div>
        <div className="cc-surface rounded-[20px] p-3.5">
          <p className="text-[10px] font-bold text-cc-secondary uppercase tracking-wide flex items-center gap-1">
            <Gamepad2 className="w-3 h-3 text-[#C4B5FD]" />
            Ocio
          </p>
          <p className="text-[22px] font-bold text-[#8B5CF6] mt-0.5">
            {summary.leisurePercent}%
          </p>
          <p className="text-[10px] text-cc-muted mt-0.5">
            {formatDuration(summary.leisureMinutes)}
          </p>
        </div>
        <div className="cc-surface rounded-[20px] p-3.5">
          <p className="text-[10px] font-bold text-cc-secondary uppercase tracking-wide flex items-center gap-1">
            <Moon className="w-3 h-3 text-[#4F46E5]" />
            Sueño
          </p>
          <p className="text-[22px] font-bold text-[#4F46E5] mt-0.5">
            {formatDuration(summary.sleepMinutes)}
          </p>
          <p className="text-[10px] text-cc-muted mt-0.5">
            Tareas: {summary.doneTasks} hechas · {summary.pendingTasks} pend.
          </p>
        </div>
      </div>

      {generalSlices.length > 0 && (
        <CollapsibleSection
          title="Distribución general"
          summary={`${summary.byCategory.length} categorías · incluye sueño`}
          icon={<PieChart className="w-4 h-4 text-[#6366F1]" />}
          defaultOpen
        >
          <p className="text-[10px] text-cc-secondary mb-3">{periodCaption}</p>
          <DonutChart
            slices={generalSlices}
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
        </CollapsibleSection>
      )}

      {summary.memberMetrics.length > 0 && (
        <CollapsibleSection
          title="Día típico por miembro (24 h)"
          summary={`${summary.memberMetrics.length} persona(s)`}
          icon={<Users className="w-4 h-4 text-[#6366F1]" />}
        >
          <p className="text-[10px] text-cc-secondary mb-4">
            Promedio diario de la semana. El gris es tiempo sin registrar.
          </p>
          <div className="space-y-6">
            {summary.memberMetrics.map(member => {
              const slices = member.dailyCategories.map(c => ({
                value: c.minutes,
                color: c.color,
                label: c.name,
              }))
              if (slices.length === 0) return null
              return (
                <div key={member.userId}>
                  <div className="flex items-center gap-2 mb-2">
                    <UserAvatar
                      name={member.name}
                      avatarUrl={member.avatarUrl}
                      size="sm"
                    />
                    <p className="text-[13px] font-bold text-cc-primary">{member.name}</p>
                  </div>
                  <DonutChart
                    slices={slices}
                    size={140}
                    stroke={18}
                    centerValue="24h"
                    centerLabel="día"
                  />
                </div>
              )
            })}
          </div>
        </CollapsibleSection>
      )}

      {summary.memberMetrics.length > 0 && (
        <CollapsibleSection
          title="Puntuación de productividad"
          summary={summary.memberMetrics
            .map(m => `${m.name.split(' ')[0]} ${m.productivityScore}`)
            .join(' · ')}
          icon={<TrendingUp className="w-4 h-4 text-[#6366F1]" />}
          defaultOpen
        >
          <p className="text-[10px] text-cc-secondary mb-4">
            Escala 0–100 según tiempo productivo, esfuerzo, sueño, tareas hechas y metas. Ocio
            resta puntos.
          </p>
          <div className="space-y-3">
            {summary.memberMetrics.map(member => (
              <div
                key={member.userId}
                className="flex items-center gap-3 p-3 rounded-2xl cc-surface-muted"
              >
                <UserAvatar
                  name={member.name}
                  avatarUrl={member.avatarUrl}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-cc-primary truncate">{member.name}</p>
                  <p className="text-[10px] text-cc-secondary">
                    {productivityScoreLabel(member.productivityScore)} ·{' '}
                    {member.doneTasks} tareas · {formatDuration(member.productivityMinutes)}{' '}
                    productivos
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="text-[26px] font-bold leading-none"
                    style={{
                      color:
                        member.productivityScore >= 70
                          ? '#059669'
                          : member.productivityScore >= 50
                            ? '#2563EB'
                            : '#F59E0B',
                    }}
                  >
                    {member.productivityScore}
                  </p>
                  <p className="text-[9px] text-cc-muted font-semibold">/ 100</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {summary.memberMetrics.length > 1 && (
        <CollapsibleSection
          title="Comparativa del hogar"
          summary="Productividad, esfuerzo y ocio"
          icon={<BarChart3 className="w-4 h-4 text-[#6366F1]" />}
        >
          <div className="space-y-4">
            {summary.memberMetrics.map(member => (
              <div key={member.userId} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={member.name}
                      avatarUrl={member.avatarUrl}
                      size="xs"
                    />
                    <span className="text-[12px] font-bold text-cc-primary">{member.name}</span>
                  </div>
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ color: '#2563EB' }}
                  >
                    {member.productivityScore} pts
                  </span>
                </div>
                <div className="space-y-1.5">
                  <MetricBar
                    label="Productividad"
                    value={member.productivityPercent}
                    detail={formatDuration(member.productivityMinutes)}
                    color="#2563EB"
                  />
                  <MetricBar
                    label="Esfuerzo"
                    value={Math.min(
                      100,
                      Math.round(
                        (member.effortMinutes / Math.max(member.totalMinutes, 1)) * 100
                      )
                    )}
                    detail={formatDuration(member.effortMinutes)}
                    color="#DC2626"
                    icon={<Zap className="w-3 h-3" />}
                  />
                  <MetricBar
                    label="Ocio"
                    value={member.leisurePercent}
                    detail={formatDuration(member.leisureMinutes)}
                    color="#F59E0B"
                  />
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {summary.byMember.length > 0 && (
        <CollapsibleSection
          title="Tiempo por miembro"
          summary={summary.byMember.map(m => m.name.split(' ')[0]).join(' · ')}
          icon={<Users className="w-4 h-4 text-[#6366F1]" />}
        >
          <div className="space-y-3">
            {summary.byMember.map(member => (
              <div key={member.userId}>
                <div className="flex justify-between items-center text-[12px] mb-1">
                  <span className="flex items-center gap-2 font-medium text-cc-primary">
                    <UserAvatar
                      name={member.name}
                      avatarUrl={member.avatarUrl}
                      size="xs"
                    />
                    {member.name}
                  </span>
                  <span className="font-bold text-cc-primary">
                    {formatDuration(member.minutes)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full cc-track overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${member.percent}%`, backgroundColor: '#2563EB' }}
                  />
                </div>
                <p className="text-[10px] text-cc-muted mt-0.5">{member.percent}% del periodo</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {summary.activeGoals.length > 0 && (
        <CollapsibleSection
          title="Metas activas"
          summary={`${summary.activeGoals.length} en curso`}
          icon={<Target className="w-4 h-4 text-[#6366F1]" />}
        >
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
                {goal.creatorName && (
                  <p className="text-[10px] text-cc-muted mt-1">De {goal.creatorName}</p>
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
        </CollapsibleSection>
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

function MetricBar({
  label,
  value,
  detail,
  color,
  icon,
}: {
  label: string
  value: number
  detail: string
  color: string
  icon?: React.ReactNode
}) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-0.5">
        <span className="flex items-center gap-1 text-cc-secondary font-medium">
          {icon}
          {label}
        </span>
        <span className="text-cc-muted">
          {value}% · {detail}
        </span>
      </div>
      <div className="h-1.5 rounded-full cc-track overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
