import { addFrequency } from './format'

type RecurringExpense = {
  type: string
  amount_original: number
  frequency: string
  next_occurrence: string
  is_active?: boolean
}

function countOccurrencesInRange(
  nextOccurrence: string,
  frequency: 'weekly' | 'biweekly' | 'monthly',
  rangeStart: string,
  rangeEnd: string
): number {
  let date = nextOccurrence
  let guard = 0

  while (date < rangeStart && guard < 120) {
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

export function calculateScheduledFixedExpenses(
  recurring: RecurringExpense[],
  rangeStart: string,
  rangeEnd: string
): number {
  let total = 0

  for (const row of recurring) {
    if (row.type !== 'expense' || row.is_active === false) continue
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
