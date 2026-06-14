import type { TransactionRow } from './types'

export type MemberSpendingStat = {
  userId: string
  name: string
  amount: number
  percent: number
  avatarUrl: string | null
}

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

export function buildMemberSpendingStats(
  transactions: TransactionRow[],
  start: string,
  end: string,
  members: { user_id: string; full_name: string | null; avatar_url: string | null }[],
  categoryMap: Map<string, CategoryMeta>
): MemberSpendingStat[] {
  const totals = new Map<string, number>()

  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.created_by) continue
    if (tx.transaction_date < start || tx.transaction_date > end) continue
    if (!isVariableExpense(tx, categoryMap)) continue
    totals.set(tx.created_by, (totals.get(tx.created_by) ?? 0) + Number(tx.amount_base))
  }

  const totalExpenses = [...totals.values()].reduce((s, v) => s + v, 0)
  if (totalExpenses <= 0) return []

  const memberMap = new Map(members.map(m => [m.user_id, m]))

  return [...totals.entries()]
    .map(([userId, amount]) => {
      const member = memberMap.get(userId)
      return {
        userId,
        name: member?.full_name?.trim() || 'Miembro',
        amount: Math.round(amount * 100) / 100,
        percent: Math.round((amount / totalExpenses) * 1000) / 10,
        avatarUrl: member?.avatar_url ?? null,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}
