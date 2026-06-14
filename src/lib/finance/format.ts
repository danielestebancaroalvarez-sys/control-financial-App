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

export function getPeriodRange(period: Period): { start: string; end: string } {
  return period === 'weekly' ? getCurrentWeekRange() : getCurrentMonthRange()
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

export function daysInCurrentMonth(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

export function dayOfMonth(): number {
  return new Date().getDate()
}
