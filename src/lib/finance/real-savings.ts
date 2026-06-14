import type { SavingsGoal, TransactionRow } from './types'

export function sumRealSavingsInPeriod(
  transactions: TransactionRow[],
  start: string,
  end: string
): number {
  let total = 0

  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.savings_goal_id) continue
    if (tx.transaction_date < start || tx.transaction_date > end) continue
    total += Number(tx.amount_base)
  }

  return Math.round(total * 100) / 100
}

export function buildRealSavingsByGoal(
  transactions: TransactionRow[],
  savingsGoals: SavingsGoal[],
  start: string,
  end: string
): { name: string; amount: number; color: string }[] {
  const byGoal = new Map<string, number>()

  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.savings_goal_id) continue
    if (tx.transaction_date < start || tx.transaction_date > end) continue
    byGoal.set(
      tx.savings_goal_id,
      (byGoal.get(tx.savings_goal_id) ?? 0) + Number(tx.amount_base)
    )
  }

  return savingsGoals
    .map(goal => ({
      name: goal.name,
      amount: Math.round((byGoal.get(goal.id) ?? 0) * 100) / 100,
      color: goal.color,
    }))
    .filter(item => item.amount > 0)
}
