import type { Category, Period, TransactionRow } from './types'
import { getPeriodRangeAtOffset } from './format'
import { sumByTypeInPeriod } from './balance'

export type TrendPoint = {
  offset: number
  label: string
  income: number
  expenses: number
}

export type CategoryTrendPoint = {
  offset: number
  label: string
  categories: { name: string; amount: number; color: string }[]
}

export function buildTrendSeries(
  transactions: TransactionRow[],
  period: Period,
  activeOffset: number,
  windowSize = 6
): TrendPoint[] {
  const startOffset = Math.max(0, activeOffset - (windowSize - 1))
  const endOffset = activeOffset

  const points: TrendPoint[] = []

  for (let offset = endOffset; offset >= startOffset; offset--) {
    const { start, end } = getPeriodRangeAtOffset(period, offset)
    const income = sumByTypeInPeriod(transactions, 'income', start, end)
    const expenses = sumByTypeInPeriod(transactions, 'expense', start, end)

    points.unshift({
      offset,
      label:
        offset === activeOffset
          ? '•'
          : period === 'weekly'
            ? formatWeekTick(start)
            : formatMonthTick(start),
      income,
      expenses,
    })
  }

  return points
}

export function buildCategoryTrendSeries(
  transactions: TransactionRow[],
  expenseCategories: Category[],
  period: Period,
  activeOffset: number,
  windowSize = 6
): CategoryTrendPoint[] {
  const startOffset = Math.max(0, activeOffset - (windowSize - 1))
  const endOffset = activeOffset
  const categoryMap = new Map(
    expenseCategories.map(c => [
      c.id,
      { name: c.name, color: c.color ?? '#636E72' },
    ])
  )

  const points: CategoryTrendPoint[] = []

  for (let offset = endOffset; offset >= startOffset; offset--) {
    const { start, end } = getPeriodRangeAtOffset(period, offset)
    const totals = new Map<string, number>()

    for (const tx of transactions) {
      if (tx.type !== 'expense' || !tx.category_id) continue
      if (tx.transaction_date < start || tx.transaction_date > end) continue
      totals.set(
        tx.category_id,
        (totals.get(tx.category_id) ?? 0) + Number(tx.amount_base)
      )
    }

    const categories = [...totals.entries()]
      .map(([id, amount]) => {
        const cat = categoryMap.get(id)
        return {
          name: cat?.name ?? 'Sin categoría',
          amount,
          color: cat?.color ?? '#636E72',
        }
      })
      .sort((a, b) => b.amount - a.amount)

    points.unshift({
      offset,
      label:
        offset === activeOffset
          ? '•'
          : period === 'weekly'
            ? formatWeekTick(start)
            : formatMonthTick(start),
      categories,
    })
  }

  return points
}

function formatWeekTick(start: string): string {
  const d = new Date(`${start}T12:00:00`)
  return d.toLocaleDateString('es', { day: 'numeric', month: 'numeric' })
}

function formatMonthTick(start: string): string {
  const d = new Date(`${start}T12:00:00`)
  return d.toLocaleDateString('es', { month: 'short' }).replace('.', '')
}
