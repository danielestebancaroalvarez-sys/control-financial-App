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
  getTodayString,
} from './format'
import { buildConsumptionPrediction } from './consumption-prediction'
import { CONSUMPTION_PREDICTION_CATEGORIES } from './consumption-categories'
import { parseLineItems } from './category-radar'
import {
  countOccurrencesInRange,
  getPrimaryDueDateInRange,
} from './recurring-occurrences'

type RecurringRow = {
  id: string
  description: string
  amount_original: number
  frequency: string
  next_occurrence: string
  auto_register: boolean
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
  recurring_schedule_id?: string | null
}

const AMOUNT_TOLERANCE = 0.2

function amountsClose(expected: number, actual: number): boolean {
  if (expected <= 0) return actual > 0
  return Math.abs(actual - expected) / expected <= AMOUNT_TOLERANCE
}

function detectPaymentStatus(
  r: RecurringRow,
  rangeStart: string,
  rangeEnd: string,
  transactions: TxRow[]
): Pick<FixedServiceStatus, 'status' | 'paidAmount' | 'paidDate'> {
  const periodTx = transactions.filter(
    tx =>
      tx.transaction_date >= rangeStart && tx.transaction_date <= rangeEnd
  )

  const bySchedule = periodTx.filter(tx => tx.recurring_schedule_id === r.id)
  if (bySchedule.length > 0) {
    const paidAmount = bySchedule.reduce((s, tx) => s + Number(tx.amount_base), 0)
    const paidDate = [...bySchedule.map(tx => tx.transaction_date)].sort().at(-1)
    return {
      status: 'paid',
      paidAmount: Math.round(paidAmount * 100) / 100,
      paidDate,
    }
  }

  const cat = r.categories
  const unitAmount = Number(r.amount_original)
  const expectedTotal = unitAmount

  const categoryMatches = periodTx.filter(tx => tx.category_id === r.category_id)
  if (categoryMatches.length === 0) {
    return { status: 'pending' }
  }

  if (cat?.is_fixed || cat?.is_subscription) {
    const paidAmount = categoryMatches.reduce(
      (s, tx) => s + Number(tx.amount_base),
      0
    )
    const paidDate = [...categoryMatches.map(tx => tx.transaction_date)].sort().at(-1)
    if (paidAmount > 0) {
      return {
        status: 'paid',
        paidAmount: Math.round(paidAmount * 100) / 100,
        paidDate,
      }
    }
  }

  const closeMatch = categoryMatches.find(tx =>
    amountsClose(expectedTotal, Number(tx.amount_base))
  )
  if (closeMatch) {
    return {
      status: 'paid',
      paidAmount: Math.round(Number(closeMatch.amount_base) * 100) / 100,
      paidDate: closeMatch.transaction_date,
    }
  }

  return { status: 'pending' }
}

function mapRecurringPayment(
  r: RecurringRow,
  rangeStart: string,
  rangeEnd: string,
  transactions: TxRow[],
  dueInNextPeriod: boolean
): FixedServiceStatus | null {
  const frequency = (r.frequency === 'biweekly' ? 'monthly' : r.frequency) as
    | 'weekly'
    | 'monthly'
  const occurrences = countOccurrencesInRange(
    r.next_occurrence,
    frequency,
    rangeStart,
    rangeEnd
  )

  if (occurrences === 0) return null

  const cat = r.categories
  const unitAmount = Number(r.amount_original)
  const dueDate =
    getPrimaryDueDateInRange(r.next_occurrence, frequency, rangeStart, rangeEnd) ??
    undefined
  const today = getTodayString()

  let paymentStatus = detectPaymentStatus(r, rangeStart, rangeEnd, transactions)
  let assumedPaid = false

  if (
    r.auto_register &&
    paymentStatus.status === 'pending' &&
    dueDate &&
    dueDate <= today
  ) {
    paymentStatus = {
      status: 'paid',
      paidAmount: Math.round(unitAmount * occurrences * 100) / 100,
      paidDate: dueDate,
    }
    assumedPaid = true
  }

  let status = paymentStatus.status
  if (!r.auto_register && status === 'pending' && dueDate && dueDate < today) {
    status = 'overdue'
  }

  return {
    id: r.id,
    name: r.description.trim() || cat?.name || 'Gasto',
    amount: Math.round(unitAmount * occurrences * 100) / 100,
    frequency: r.frequency,
    occurrences,
    categoryName: cat?.name ?? null,
    categoryIcon: cat?.icon ?? null,
    dueInNextPeriod,
    dueDate,
    autoRegister: r.auto_register,
    assumedPaid,
    ...paymentStatus,
    status,
  }
}

export function buildPredictionsSummary(
  recurring: RecurringRow[],
  transactions: TxRow[],
  expenseCategories: { id: string; name: string }[],
  period: Period = 'monthly'
): PredictionsSummary {
  const nextRange = getNextPeriodRange(period)
  const currentRange = getPeriodRange(period)

  const currentPeriodPayments = recurring
    .map(r =>
      mapRecurringPayment(
        r,
        currentRange.start,
        currentRange.end,
        transactions,
        false
      )
    )
    .filter((s): s is FixedServiceStatus => s !== null)
    .sort((a, b) => {
      const order = { overdue: 0, pending: 1, paid: 2 }
      if (a.status !== b.status) return order[a.status] - order[b.status]
      return (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
    })

  const unpaidCurrentIds = new Set(
    currentPeriodPayments
      .filter(p => p.status === 'pending' || p.status === 'overdue')
      .map(p => p.id)
  )

  const upcomingPayments = recurring
    .map(r =>
      mapRecurringPayment(r, nextRange.start, nextRange.end, transactions, true)
    )
    .filter((s): s is FixedServiceStatus => s !== null)
    .filter(s => !unpaidCurrentIds.has(s.id))
    .sort((a, b) => {
      const da = a.dueDate ?? ''
      const db = b.dueDate ?? ''
      if (da !== db) return da.localeCompare(db)
      return b.amount - a.amount
    })

  const mercadoCategoryId =
    expenseCategories.find(c => c.name === 'Mercado')?.id ?? null

  const purchasePredictions = buildItemPurchasePredictions(
    transactions,
    mercadoCategoryId,
    period
  )

  const consumptionPredictions: PredictionsSummary['consumptionPredictions'] = []

  for (const categoryName of CONSUMPTION_PREDICTION_CATEGORIES) {
    const category = expenseCategories.find(c => c.name === categoryName)
    if (!category) continue

    const prediction = buildConsumptionPrediction(
      transactions,
      category.id,
      category.name,
      period
    )
    if (prediction) {
      consumptionPredictions.push(prediction)
    }
  }

  consumptionPredictions.sort((a, b) => b.percentVsAverage - a.percentVsAverage)

  return {
    upcomingPayments,
    currentPeriodPayments,
    purchasePredictions,
    consumptionPredictions,
    nextPeriodStart: nextRange.start,
    nextPeriodEnd: nextRange.end,
    currentPeriodStart: currentRange.start,
    currentPeriodEnd: currentRange.end,
    period,
  }
}

function buildItemPurchasePredictions(
  transactions: TxRow[],
  mercadoCategoryId: string | null,
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
    : []

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

  return predictions.sort((a, b) => b.projectedSpend - a.projectedSpend)
}
