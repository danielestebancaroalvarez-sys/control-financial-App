import type { CurrencyCode } from '@/lib/household/types'
import type { Period } from './types'

export type PeriodLabels = {
  noun: string
  current: string
  next: string
  view: string
  ofPeriod: string
  inNext: string
}

export function getPeriodLabels(period: Period): PeriodLabels {
  if (period === 'weekly') {
    return {
      noun: 'semana',
      current: 'esta semana',
      next: 'próxima semana',
      view: 'Semanal',
      ofPeriod: 'de la semana',
      inNext: 'la próxima semana',
    }
  }
  return {
    noun: 'mes',
    current: 'este mes',
    next: 'próximo mes',
    view: 'Mensual',
    ofPeriod: 'del mes',
    inNext: 'el próximo mes',
  }
}

export function getNextPeriodRange(period: Period): { start: string; end: string } {
  const { start, end } = getPeriodRange(period)
  if (period === 'weekly') {
    const nextStart = new Date(`${start}T12:00:00`)
    nextStart.setDate(nextStart.getDate() + 7)
    const nextEnd = new Date(nextStart)
    nextEnd.setDate(nextStart.getDate() + 6)
    return { start: toDateString(nextStart), end: toDateString(nextEnd) }
  }

  const currentEnd = new Date(`${end}T12:00:00`)
  const nextStart = new Date(currentEnd)
  nextStart.setDate(currentEnd.getDate() + 1)
  const nextEnd = new Date(nextStart.getFullYear(), nextStart.getMonth() + 1, 0)
  return { start: toDateString(nextStart), end: toDateString(nextEnd) }
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'COP' ? 0 : 2,
    maximumFractionDigits: currency === 'COP' ? 0 : 2,
  }).format(amount)
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: toDateString(start),
    end: toDateString(end),
  }
}

export function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const start = new Date(now)
  start.setDate(now.getDate() + diff)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: toDateString(start), end: toDateString(end) }
}

export function getLastWeekRange(): { start: string; end: string } {
  const { start } = getCurrentWeekRange()
  const weekStart = new Date(`${start}T12:00:00`)
  weekStart.setDate(weekStart.getDate() - 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return { start: toDateString(weekStart), end: toDateString(weekEnd) }
}

export function getLastMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 0)
  return { start: toDateString(start), end: toDateString(end) }
}

export type SearchDatePreset =
  | 'this-week'
  | 'last-week'
  | 'this-month'
  | 'last-month'
  | 'period'

export function getSearchPresetRange(
  preset: SearchDatePreset,
  period: Period
): { start: string; end: string } {
  switch (preset) {
    case 'this-week':
      return getCurrentWeekRange()
    case 'last-week':
      return getLastWeekRange()
    case 'this-month':
      return getCurrentMonthRange()
    case 'last-month':
      return getLastMonthRange()
    case 'period':
    default:
      return getPeriodRange(period)
  }
}

export function getPeriodRange(period: Period): { start: string; end: string } {
  return getPeriodRangeAtOffset(period, 0)
}

export function getPeriodRangeAtOffset(
  period: Period,
  offset: number
): { start: string; end: string } {
  const safeOffset = Math.max(0, Math.floor(offset))

  if (period === 'weekly') {
    const day = new Date().getDay()
    const diff = day === 0 ? -6 : 1 - day
    const start = new Date()
    start.setDate(start.getDate() + diff - safeOffset * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start: toDateString(start), end: toDateString(end) }
  }

  const now = new Date()
  const mStart = new Date(now.getFullYear(), now.getMonth() - safeOffset, 1)
  const mEnd = new Date(now.getFullYear(), now.getMonth() - safeOffset + 1, 0)
  return { start: toDateString(mStart), end: toDateString(mEnd) }
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export function getPeriodBlockLabel(
  period: Period,
  offset: number,
  start: string,
  end: string
): string {
  if (offset === 0) return period === 'weekly' ? 'Actual' : 'Actual'
  if (offset === 1) return period === 'weekly' ? 'Anterior' : 'Anterior'
  if (period === 'weekly') {
    return `${formatShortDate(start)}`
  }
  const d = new Date(`${start}T12:00:00`)
  return d.toLocaleDateString('es', { month: 'short', year: '2-digit' })
}

export function listPeriodBlocks(period: Period, count = 8) {
  return Array.from({ length: count }, (_, offset) => {
    const { start, end } = getPeriodRangeAtOffset(period, offset)
    return {
      offset,
      start,
      end,
      label: getPeriodBlockLabel(period, offset, start, end),
    }
  })
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getTodayString(): string {
  return toDateString(new Date())
}

export function getPeriodProgress(period: Period): {
  elapsed: number
  total: number
  start: string
  end: string
} {
  const { start, end } = getPeriodRange(period)
  const today = getTodayString()

  if (period === 'weekly') {
    const startMs = new Date(`${start}T12:00:00`).getTime()
    const todayMs = new Date(`${today}T12:00:00`).getTime()
    const elapsed = Math.floor((todayMs - startMs) / 86400000) + 1
    return {
      elapsed: Math.min(7, Math.max(1, elapsed)),
      total: 7,
      start,
      end,
    }
  }

  return {
    elapsed: dayOfMonth(),
    total: daysInCurrentMonth(),
    start,
    end,
  }
}

export function getPreviousPeriodRanges(
  period: Period,
  count = 3
): { start: string; end: string }[] {
  const ranges: { start: string; end: string }[] = []
  const now = new Date()

  for (let i = 1; i <= count; i++) {
    if (period === 'weekly') {
      const day = now.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() + diff - i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      ranges.push({
        start: toDateString(weekStart),
        end: toDateString(weekEnd),
      })
    } else {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      ranges.push({ start: toDateString(mStart), end: toDateString(mEnd) })
    }
  }

  return ranges
}

export function addFrequency(
  dateStr: string,
  frequency: 'weekly' | 'biweekly' | 'monthly'
): string {
  const d = new Date(dateStr + 'T12:00:00')
  if (frequency === 'weekly') d.setDate(d.getDate() + 7)
  else if (frequency === 'biweekly') d.setDate(d.getDate() + 14)
  else d.setMonth(d.getMonth() + 1)
  return toDateString(d)
}

export function formatFrequency(
  frequency: string,
  occurrences = 1
): string {
  const labels: Record<string, string> = {
    weekly: 'semanal',
    biweekly: 'quincenal',
    monthly: 'mensual',
  }
  const label = labels[frequency] ?? frequency
  return occurrences > 1 ? `${occurrences} pagos` : label
}

export function daysInCurrentMonth(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

export function dayOfMonth(): number {
  return new Date().getDate()
}
