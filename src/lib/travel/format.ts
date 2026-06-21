export {
  formatMoney,
  formatSavingsTimeRemaining,
  getTodayString,
} from '@/lib/finance/format'

export function formatShortDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
  })
}

export function daysUntilDate(dateStr: string | null): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateStr}T12:00:00`)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function countTripDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1)
}
