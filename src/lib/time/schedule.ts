import { addTimeFrequency, subtractTimeFrequency } from './frequency'
import type { TimeBlock, TimeEntry, TimeFrequency } from './types'

export type ScheduleEventSource = 'block' | 'entry'

export type ScheduleEvent = {
  id: string
  source: ScheduleEventSource
  sourceId: string
  title: string
  date: string
  startTime: string | null
  endTime: string | null
  durationMinutes: number
  categoryName: string
  categoryColor: string
  categoryIcon: string | null
  userId: string | null
}

export function expandBlockOccurrencesInRange(
  anchorDate: string,
  frequency: TimeFrequency,
  rangeStart: string,
  rangeEnd: string
): string[] {
  let date = anchorDate
  let guard = 0

  while (date > rangeStart && guard < 400) {
    const prev = subtractTimeFrequency(date, frequency)
    if (prev === date) break
    date = prev
    guard++
  }

  while (date < rangeStart && guard < 400) {
    date = addTimeFrequency(date, frequency)
    guard++
  }

  const dates: string[] = []
  while (date <= rangeEnd && guard < 400) {
    dates.push(date)
    date = addTimeFrequency(date, frequency)
    guard++
  }

  return dates
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

export function minutesToTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function getWeekDayLabels(startDate: string): { date: string; label: string; short: string }[] {
  const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  const fullDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const result: { date: string; label: string; short: string }[] = []
  const d = new Date(startDate + 'T12:00:00')
  for (let i = 0; i < 7; i++) {
    const date = new Date(d)
    date.setDate(d.getDate() + i)
    const y = date.getFullYear()
    const mo = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${y}-${mo}-${day}`
    result.push({
      date: dateStr,
      label: `${fullDays[date.getDay()]} ${day}`,
      short: `${days[date.getDay()]} ${day}`,
    })
  }
  return result
}

export const SCHEDULE_HOUR_START = 0
export const SCHEDULE_HOUR_END = 23
export const SCHEDULE_SLOT_HEIGHT = 32

export function getCurrentTimeOffset(slotHeight = SCHEDULE_SLOT_HEIGHT): number | null {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = SCHEDULE_HOUR_START * 60
  const endMinutes = (SCHEDULE_HOUR_END + 1) * 60
  if (minutes < startMinutes || minutes > endMinutes) return null
  return ((minutes - startMinutes) / 60) * slotHeight
}

export function eventTopOffset(startTime: string | null, slotHeight = SCHEDULE_SLOT_HEIGHT): number {
  if (!startTime) return 0
  const minutes = timeToMinutes(startTime)
  const startMinutes = SCHEDULE_HOUR_START * 60
  const offsetMinutes = Math.max(0, minutes - startMinutes)
  return (offsetMinutes / 60) * slotHeight
}

export function eventHeight(
  startTime: string | null,
  endTime: string | null,
  durationMinutes: number,
  slotHeight = SCHEDULE_SLOT_HEIGHT
): number {
  if (startTime && endTime) {
    let start = timeToMinutes(startTime)
    let end = timeToMinutes(endTime)
    if (end <= start) end += 24 * 60
    const hours = (end - start) / 60
    return Math.max(slotHeight * 0.5, hours * slotHeight)
  }
  const hours = durationMinutes / 60
  return Math.max(slotHeight * 0.5, hours * slotHeight)
}

export function isTodayInRange(dateStr: string, rangeStart: string, rangeEnd: string): boolean {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const todayStr = `${y}-${m}-${d}`
  return todayStr >= rangeStart && todayStr <= rangeEnd && dateStr === todayStr
}

export function buildWeeklyScheduleEvents(
  blocks: TimeBlock[],
  entries: TimeEntry[],
  rangeStart: string,
  rangeEnd: string
): ScheduleEvent[] {
  const events: ScheduleEvent[] = []

  for (const block of blocks) {
    const dates = expandBlockOccurrencesInRange(
      block.anchorDate,
      block.frequency as TimeFrequency,
      rangeStart,
      rangeEnd
    )
    for (const date of dates) {
      events.push({
        id: `block-${block.id}-${date}`,
        source: 'block',
        sourceId: block.id,
        title: block.title,
        date,
        startTime: block.startTime,
        endTime: block.endTime,
        durationMinutes: block.durationMinutes,
        categoryName: block.categoryName,
        categoryColor: block.categoryColor ?? '#6366F1',
        categoryIcon: block.categoryIcon,
        userId: block.assignedTo,
      })
    }
  }

  for (const entry of entries) {
    if (entry.entryDate < rangeStart || entry.entryDate > rangeEnd) continue
    events.push({
      id: `entry-${entry.id}`,
      source: 'entry',
      sourceId: entry.id,
      title: entry.title,
      date: entry.entryDate,
      startTime: entry.startTime,
      endTime: entry.endTime,
      durationMinutes: entry.durationMinutes,
      categoryName: entry.categoryName,
      categoryColor: entry.categoryColor ?? '#6366F1',
      categoryIcon: entry.categoryIcon,
      userId: entry.userId,
    })
  }

  return events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    const ta = a.startTime ?? '99:99'
    const tb = b.startTime ?? '99:99'
    return ta.localeCompare(tb)
  })
}
