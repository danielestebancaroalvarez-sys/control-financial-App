import { expandBlockOccurrencesInRange } from './schedule'
import { scheduledMinutesInRange } from './recurring-blocks'
import type { TimeFrequency } from './types'

/** Días con registro real de sueño por usuario (`userId:YYYY-MM-DD`). */
export function buildSleepEntryOverrideKeys(
  entries: { userId: string; entryDate: string; categoryName: string }[]
): Set<string> {
  const keys = new Set<string>()
  for (const entry of entries) {
    if (entry.categoryName === 'Sueño') {
      keys.add(`${entry.userId}:${entry.entryDate}`)
    }
  }
  return keys
}

/** Minutos de bloque en rango; si es sueño y hay entrada real ese día, no cuenta el fijo. */
export function blockMinutesInRange(
  anchorDate: string,
  frequency: TimeFrequency,
  durationMinutes: number,
  rangeStart: string,
  rangeEnd: string,
  options?: {
    categoryName?: string
    assignedTo?: string | null
    sleepOverrides?: Set<string>
  }
): number {
  const isSleep =
    options?.categoryName === 'Sueño' &&
    options.assignedTo &&
    options.sleepOverrides

  if (!isSleep) {
    return scheduledMinutesInRange(
      anchorDate,
      frequency,
      durationMinutes,
      rangeStart,
      rangeEnd
    )
  }

  const dates = expandBlockOccurrencesInRange(
    anchorDate,
    frequency,
    rangeStart,
    rangeEnd
  )

  let total = 0
  for (const date of dates) {
    if (!options.sleepOverrides!.has(`${options.assignedTo}:${date}`)) {
      total += durationMinutes
    }
  }
  return total
}

export function shouldSkipSleepBlockOnDate(
  categoryName: string,
  assignedTo: string | null,
  date: string,
  sleepOverrides: Set<string>
): boolean {
  return (
    categoryName === 'Sueño' &&
    !!assignedTo &&
    sleepOverrides.has(`${assignedTo}:${date}`)
  )
}
