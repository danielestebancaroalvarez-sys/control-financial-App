import type {
  ConsumptionPrediction,
  FixedServiceStatus,
  Period,
  PredictionsSummary,
} from './types'
import {
  getPeriodProgress,
  getPeriodRange,
  getPreviousPeriodRanges,
} from './format'

type RecurringRow = {
  id: string
  description: string
  amount_original: number
  frequency: string
  category_id: string
  categories: { name: string; icon: string | null; is_fixed: boolean } | null
}

type TxRow = {
  category_id: string | null
  amount_base: number
  transaction_date: string
}

export function buildPredictionsSummary(
  recurring: RecurringRow[],
  transactions: TxRow[],
  mercadoCategoryId: string | null,
  mercadoCategoryName: string,
  period: Period = 'monthly'
): PredictionsSummary {
  const { start, end } = getPeriodRange(period)

  const periodTx = transactions.filter(
    tx => tx.transaction_date >= start && tx.transaction_date <= end
  )

  const mapService = (r: RecurringRow): FixedServiceStatus => {
    const cat = r.categories
    const paid = periodTx.find(
      tx => tx.category_id === r.category_id && Number(tx.amount_base) > 0
    )
    return {
      id: r.id,
      name: cat?.name ?? r.description,
      amount: Number(r.amount_original),
      frequency: r.frequency,
      status: paid ? 'paid' : 'pending',
      paidAmount: paid ? Number(paid.amount_base) : undefined,
      paidDate: paid?.transaction_date,
      categoryIcon: cat?.icon ?? null,
    }
  }

  const fixedServices = recurring
    .filter(r => r.categories?.is_fixed)
    .map(mapService)

  const subscriptions = recurring
    .filter(r => !r.categories?.is_fixed)
    .map(mapService)

  const consumption = mercadoCategoryId
    ? buildConsumptionPrediction(
        periodTx,
        transactions,
        mercadoCategoryId,
        mercadoCategoryName,
        period
      )
    : null

  return { fixedServices, subscriptions, consumption }
}

function buildConsumptionPrediction(
  periodTx: TxRow[],
  allTx: TxRow[],
  categoryId: string,
  categoryName: string,
  period: Period
): ConsumptionPrediction {
  const { elapsed, total } = getPeriodProgress(period)

  const spentSoFar = periodTx
    .filter(tx => tx.category_id === categoryId)
    .reduce((sum, tx) => sum + Number(tx.amount_base), 0)

  const projectedTotal =
    elapsed > 0
      ? Math.round((spentSoFar / elapsed) * total * 100) / 100
      : 0

  const previousRanges = getPreviousPeriodRanges(period, 3)
  const historicalTotals = previousRanges.map(({ start, end }) =>
    allTx
      .filter(
        tx =>
          tx.category_id === categoryId &&
          tx.transaction_date >= start &&
          tx.transaction_date <= end
      )
      .reduce((sum, tx) => sum + Number(tx.amount_base), 0)
  )

  const historicalAverage =
    historicalTotals.length > 0
      ? historicalTotals.reduce((a, b) => a + b, 0) / historicalTotals.length
      : 0

  const percentVsAverage =
    historicalAverage > 0
      ? Math.round(((projectedTotal - historicalAverage) / historicalAverage) * 100)
      : 0

  return {
    categoryName,
    spentSoFar,
    projectedTotal,
    historicalAverage: Math.round(historicalAverage * 100) / 100,
    percentVsAverage,
    daysRemaining: total - elapsed,
    period,
  }
}
