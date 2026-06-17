import {
  formatChartPeriodCaption,
  formatShortDate,
  getPeriodRangeAtOffset,
  getTodayString,
} from '@/lib/finance/format'

export { formatChartPeriodCaption, formatShortDate, getPeriodRangeAtOffset, getTodayString }

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatDurationHours(minutes: number): string {
  const hours = Math.round((minutes / 60) * 10) / 10
  return `${hours}h`
}

export function parseDurationInput(value: string): number | null {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null

  const hoursMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*h(?:\s*(\d+)\s*m?)?$/)
  if (hoursMatch) {
    const h = parseFloat(hoursMatch[1])
    const m = hoursMatch[2] ? parseInt(hoursMatch[2], 10) : 0
    return Math.round(h * 60 + m)
  }

  const minutesOnly = parseInt(trimmed, 10)
  if (!Number.isNaN(minutesOnly) && minutesOnly > 0) return minutesOnly

  return null
}

export function getTimeWeekLabel(offset = 0): string {
  const { start, end } = getPeriodRangeAtOffset('weekly', offset)
  if (offset === 0) return 'Semana actual'
  if (offset === 1) return 'Semana anterior'
  return `${formatShortDate(start)} – ${formatShortDate(end)}`
}
