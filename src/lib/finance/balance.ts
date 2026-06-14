import type { BalanceBreakdown, TransactionRow } from './types'

export function calculateBalance(transactions: TransactionRow[]): BalanceBreakdown {
  let income = 0
  let expense = 0
  let adjustment = 0

  for (const tx of transactions) {
    const amount = Number(tx.amount_base)
    if (tx.type === 'income') income += amount
    else if (tx.type === 'expense') expense += amount
    else if (tx.type === 'adjustment') adjustment += amount
  }

  return {
    income,
    expense,
    adjustment,
    balance: income - expense + adjustment,
  }
}

export function sumByTypeInPeriod(
  transactions: TransactionRow[],
  type: TransactionRow['type'],
  startDate: string,
  endDate: string
): number {
  return transactions
    .filter(
      tx =>
        tx.type === type &&
        tx.transaction_date >= startDate &&
        tx.transaction_date <= endDate
    )
    .reduce((sum, tx) => sum + Number(tx.amount_base), 0)
}
