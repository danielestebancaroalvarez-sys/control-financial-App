'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, List } from 'lucide-react'
import { WeeklyScheduleGrid } from '@/components/time/weekly-schedule-grid'
import { formatChartPeriodCaption } from '@/lib/time/format'
import type { TimeBlock } from '@/lib/time/types'
import type { ScheduleEvent } from '@/lib/time/schedule'
import type { HouseholdMember } from '@/lib/household/types'
import { TiempoFijosClient } from '../fijos/tiempo-fijos-client'

function WeekSelector({ activeOffset }: { activeOffset: number }) {
  const blocks = Array.from({ length: 6 }, (_, offset) => ({
    offset,
    label: offset === 0 ? 'Actual' : offset === 1 ? 'Anterior' : `-${offset}`,
    href: offset === 0 ? '/tiempo/horario' : `/tiempo/horario?block=${offset}`,
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

  const periodCaption = useMemo(() => {
    const label =
      periodOffset === 0
        ? 'Semana actual'
        : periodOffset === 1
          ? 'Semana anterior'
          : 'Semana'
    return formatChartPeriodCaption(label, periodStart, periodEnd)
  }, [periodOffset, periodStart, periodEnd])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-cc-primary flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-[#6366F1]" />
          Horario
        </h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">{periodCaption}</p>
      </div>

      <WeekSelector activeOffset={periodOffset} />

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {members.map(member => {
          const active = activeUserId === member.user_id
          return (
            <button
              key={member.user_id}
              type="button"
              onClick={() => setActiveUserId(member.user_id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                active
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white'
                  : 'cc-surface-muted text-cc-secondary'
              }`}
            >
              {member.full_name ?? 'Miembro'}
            </button>
          )
        })}
      </div>

      <WeeklyScheduleGrid
        periodStart={periodStart}
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
