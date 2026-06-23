'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarClock, Repeat } from 'lucide-react'
import { UserAvatar } from '@/components/profile/user-avatar'
import { WeekSelector } from '@/components/time/week-selector'
import { WeeklyScheduleGrid } from '@/components/time/weekly-schedule-grid'
import { formatChartPeriodCaption } from '@/lib/time/format'
import type { ScheduleEvent } from '@/lib/time/schedule'
import type { HouseholdMember } from '@/lib/household/types'

export function TiempoHorarioClient({
  periodStart,
  periodEnd,
  events,
  members,
  periodOffset,
  maxWeekOffset = 0,
  currentUserId,
}: {
  periodStart: string
  periodEnd: string
  events: ScheduleEvent[]
  members: HouseholdMember[]
  periodOffset: number
  maxWeekOffset?: number
  currentUserId: string
}) {
  const [activeUserId, setActiveUserId] = useState(currentUserId)

  const periodCaption = formatChartPeriodCaption(
    periodOffset === 0
      ? 'Semana actual'
      : periodOffset === 1
        ? 'Semana anterior'
        : 'Semana',
    periodStart,
    periodEnd
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-cc-primary flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[#6366F1]" />
            Horario
          </h1>
          <p className="text-[12px] text-cc-secondary mt-0.5">
            Tu semana de un vistazo. Cambia de persona para ver el horario de cada miembro.
          </p>
        </div>
        <Link
          href="/tiempo/buscar?tab=fijos"
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl cc-surface-muted text-[11px] font-bold text-[#6366F1]"
        >
          <Repeat className="w-3.5 h-3.5" />
          Fijos
        </Link>
      </div>

      <p className="text-[10px] text-cc-muted">{periodCaption}</p>

      <WeekSelector
        activeOffset={periodOffset}
        basePath="/tiempo/horario"
        maxOffset={maxWeekOffset}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {members.map(member => {
          const active = activeUserId === member.user_id
          return (
            <button
              key={member.user_id}
              type="button"
              onClick={() => setActiveUserId(member.user_id)}
              className={`shrink-0 flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                active
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white'
                  : 'cc-surface-muted text-cc-secondary'
              }`}
            >
              <UserAvatar
                name={member.full_name ?? 'Miembro'}
                avatarUrl={member.avatar_url}
                size="sm"
                className={active ? 'ring-white/40' : ''}
              />
              <span className="max-w-[6rem] truncate">
                {member.full_name?.split(' ')[0] ?? 'Miembro'}
              </span>
            </button>
          )
        })}
      </div>

      <WeeklyScheduleGrid
        periodStart={periodStart}
        periodEnd={periodEnd}
        events={events}
        userId={activeUserId}
      />

      <Link
        href="/tiempo/nuevo"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[13px] font-bold"
      >
        Añadir actividad
      </Link>
    </div>
  )
}
