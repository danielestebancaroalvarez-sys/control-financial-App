'use client'

import Link from 'next/link'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { formatTimeRange } from '@/lib/time/format'
import { DAY_HEADER_COLORS } from '@/lib/time/task-icons'
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

const TASK_CHIP_HEIGHT = 22

function eventBorderStyle(source: ScheduleEvent['source']) {
  if (source === 'block') return 'solid'
  if (source === 'task') return 'double'
  return 'dashed'
}

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

  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden border border-[var(--cc-border)] bg-[var(--cc-surface)] shadow-sm">
        <div className="max-h-[58vh] overflow-y-auto scrollbar-none overscroll-contain">
          <div className="min-w-full">
            {/* Day headers */}
            <div className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] gap-1 px-1 pt-2 pb-1 sticky top-0 z-30 bg-[var(--cc-surface)]">
              <div />
              {days.map((day, i) => {
                const isToday = isTodayInRange(day.date, periodStart, periodEnd)
                const palette = DAY_HEADER_COLORS[i]
                return (
                  <div
                    key={day.date}
                    className="rounded-xl py-1.5 text-center"
                    style={{
                      backgroundColor: isToday ? palette.accent : palette.bg,
                      color: isToday ? '#fff' : palette.text,
                    }}
                  >
                    <p className="text-[9px] font-bold uppercase leading-none opacity-90">
                      {day.short.split(' ')[0]}
                    </p>
                    <p className="text-[13px] font-bold leading-tight mt-0.5">
                      {day.short.split(' ')[1]}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Task chips row (due today, no specific hour) */}
            <div className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] gap-1 px-1 pb-1">
              <div />
              {days.map(day => {
                const dayTasks = filtered.filter(
                  e =>
                    e.date === day.date &&
                    e.source === 'task' &&
                    !e.startTime
                )
                return (
                  <div key={`tasks-${day.date}`} className="space-y-0.5 min-h-[4px]">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center gap-0.5 rounded-md px-1 py-0.5 truncate"
                        style={{
                          backgroundColor: `${task.categoryColor}30`,
                          borderLeft: `2px solid ${task.categoryColor}`,
                        }}
                        title={task.title}
                      >
                        <CategoryIcon
                          icon={task.categoryIcon}
                          className="w-2.5 h-2.5 shrink-0"
                        />
                        <span className="text-[7px] font-bold text-cc-primary truncate">
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] gap-1 px-1 pb-2">
              <div className="relative sticky left-0 z-20 bg-[var(--cc-surface)]" style={{ height: gridHeight }}>
                {hours.map((h, i) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 flex items-start justify-end pr-1"
                    style={{ top: i * SCHEDULE_SLOT_HEIGHT, height: SCHEDULE_SLOT_HEIGHT }}
                  >
                    <span
                      className={`text-[10px] font-semibold tabular-nums leading-none ${
                        h % 3 === 0 ? 'text-cc-secondary' : 'text-cc-muted/60'
                      }`}
                    >
                      {String(h).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {days.map((day, dayIndex) => {
                const isToday = isTodayInRange(day.date, periodStart, periodEnd)
                const palette = DAY_HEADER_COLORS[dayIndex]
                const dayEvents = filtered.filter(
                  e => e.date === day.date && (e.source !== 'task' || e.startTime)
                )

                return (
                  <div
                    key={day.date}
                    className="relative rounded-xl overflow-hidden"
                    style={{
                      height: gridHeight,
                      backgroundColor: isToday ? `${palette.accent}08` : `${palette.bg}80`,
                    }}
                  >
                    {hours.map((_, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0 border-t border-black/[0.04] dark:border-white/[0.06]"
                        style={{ top: i * SCHEDULE_SLOT_HEIGHT }}
                      />
                    ))}

                    {isToday && nowOffset !== null && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ top: nowOffset }}
                      >
                        <div className="border-t-2 border-[#6366F1]" />
                        <div className="absolute -left-0.5 -top-1 w-2 h-2 rounded-full bg-[#6366F1]" />
                      </div>
                    )}

                    {dayEvents.map(event => {
                      const top =
                        event.startTime
                          ? eventTopOffset(event.startTime)
                          : TASK_CHIP_HEIGHT
                      const height = eventHeight(
                        event.startTime,
                        event.endTime,
                        event.durationMinutes
                      )
                      const borderStyle = eventBorderStyle(event.source)
                      const minH = event.source === 'task' ? 28 : 20

                      return (
                        <div
                          key={event.id}
                          className="absolute left-1 right-1 rounded-lg px-1 py-0.5 overflow-hidden z-10 shadow-sm"
                          style={{
                            top,
                            height: Math.max(height, minH),
                            backgroundColor: `${event.categoryColor}40`,
                            borderLeft: `3px ${borderStyle} ${event.categoryColor}`,
                            boxShadow: `0 1px 4px ${event.categoryColor}22`,
                          }}
                          title={`${event.title}${event.startTime ? ` · ${formatTimeRange(event.startTime, event.endTime)}` : ''}`}
                        >
                          <p className="text-[8px] font-bold text-cc-primary truncate leading-tight">
                            {event.title}
                          </p>
                          {height >= 28 && event.startTime && (
                            <p className="text-[7px] text-cc-secondary truncate">
                              {formatTimeRange(event.startTime, event.endTime)}
                            </p>
                          )}
                        </div>
                      )
                    })}

                    <Link
                      href={`/tiempo/nuevo?date=${day.date}${userId ? `&user=${userId}` : ''}`}
                      className="absolute inset-0 z-0"
                      aria-label={`Añadir actividad el ${day.label}`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <section className="cc-surface rounded-[16px] p-3 space-y-2">
        <p className="text-[10px] font-bold text-cc-secondary">Leyenda</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-cc-muted">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-l-[3px] border-solid border-[#6366F1] bg-[#6366F1]/25" />
            Bloque fijo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-l-[3px] border-dashed border-[#6366F1] bg-[#6366F1]/25" />
            Tiempo registrado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-l-[3px] border-double border-[#EC4899] bg-[#EC4899]/25" />
            Tarea
          </span>
        </div>
      </section>
    </div>
  )
}
