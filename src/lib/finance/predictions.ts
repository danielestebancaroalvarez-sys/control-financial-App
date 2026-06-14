import type {
  FixedServiceStatus,
  ItemPurchasePrediction,
  Period,
  PredictionsSummary,
} from './types'
import {
  addFrequency,
  getNextPeriodRange,
  getPreviousPeriodRanges,
} from './format'

type RecurringRow = {
  id: string
  description: string
  amount_original: number
  frequency: string
  next_occurrence: string
  category_id: string
  categories: { name: string; icon: string | null; is_fixed: boolean } | null
}

type TxRow = {
  category_id: string | null
  amount_base: number
  transaction_date: string
  line_items: { name: string; price: number }[] | null
}

function countOccurrencesInRange(
  nextOccurrence: string,
  frequency: 'weekly' | 'biweekly' | 'monthly',
  rangeStart: string,
  rangeEnd: string
): number {
  let date = nextOccurrence
  let guard = 0

  while (date < rangeStart && guard < 120) {
    date = addFrequency(date, frequency)
    guard++
  }

  let count = 0
  while (date <= rangeEnd && guard < 240) {
    count++
    date = addFrequency(date, frequency)
    guard++
  }

  return count
}

function mapUpcomingService(
  r: RecurringRow,
  rangeStart: string,
  rangeEnd: string
): FixedServiceStatus | null {
  const frequency = r.frequency as 'weekly' | 'biweekly' | 'monthly'
  const occurrences = countOccurrencesInRange(
    r.next_occurrence,
    frequency,
    rangeStart,
    rangeEnd
  )

  if (occurrences === 0) return null

  const cat = r.categories
  const unitAmount = Number(r.amount_original)

  return {
    id: r.id,
    name: cat?.name ?? r.description,
    amount: Math.round(unitAmount * occurrences * 100) / 100,
    frequency: r.frequency,
    status: 'pending',
    occurrences,
    categoryIcon: cat?.icon ?? null,
    dueInNextPeriod: true,
  }
}

export function buildPredictionsSummary(
  recurring: RecurringRow[],
  transactions: TxRow[],
  period: Period = 'monthly'
): PredictionsSummary {
  const nextRange = getNextPeriodRange(period)

  const fixedServices = recurring
    .filter(r => r.categories?.is_fixed)
    .map(r => mapUpcomingService(r, nextRange.start, nextRange.end))
    .filter((s): s is FixedServiceStatus => s !== null)

  const subscriptions = recurring
    .filter(r => !r.categories?.is_fixed)
    .map(r => mapUpcomingService(r, nextRange.start, nextRange.end))
    .filter((s): s is FixedServiceStatus => s !== null)

  const purchasePredictions = buildItemPurchasePredictions(transactions, period)

  return {
    fixedServices,
    subscriptions,
    purchasePredictions,
    nextPeriodStart: nextRange.start,
    nextPeriodEnd: nextRange.end,
    period,
  }
}

function buildItemPurchasePredictions(
  transactions: TxRow[],
  period: Period
): ItemPurchasePrediction[] {
  const previousRanges = getPreviousPeriodRanges(period, 4)
  if (previousRanges.length === 0) return []

  const itemMap = new Map<
    string,
    {
      displayName: string
      prices: number[]
      purchaseDates: string[]
    }
  >()

  for (const tx of transactions) {
    if (!tx.line_items?.length) continue
    for (const item of tx.line_items) {
      const key = item.name.trim().toLowerCase()
      if (!key) continue
      const existing = itemMap.get(key) ?? {
        displayName: item.name.trim(),
        prices: [],
        purchaseDates: [],
      }
      existing.prices.push(Number(item.price))
      existing.purchaseDates.push(tx.transaction_date)
      itemMap.set(key, existing)
    }
  }

  const predictions: ItemPurchasePrediction[] = []

  for (const [, stats] of itemMap) {
    const periodsWithPurchase = previousRanges.filter(range =>
      stats.purchaseDates.some(
        d => d >= range.start && d <= range.end
      )
    ).length

    if (periodsWithPurchase === 0) continue

    const avgPurchasesPerPeriod =
      periodsWithPurchase / previousRanges.length
    const avgUnitPrice =
      stats.prices.reduce((sum, p) => sum + p, 0) / stats.prices.length
    const expectedPurchases = Math.max(
      1,
      Math.round(avgPurchasesPerPeriod * 10) / 10
    )
    const projectedSpend =
      Math.round(expectedPurchases * avgUnitPrice * 100) / 100

    predictions.push({
      itemName: stats.displayName,
      avgUnitPrice: Math.round(avgUnitPrice * 100) / 100,
      expectedPurchases,
      projectedSpend,
      lastPurchased: [...stats.purchaseDates].sort().at(-1) ?? null,
    })
  }

  return predictions.sort((a, b) => b.projectedSpend - a.projectedSpend)
}
