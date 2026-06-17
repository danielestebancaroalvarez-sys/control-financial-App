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
  getCurrentTimeOffset,
  getWeekDayLabels,
  isTodayInRange,
  type ScheduleEvent,
} from '@/lib/time/schedule'

export function WeeklyScheduleGrid({
  periodStart,
  periodEnd,
  events,
  userId,
}: {
  periodStart: string
  periodEnd: string
  events: ScheduleEvent[]
  userId: string | null
}) {
  const days = getWeekDayLabels(periodStart)
  const hours = Array.from(
    { length: SCHEDULE_HOUR_END - SCHEDULE_HOUR_START + 1 },
    (_, i) => SCHEDULE_HOUR_START + i
  )
  const gridHeight = hours.length * SCHEDULE_SLOT_HEIGHT
  const nowOffset = getCurrentTimeOffset()

  const filtered = userId ? events.filter(e => e.userId === userId) : events
  const timedEvents = filtered.filter(e => e.startTime)
  const untimedByDay = days.map(day => ({
    ...day,
    events: filtered.filter(e => e.date === day.date && !e.startTime),
  }))

  return (
    <div className="space-y-3">
      <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-[var(--cc-border)]">
        <div className="w-full">
          <div className="grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] gap-px sticky top-0 z-20 bg-[var(--cc-surface)]">
            <div />
            {days.map(day => (
              <div
                key={day.date}
                className="text-center text-[9px] font-bold text-cc-secondary py-1"
              >
                {day.short}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] gap-px">
            <div className="relative" style={{ height: gridHeight }}>
              {hours.map((h, i) =>
                h % 2 === 0 ? (
                  <div
                    key={h}
                    className="absolute left-0 right-0 text-[8px] text-cc-muted text-right pr-0.5"
                    style={{ top: i * SCHEDULE_SLOT_HEIGHT - 5 }}
                  >
                    {String(h).padStart(2, '0')}
                  </div>
                ) : null
              )}
            </div>

            {days.map(day => {
              const isToday = isTodayInRange(day.date, periodStart, periodEnd)
              return (
                <div
                  key={day.date}
                  className={`relative cc-surface-muted ${isToday ? 'ring-1 ring-[#6366F1]/40' : ''}`}
                  style={{ height: gridHeight }}
                >
                  {hours.map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 border-t border-[var(--cc-border)]/30"
                      style={{ top: i * SCHEDULE_SLOT_HEIGHT }}
                    />
                  ))}

                  {isToday && nowOffset !== null && (
                    <div
                      className="absolute left-0 right-0 z-20 border-t-2 border-[#6366F1] pointer-events-none"
                      style={{ top: nowOffset }}
                    />
                  )}

                  {timedEvents
                    .filter(e => e.date === day.date)
                    .map(event => {
                      const top = eventTopOffset(event.startTime)
                      const height = eventHeight(
                        event.startTime,
                        event.endTime,
                        event.durationMinutes
                      )
                      const borderStyle =
                        event.source === 'block' ? 'solid' : 'dashed'
                      return (
                        <div
                          key={event.id}
                          className="absolute left-px right-px rounded px-0.5 py-px overflow-hidden z-10"
                          style={{
                            top,
                            height,
                            backgroundColor: `${event.categoryColor}33`,
                            borderLeft: `2px ${borderStyle} ${event.categoryColor}`,
                          }}
                          title={`${event.title} · ${formatTimeRange(event.startTime, event.endTime)}`}
                        >
                          <p className="text-[8px] font-bold text-cc-primary truncate leading-tight">
                            {event.title}
                          </p>
                        </div>
                      )
                    })}

                  <Link
                    href={`/tiempo/nuevo?tipo=tiempo&date=${day.date}${userId ? `&user=${userId}` : ''}`}
                    className="absolute inset-0 z-0"
                    aria-label={`Añadir actividad el ${day.label}`}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <section className="cc-surface rounded-[16px] p-3 space-y-1.5">
        <p className="text-[10px] font-bold text-cc-secondary">Leyenda</p>
        <p className="text-[10px] text-cc-muted">
          Desliza verticalmente para ver todo el día (00:00–24:00). Borde sólido = bloque
          recurrente; punteado = registro puntual.
        </p>
        <div className="flex gap-3 text-[9px] text-cc-muted">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-l-2 border-solid border-[#6366F1] bg-[#6366F1]/20" />
            Bloque fijo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-l-2 border-dashed border-[#6366F1] bg-[#6366F1]/20" />
            Registro puntual
          </span>
        </div>
      </section>

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
