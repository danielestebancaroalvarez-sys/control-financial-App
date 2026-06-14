import { addFrequency, subtractFrequency } from './format'

export type RecurringScheduleRow = {
  type: string
  amount_original: number
  frequency: string
  next_occurrence: string
  is_active?: boolean
}

/** Cuenta ocurrencias cuya fecha cae en [rangeStart, rangeEnd], retrocediendo desde next_occurrence. */
export function countOccurrencesInRange(
  nextOccurrence: string,
  frequency: 'weekly' | 'biweekly' | 'monthly',
  rangeStart: string,
  rangeEnd: string
): number {
  let date = nextOccurrence
  let guard = 0

  while (date > rangeStart && guard < 120) {
    const prev = subtractFrequency(date, frequency)
    if (prev === date) break
    date = prev
    guard++
  }

  while (date < rangeStart && guard < 240) {
    date = addFrequency(date, frequency)
    guard++
  }

  let count = 0
  while (date <= rangeEnd && guard < 240) {
    count++
    date = addFrequency(date, frequency)
    guard++
  }

  return count
}

export function listOccurrenceDatesInRange(
  nextOccurrence: string,
  frequency: 'weekly' | 'biweekly' | 'monthly',
  rangeStart: string,
  rangeEnd: string
): string[] {
  let date = nextOccurrence
  let guard = 0
  const dates: string[] = []

  while (date > rangeStart && guard < 120) {
    const prev = subtractFrequency(date, frequency)
    if (prev === date) break
    date = prev
    guard++
  }

  while (date < rangeStart && guard < 240) {
    date = addFrequency(date, frequency)
    guard++
  }

  while (date <= rangeEnd && guard < 240) {
    dates.push(date)
    date = addFrequency(date, frequency)
    guard++
  }

  return dates
}

export function calculateScheduledRecurringTotal(
  recurring: RecurringScheduleRow[],
  scheduleType: 'income' | 'expense',
  rangeStart: string,
  rangeEnd: string
): number {
  let total = 0

  for (const row of recurring) {
    if (row.type !== scheduleType || row.is_active === false) continue
    const frequency = row.frequency as 'weekly' | 'biweekly' | 'monthly'
    const count = countOccurrencesInRange(
      row.next_occurrence,
      frequency,
      rangeStart,
      rangeEnd
    )
    total += Number(row.amount_original) * count
  }

  return Math.round(total * 100) / 100
}
