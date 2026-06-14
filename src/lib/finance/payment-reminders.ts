import { listOccurrenceDatesInRange } from './recurring-occurrences'

export type PaymentDueReminder = {
  id: string
  scheduleId: string
  name: string
  amount: number
  dueDate: string
  categoryName: string | null
}

type RecurringRow = {
  id: string
  description: string
  amount_original: number
  frequency: string
  next_occurrence: string
  categories: { name: string } | null
}

export function listPaymentDueDates(
  recurring: RecurringRow[],
  rangeStart: string,
  rangeEnd: string
): PaymentDueReminder[] {
  const results: PaymentDueReminder[] = []

  for (const row of recurring) {
    const frequency = row.frequency as 'weekly' | 'biweekly' | 'monthly'
    const dates = listOccurrenceDatesInRange(
      row.next_occurrence,
      frequency,
      rangeStart,
      rangeEnd
    )

    for (const date of dates) {
      const cat = row.categories
      results.push({
        id: `${row.id}:${date}`,
        scheduleId: row.id,
        name: row.description.trim() || cat?.name || 'Pago',
        amount: Number(row.amount_original),
        dueDate: date,
        categoryName: cat?.name ?? null,
      })
    }
  }

  return results.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function getTomorrowDateString(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function formatReminderDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
