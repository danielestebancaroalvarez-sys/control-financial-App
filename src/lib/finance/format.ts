import type { CurrencyCode } from '@/lib/household/types'
import type { Period } from './types'

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
