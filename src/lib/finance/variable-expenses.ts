import type { TransactionRow } from './types'

type CategoryMeta = {
  is_fixed: boolean
  is_subscription: boolean
}

function isVariableExpense(
  tx: TransactionRow,
  categoryMap: Map<string, CategoryMeta>
): boolean {
  if (tx.savings_goal_id) return false
  if (!tx.category_id) return true

  const cat = categoryMap.get(tx.category_id)
  if (!cat) return true

  return !cat.is_fixed && !cat.is_subscription
}

export function sumVariableExpenses(
  transactions: TransactionRow[],
  start: string,
  end: string,
  categoryMap: Map<string, CategoryMeta>
): number {
  let total = 0

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    if (tx.transaction_date < start || tx.transaction_date > end) continue
    if (!isVariableExpense(tx, categoryMap)) continue
    total += Number(tx.amount_base)
  }

  return Math.round(total * 100) / 100
}
