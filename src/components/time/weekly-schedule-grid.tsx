'use client'

import Link from 'next/link'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { formatTimeRange } from '@/lib/time/format'
import {
  SCHEDULE_HOUR_END,
  SCHEDULE_HOUR_START,
  SCHEDULE_SLOT_HEIGHT,
  eventHeight,
  eventTopOffset,
  getWeekDayLabels,
  type ScheduleEvent,
} from '@/lib/time/schedule'

export function WeeklyScheduleGrid({
  periodStart,
  events,
  userId,
}: {
  periodStart: string
  events: ScheduleEvent[]
  userId: string | null
}) {
  const days = getWeekDayLabels(periodStart)
  const hours = Array.from(
    { length: SCHEDULE_HOUR_END - SCHEDULE_HOUR_START + 1 },
    (_, i) => SCHEDULE_HOUR_START + i
  )
  const gridHeight = hours.length * SCHEDULE_SLOT_HEIGHT

  const filtered = userId
    ? events.filter(e => e.userId === userId)
    : events

  const timedEvents = filtered.filter(e => e.startTime)
  const untimedByDay = days.map(day => ({
    ...day,
    events: filtered.filter(e => e.date === day.date && !e.startTime),
  }))

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-1 px-1 scrollbar-none">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[2.5rem_repeat(7,1fr)] gap-1 mb-1">
            <div />
            {days.map(day => (
              <div
                key={day.date}
                className="text-center text-[10px] font-bold text-cc-secondary"
              >
                {day.label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[2.5rem_repeat(7,1fr)] gap-1">
            <div className="relative" style={{ height: gridHeight }}>
              {hours.map((h, i) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 text-[9px] text-cc-muted text-right pr-1"
                  style={{ top: i * SCHEDULE_SLOT_HEIGHT - 6 }}
                >
                  {h}h
                </div>
              ))}
            </div>

            {days.map(day => (
              <div
                key={day.date}
                className="relative rounded-xl cc-surface-muted border border-[var(--cc-border)]"
                style={{ height: gridHeight }}
              >
                {hours.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-[var(--cc-border)]/40"
                    style={{ top: i * SCHEDULE_SLOT_HEIGHT }}
                  />
                ))}

                {timedEvents
                  .filter(e => e.date === day.date)
                  .map(event => {
                    const top = eventTopOffset(event.startTime)
                    const height = eventHeight(
                      event.startTime,
                      event.endTime,
                      event.durationMinutes
                    )
                    return (
                      <div
                        key={event.id}
                        className="absolute left-0.5 right-0.5 rounded-lg px-1 py-0.5 overflow-hidden z-10"
                        style={{
                          top,
                          height,
                          backgroundColor: `${event.categoryColor}33`,
                          borderLeft: `3px solid ${event.categoryColor}`,
                        }}
                        title={`${event.title} · ${formatTimeRange(event.startTime, event.endTime)}`}
                      >
                        <p className="text-[9px] font-bold text-cc-primary truncate leading-tight">
                          {event.title}
                        </p>
                        <p className="text-[8px] text-cc-secondary truncate">
                          {formatTimeRange(event.startTime, event.endTime)}
                        </p>
                      </div>
                    )
                  })}

                <Link
                  href={`/tiempo/nuevo?date=${day.date}`}
                  className="absolute inset-0 z-0"
                  aria-label={`Añadir actividad el ${day.label}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {untimedByDay.some(d => d.events.length > 0) && (
        <section className="cc-surface rounded-[20px] p-3 space-y-2">
          <h3 className="text-[11px] font-bold text-cc-secondary">Sin hora definida</h3>
          {untimedByDay
            .filter(d => d.events.length > 0)
            .map(day => (
              <div key={day.date}>
                <p className="text-[10px] font-semibold text-cc-muted mb-1">{day.label}</p>
                <ul className="space-y-1">
                  {day.events.map(event => (
                    <li
                      key={event.id}
                      className="flex items-center gap-2 text-[11px] text-cc-primary"
                    >
                      <CategoryIcon icon={event.categoryIcon} className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{event.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      )}
    </div>
  )
}
