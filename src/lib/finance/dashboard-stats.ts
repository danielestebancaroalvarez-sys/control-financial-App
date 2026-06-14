import type { Period, TransactionRow } from './types'
import { getPeriodRangeAtOffset } from './format'
import { sumByTypeInPeriod } from './balance'

export type TrendPoint = {
  offset: number
  label: string
  income: number
  expenses: number
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

function formatWeekTick(start: string): string {
  const d = new Date(`${start}T12:00:00`)
  return d.toLocaleDateString('es', { day: 'numeric', month: 'numeric' })
}

function formatMonthTick(start: string): string {
  const d = new Date(`${start}T12:00:00`)
  return d.toLocaleDateString('es', { month: 'short' }).replace('.', '')
}
