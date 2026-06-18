'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarClock, List } from 'lucide-react'
import { UserAvatar } from '@/components/profile/user-avatar'
import { WeekSelector } from '@/components/time/week-selector'
import { WeeklyScheduleGrid } from '@/components/time/weekly-schedule-grid'
import { formatChartPeriodCaption } from '@/lib/time/format'
import type { TimeBlock } from '@/lib/time/types'
import type { ScheduleEvent } from '@/lib/time/schedule'
import type { HouseholdMember } from '@/lib/household/types'
import { TiempoFijosClient } from '../fijos/tiempo-fijos-client'

export function TiempoHorarioClient({
  periodStart,
  periodEnd,
  events,
  blocks,
  members,
  householdId,
  periodOffset,
  currentUserId,
}: {
  periodStart: string
  periodEnd: string
  events: ScheduleEvent[]
  blocks: TimeBlock[]
  members: HouseholdMember[]
  householdId: string
  periodOffset: number
  currentUserId: string
}) {
  const [activeUserId, setActiveUserId] = useState(currentUserId)
  const [showBlocks, setShowBlocks] = useState(false)

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
      <div>
        <h1 className="text-[20px] font-bold text-cc-primary flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-[#6366F1]" />
          Horario
        </h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">
          Tu semana de un vistazo. Cambia de persona para ver el horario de cada miembro.
        </p>
      </div>

      <p className="text-[10px] text-cc-muted">{periodCaption}</p>

      <WeekSelector activeOffset={periodOffset} basePath="/tiempo/horario" />

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

      <div className="flex gap-2">
        <Link
          href="/tiempo/nuevo"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[13px] font-bold"
        >
          Añadir actividad
        </Link>
        <button
          type="button"
          onClick={() => setShowBlocks(v => !v)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl cc-surface-muted text-[13px] font-bold text-cc-secondary"
        >
          <List className="w-4 h-4" />
          Bloques
        </button>
      </div>

      {showBlocks && (
        <TiempoFijosClient blocks={blocks} householdId={householdId} embedded />
      )}
    </div>
  )
}
