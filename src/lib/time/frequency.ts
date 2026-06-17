import type { TimeFrequency } from './types'

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addTimeFrequency(dateStr: string, frequency: TimeFrequency): string {
  const d = new Date(dateStr + 'T12:00:00')
  if (frequency === 'daily') d.setDate(d.getDate() + 1)
  else if (frequency === 'weekly') d.setDate(d.getDate() + 7)
  else if (frequency === 'biweekly') d.setDate(d.getDate() + 14)
  else d.setMonth(d.getMonth() + 1)
  return toDateString(d)
}

export function subtractTimeFrequency(dateStr: string, frequency: TimeFrequency): string {
  const d = new Date(dateStr + 'T12:00:00')
  if (frequency === 'daily') d.setDate(d.getDate() - 1)
  else if (frequency === 'weekly') d.setDate(d.getDate() - 7)
  else if (frequency === 'biweekly') d.setDate(d.getDate() - 14)
  else d.setMonth(d.getMonth() - 1)
  return toDateString(d)
}

export function formatTimeFrequency(frequency: TimeFrequency): string {
  const labels: Record<TimeFrequency, string> = {
    daily: 'diaria',
    weekly: 'semanal',
    biweekly: 'quincenal',
    monthly: 'mensual',
  }
  return labels[frequency]
}
