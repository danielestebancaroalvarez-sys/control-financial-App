import { addTimeFrequency, subtractTimeFrequency } from './frequency'
import type { TimeFrequency } from './types'

export function countBlockOccurrencesInRange(
  anchorDate: string,
  frequency: TimeFrequency,
  rangeStart: string,
  rangeEnd: string
): number {
  let date = anchorDate
  let guard = 0

  while (date > rangeStart && guard < 120) {
    const prev = subtractTimeFrequency(date, frequency)
    if (prev === date) break
    date = prev
    guard++
  }

  while (date < rangeStart && guard < 240) {
    date = addTimeFrequency(date, frequency)
    guard++
  }

  let count = 0
  while (date <= rangeEnd && guard < 240) {
    count++
    date = addTimeFrequency(date, frequency)
    guard++
  }

  return count
}

export function scheduledMinutesInRange(
  anchorDate: string,
  frequency: TimeFrequency,
  durationMinutes: number,
  rangeStart: string,
  rangeEnd: string
): number {
  const occurrences = countBlockOccurrencesInRange(
    anchorDate,
    frequency,
    rangeStart,
    rangeEnd
  )
  return occurrences * durationMinutes
}
