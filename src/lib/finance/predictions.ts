import type {
  FixedServiceStatus,
  ItemPurchasePrediction,
  Period,
  PredictionsSummary,
} from './types'
import {
  addFrequency,
  getNextPeriodRange,
  getPeriodRange,
  getPreviousPeriodRanges,
} from './format'
import { getCategoryRadarKind, parseLineItems } from './category-radar'

type RecurringRow = {
  id: string
  description: string
  amount_original: number
  frequency: string
  next_occurrence: string
  category_id: string
  categories: {
    name: string
    icon: string | null
    is_fixed: boolean
    is_subscription: boolean
  } | null
}

type TxRow = {
  category_id: string | null
  amount_base: number
  transaction_date: string
  description: string
  line_items: unknown
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
    name: r.description.trim() || cat?.name || 'Gasto',
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
  mercadoCategoryId: string | null,
  period: Period = 'monthly'
): PredictionsSummary {
  const nextRange = getNextPeriodRange(period)

  const fixedServices = recurring
    .filter(r => getCategoryRadarKind(r.categories) === 'service')
    .map(r => mapUpcomingService(r, nextRange.start, nextRange.end))
    .filter((s): s is FixedServiceStatus => s !== null)

  const subscriptions = recurring
    .filter(r => getCategoryRadarKind(r.categories) === 'subscription')
    .map(r => mapUpcomingService(r, nextRange.start, nextRange.end))
    .filter((s): s is FixedServiceStatus => s !== null)

  const purchasePredictions = buildItemPurchasePredictions(
    recurring,
    transactions,
    mercadoCategoryId,
    nextRange,
    period
  )

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
  recurring: RecurringRow[],
  transactions: TxRow[],
  mercadoCategoryId: string | null,
  nextRange: { start: string; end: string },
  period: Period
): ItemPurchasePrediction[] {
  const analysisRanges = [
    getPeriodRange(period),
    ...getPreviousPeriodRanges(period, 3),
  ]

  const itemMap = new Map<
    string,
    {
      displayName: string
      prices: number[]
      purchaseDates: string[]
    }
  >()

  const mercadoTx = mercadoCategoryId
    ? transactions.filter(tx => tx.category_id === mercadoCategoryId)
    : transactions.filter(tx => {
        // fallback if category id unknown
        return false
      })

  for (const tx of mercadoTx) {
    const lineItems = parseLineItems(tx.line_items)

    if (lineItems?.length) {
      for (const item of lineItems) {
        const key = item.name.toLowerCase()
        const existing = itemMap.get(key) ?? {
          displayName: item.name,
          prices: [],
          purchaseDates: [],
        }
        existing.prices.push(item.price)
        existing.purchaseDates.push(tx.transaction_date)
        itemMap.set(key, existing)
      }
      continue
    }

    const label = tx.description.trim() || 'Compra mercado'
    const key = label.toLowerCase()
    const existing = itemMap.get(key) ?? {
      displayName: label,
      prices: [],
      purchaseDates: [],
    }
    existing.prices.push(Number(tx.amount_base))
    existing.purchaseDates.push(tx.transaction_date)
    itemMap.set(key, existing)
  }

  const predictions: ItemPurchasePrediction[] = []

  for (const [, stats] of itemMap) {
    const periodsWithPurchase = analysisRanges.filter(range =>
      stats.purchaseDates.some(d => d >= range.start && d <= range.end)
    ).length

    if (periodsWithPurchase === 0) continue

    const avgPurchasesPerPeriod =
      periodsWithPurchase / analysisRanges.length
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

  const recurringMercado = recurring.filter(
    r =>
      r.category_id === mercadoCategoryId ||
      getCategoryRadarKind(r.categories) === 'shopping'
  )

  for (const r of recurringMercado) {
    const frequency = r.frequency as 'weekly' | 'biweekly' | 'monthly'
    const occurrences = countOccurrencesInRange(
      r.next_occurrence,
      frequency,
      nextRange.start,
      nextRange.end
    )
    if (occurrences === 0) continue

    const unitAmount = Number(r.amount_original)
    const label = r.description.trim() || 'Mercado recurrente'

    if (predictions.some(p => p.itemName.toLowerCase() === label.toLowerCase())) {
      continue
    }

    predictions.push({
      itemName: label,
      avgUnitPrice: unitAmount,
      expectedPurchases: occurrences,
      projectedSpend: Math.round(unitAmount * occurrences * 100) / 100,
      lastPurchased: null,
    })
  }

  return predictions.sort((a, b) => b.projectedSpend - a.projectedSpend)
}
