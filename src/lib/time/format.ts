import {
  formatChartPeriodCaption,
  formatShortDate,
  getPeriodOffsetForDate,
  getPeriodRangeAtOffset,
  getTodayString,
} from '@/lib/finance/format'

export {
  formatChartPeriodCaption,
  formatShortDate,
  getPeriodOffsetForDate,
  getPeriodRangeAtOffset,
  getTodayString,
}

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

export function minutesFromTimeRange(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let start = sh * 60 + (sm ?? 0)
  let end = eh * 60 + (em ?? 0)
  if (end <= start) end += 24 * 60
  return end - start
}

export function formatTimeRange(startTime: string | null, endTime: string | null): string {
  if (!startTime) return ''
  if (!endTime) return startTime.slice(0, 5)
  return `${startTime.slice(0, 5)} – ${endTime.slice(0, 5)}`
}

export function formatRelativeDate(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T12:00:00')
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'hoy'
  if (diffDays === 1) return 'mañana'
  if (diffDays === -1) return 'ayer'
  if (diffDays > 0 && diffDays < 30) return `en ${diffDays} días`
  if (diffDays < 0 && diffDays > -30) return `hace ${Math.abs(diffDays)} días`

  const diffMonths = Math.round(diffDays / 30)
  if (diffMonths > 0 && diffMonths < 24) {
    return diffMonths === 1 ? 'en 1 mes' : `en ${diffMonths} meses`
  }
  if (diffMonths < 0 && diffMonths > -24) {
    const abs = Math.abs(diffMonths)
    return abs === 1 ? 'hace 1 mes' : `hace ${abs} meses`
  }

  const diffYears = Math.round(diffDays / 365)
  if (diffYears > 0) return diffYears === 1 ? 'en 1 año' : `en ${diffYears} años`
  if (diffYears < 0) {
    const abs = Math.abs(diffYears)
    return abs === 1 ? 'hace 1 año' : `hace ${abs} años`
  }

  return formatShortDate(dateStr)
}

export function daysUntilDate(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T12:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function getTimeWeekLabel(offset = 0): string {
  const { start, end } = getPeriodRangeAtOffset('weekly', offset)
  if (offset === 0) return 'Semana actual'
  if (offset === 1) return 'Semana anterior'
  return `${formatShortDate(start)} – ${formatShortDate(end)}`
}

/** Etiqueta corta para pills de semanas pasadas (sin -2, -3…). */
export function getWeekSelectorLabel(offset = 0): string {
  const { start } = getPeriodRangeAtOffset('weekly', offset)
  if (offset === 0) return 'Actual'
  if (offset === 1) return 'Anterior'
  return formatShortDate(start)
}
