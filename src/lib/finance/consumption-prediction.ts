import type { ConsumptionPrediction, Period } from './types'
import { getPeriodProgress, getPreviousPeriodRanges } from './format'

type TxRow = {
  category_id: string | null
  amount_base: number
  transaction_date: string
}

export function buildConsumptionPrediction(
  transactions: TxRow[],
  categoryId: string | null,
  categoryName: string,
  period: Period = 'monthly'
): ConsumptionPrediction | null {
  if (!categoryId) return null

  const progress = getPeriodProgress(period)
  const categoryTx = transactions.filter(tx => tx.category_id === categoryId)

  const spentSoFar = categoryTx
    .filter(
      tx =>
        tx.transaction_date >= progress.start &&
        tx.transaction_date <= progress.end &&
        tx.transaction_date <= getToday()
    )
    .reduce((sum, tx) => sum + Number(tx.amount_base), 0)

  if (spentSoFar <= 0 && categoryTx.length === 0) return null

  const projectedTotal =
    progress.elapsed > 0
      ? Math.round((spentSoFar / progress.elapsed) * progress.total * 100) / 100
      : spentSoFar

  const previousRanges = getPreviousPeriodRanges(period, 3)
  const historicalTotals = previousRanges.map(range =>
    categoryTx
      .filter(
        tx => tx.transaction_date >= range.start && tx.transaction_date <= range.end
      )
      .reduce((sum, tx) => sum + Number(tx.amount_base), 0)
  )

  const nonZero = historicalTotals.filter(t => t > 0)
  const historicalAverage =
    nonZero.length > 0
      ? Math.round(
          (nonZero.reduce((s, t) => s + t, 0) / nonZero.length) * 100
        ) / 100
      : projectedTotal

  const percentVsAverage =
    historicalAverage > 0
      ? Math.round(
          ((projectedTotal - historicalAverage) / historicalAverage) * 1000
        ) / 10
      : 0

  const daysRemaining = Math.max(0, progress.total - progress.elapsed)

  return {
    categoryName,
    spentSoFar: Math.round(spentSoFar * 100) / 100,
    projectedTotal,
    historicalAverage,
    percentVsAverage,
    daysRemaining,
    period,
  }
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}
