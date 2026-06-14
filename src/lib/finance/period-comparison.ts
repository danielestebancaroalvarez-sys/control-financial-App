import type { TransactionRow } from './types'

export function countExpenseTransactionsInPeriod(
  transactions: TransactionRow[],
  start: string,
  end: string
): number {
  let count = 0

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    if (tx.transaction_date < start || tx.transaction_date > end) continue
    count++
  }

  return count
}

/** Evita % absurdos cuando el periodo anterior casi no tiene datos. */
export function canCompareExpensePeriods(
  currentExpenses: number,
  previousExpenses: number,
  currentExpenseCount: number,
  previousExpenseCount: number
): boolean {
  if (currentExpenses <= 0 || previousExpenses <= 0) return false
  if (currentExpenseCount < 2 || previousExpenseCount < 2) return false

  const larger = Math.max(currentExpenses, previousExpenses)
  const smaller = Math.min(currentExpenses, previousExpenses)

  if (smaller / larger < 0.2) return false

  return true
}
