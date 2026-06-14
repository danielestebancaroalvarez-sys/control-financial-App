import type { TransactionRow } from './types'
import { sumByTypeInPeriod } from './balance'
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

type ExpenseCategoryMeta = {
  is_fixed: boolean
  is_subscription: boolean
}

type IncomeCategoryMeta = {
  is_fixed: boolean
}

/** Gastos fijos realmente registrados en el periodo (no proyección). */
export function sumActualFixedExpensesInPeriod(
  transactions: TransactionRow[],
  start: string,
  end: string,
  categoryMap: Map<string, ExpenseCategoryMeta>
): number {
  let total = 0

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    if (tx.transaction_date < start || tx.transaction_date > end) continue
    if (tx.savings_goal_id) continue

    if (tx.recurring_schedule_id) {
      total += Number(tx.amount_base)
      continue
    }

    const cat = tx.category_id ? categoryMap.get(tx.category_id) : null
    if (cat?.is_fixed || cat?.is_subscription) {
      total += Number(tx.amount_base)
    }
  }

  return Math.round(total * 100) / 100
}

/** Ingresos fijos realmente registrados en el periodo. */
export function sumActualFixedIncomeInPeriod(
  transactions: TransactionRow[],
  start: string,
  end: string,
  categoryMap: Map<string, IncomeCategoryMeta>
): number {
  let total = 0

  for (const tx of transactions) {
    if (tx.type !== 'income') continue
    if (tx.transaction_date < start || tx.transaction_date > end) continue

    if (tx.recurring_schedule_id) {
      total += Number(tx.amount_base)
      continue
    }

    const cat = tx.category_id ? categoryMap.get(tx.category_id) : null
    if (cat?.is_fixed) {
      total += Number(tx.amount_base)
    }
  }

  return Math.round(total * 100) / 100
}

/** Totales del periodo basados solo en transacciones registradas. */
export function calculateActualPeriodCashflow(
  transactions: TransactionRow[],
  start: string,
  end: string,
  expenseCategoryMap: Map<string, ExpenseCategoryMeta>,
  incomeCategoryMap: Map<string, IncomeCategoryMeta>
) {
  return {
    periodIncome: sumByTypeInPeriod(transactions, 'income', start, end),
    periodExpenses: sumByTypeInPeriod(transactions, 'expense', start, end),
    scheduledFixedExpenses: sumActualFixedExpensesInPeriod(
      transactions,
      start,
      end,
      expenseCategoryMap
    ),
    scheduledFixedIncome: sumActualFixedIncomeInPeriod(
      transactions,
      start,
      end,
      incomeCategoryMap
    ),
    variableSpent: sumVariableExpenses(
      transactions,
      start,
      end,
      expenseCategoryMap
    ),
  }
}
