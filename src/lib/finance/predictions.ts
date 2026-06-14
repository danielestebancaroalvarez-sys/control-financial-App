import type {
  ConsumptionPrediction,
  FixedServiceStatus,
  PredictionsSummary,
} from './types'
import { dayOfMonth, daysInCurrentMonth, getCurrentMonthRange } from './format'

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
  mercadoCategoryName: string
): PredictionsSummary {
  const { start, end } = getCurrentMonthRange()

  const monthTx = transactions.filter(
    tx => tx.transaction_date >= start && tx.transaction_date <= end
  )

  const mapService = (r: RecurringRow): FixedServiceStatus => {
    const cat = r.categories
    const paid = monthTx.find(
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
    ? buildConsumptionPrediction(monthTx, transactions, mercadoCategoryId, mercadoCategoryName)
    : null

  return { fixedServices, subscriptions, consumption }
}

function buildConsumptionPrediction(
  monthTx: TxRow[],
  allTx: TxRow[],
  categoryId: string,
  categoryName: string
): ConsumptionPrediction {
  const spentSoFar = monthTx
    .filter(tx => tx.category_id === categoryId)
    .reduce((sum, tx) => sum + Number(tx.amount_base), 0)

  const today = dayOfMonth()
  const totalDays = daysInCurrentMonth()
  const projectedTotal =
    today > 0 ? Math.round((spentSoFar / today) * totalDays * 100) / 100 : 0

  const now = new Date()
  const monthlyTotals: number[] = []
  for (let i = 1; i <= 3; i++) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const s = mStart.toISOString().slice(0, 10)
    const e = mEnd.toISOString().slice(0, 10)
    const total = allTx
      .filter(
        tx =>
          tx.category_id === categoryId &&
          tx.transaction_date >= s &&
          tx.transaction_date <= e
      )
      .reduce((sum, tx) => sum + Number(tx.amount_base), 0)
    monthlyTotals.push(total)
  }

  const historicalAverage =
    monthlyTotals.length > 0
      ? monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length
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
    daysRemaining: totalDays - today,
  }
}
