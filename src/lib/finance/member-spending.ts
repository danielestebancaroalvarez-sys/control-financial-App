import type { TransactionRow, MemberSpendingStat } from './types'

type CategoryMeta = {
  is_fixed: boolean
  is_subscription: boolean
  name?: string
  color?: string | null
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
  const extraTotals = new Map<string, number>()
  const categoryTotalsByUser = new Map<
    string,
    Map<string, { amount: number; extraAmount: number; color: string | null }>
  >()

  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.created_by) continue
    if (tx.transaction_date < start || tx.transaction_date > end) continue
    if (tx.savings_goal_id) continue

    const userId = tx.created_by
    const amount = Number(tx.amount_base)
    const isExtra = isVariableExpense(tx, categoryMap)

    totals.set(userId, (totals.get(userId) ?? 0) + amount)
    if (isExtra) {
      extraTotals.set(userId, (extraTotals.get(userId) ?? 0) + amount)
    }

    const cat = tx.category_id ? categoryMap.get(tx.category_id) : undefined
    const categoryName = cat?.name ?? 'Sin categoría'
    const categoryColor = cat?.color ?? null

    const userCats = categoryTotalsByUser.get(userId) ?? new Map()
    const existing = userCats.get(categoryName) ?? {
      amount: 0,
      extraAmount: 0,
      color: categoryColor,
    }
    userCats.set(categoryName, {
      amount: existing.amount + amount,
      extraAmount: existing.extraAmount + (isExtra ? amount : 0),
      color: categoryColor ?? existing.color,
    })
    categoryTotalsByUser.set(userId, userCats)
  }

  const totalExpenses = [...totals.values()].reduce((s, v) => s + v, 0)
  if (totalExpenses <= 0) return []

  const totalExtra = [...extraTotals.values()].reduce((s, v) => s + v, 0)
  const fairShareExtra = totalExtra / Math.max(members.length, 1)
  const memberMap = new Map(members.map(m => [m.user_id, m]))

  return [...totals.entries()]
    .map(([userId, amount]) => {
      const member = memberMap.get(userId)
      const rounded = Math.round(amount * 100) / 100
      const extraRounded = Math.round((extraTotals.get(userId) ?? 0) * 100) / 100
      const userTotal = amount

      const byCategory = [...(categoryTotalsByUser.get(userId)?.entries() ?? [])]
        .map(([categoryName, data]) => ({
          categoryName,
          amount: Math.round(data.amount * 100) / 100,
          extraAmount: Math.round(data.extraAmount * 100) / 100,
          percent: Math.round((data.amount / userTotal) * 1000) / 10,
          color: data.color,
        }))
        .sort((a, b) => b.amount - a.amount)

      return {
        userId,
        name: member?.full_name?.trim() || 'Miembro',
        amount: rounded,
        extraAmount: extraRounded,
        percent: Math.round((amount / totalExpenses) * 1000) / 10,
        avatarUrl: member?.avatar_url ?? null,
        extraAboveShare: Math.round((extraRounded - fairShareExtra) * 100) / 100,
        byCategory,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}
