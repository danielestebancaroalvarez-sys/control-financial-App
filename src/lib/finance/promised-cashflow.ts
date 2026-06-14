import { getPeriodRangeAtOffset } from './format'
import type { Period, TransactionRow } from './types'
import type { RecurringScheduleRow } from './recurring-occurrences'
import {
  calculateEffectivePeriodIncome,
  calculateEffectivePeriodOutflow,
  calculateScheduledFixedExpenses,
  calculateScheduledFixedIncome,
} from './scheduled-expenses'

export type PromisedCashflow = {
  rangeStart: string
  rangeEnd: string
  promisedIncome: number
  promisedFixedIncome: number
  promisedFixedExpenses: number
  promisedOutflow: number
}

/** Ingresos y gastos fijos prometidos dentro del periodo activo del usuario (semana o mes). */
export function calculatePromisedCashflow(
  transactions: TransactionRow[],
  recurring: RecurringScheduleRow[],
  categoryMap: Map<string, { is_fixed: boolean; is_subscription: boolean }>,
  period: Period,
  periodOffset = 0
): PromisedCashflow {
  const { start, end } = getPeriodRangeAtOffset(period, periodOffset)

  return {
    rangeStart: start,
    rangeEnd: end,
    promisedIncome: calculateEffectivePeriodIncome(
      transactions,
      recurring,
      start,
      end
    ),
    promisedFixedIncome: calculateScheduledFixedIncome(recurring, start, end),
    promisedFixedExpenses: calculateScheduledFixedExpenses(
      recurring,
      start,
      end
    ),
    promisedOutflow: calculateEffectivePeriodOutflow(
      transactions,
      recurring,
      start,
      end,
      categoryMap
    ),
  }
}
