import type { TransactionRow } from './types'
import { sumVariableExpenses } from './variable-expenses'
import {
  calculateScheduledRecurringTotal,
  type RecurringScheduleRow,
} from './recurring-occurrences'

/** Montos fijos según fechas que caen dentro del rango [rangeStart, rangeEnd]. */
export function calculateScheduledFixedExpenses(
  recurring: RecurringScheduleRow[],
  rangeStart: string,
  rangeEnd: string
): number {
  return calculateScheduledRecurringTotal(
    recurring,
    'expense',
    rangeStart,
    rangeEnd
  )
}

export function calculateScheduledFixedIncome(
  recurring: RecurringScheduleRow[],
  rangeStart: string,
  rangeEnd: string
): number {
  return calculateScheduledRecurringTotal(
    recurring,
    'income',
    rangeStart,
    rangeEnd
  )
}

/** Ingresos del periodo: fijos programados en el rango + ingresos puntuales sin recurrencia. */
export function calculateEffectivePeriodIncome(
  transactions: TransactionRow[],
  recurring: RecurringScheduleRow[],
  rangeStart: string,
  rangeEnd: string
): number {
  const scheduled = calculateScheduledFixedIncome(recurring, rangeStart, rangeEnd)
  let adHoc = 0

  for (const tx of transactions) {
    if (tx.type !== 'income') continue
    if (tx.transaction_date < rangeStart || tx.transaction_date > rangeEnd) continue
    if (tx.recurring_schedule_id) continue
    adHoc += Number(tx.amount_base)
  }

  return Math.round((adHoc + scheduled) * 100) / 100
}

/** Salidas del periodo: fijos programados en el rango + gasto variable real. */
export function calculateEffectivePeriodOutflow(
  transactions: TransactionRow[],
  recurring: RecurringScheduleRow[],
  rangeStart: string,
  rangeEnd: string,
  categoryMap: Map<string, { is_fixed: boolean; is_subscription: boolean }>
): number {
  const scheduled = calculateScheduledFixedExpenses(recurring, rangeStart, rangeEnd)
  const variable = sumVariableExpenses(
    transactions,
    rangeStart,
    rangeEnd,
    categoryMap
  )

  return Math.round((scheduled + variable) * 100) / 100
}
