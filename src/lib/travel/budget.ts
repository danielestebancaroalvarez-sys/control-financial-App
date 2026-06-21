import type { TripBudgetItem, TripDailyEstimate, TripItineraryDay } from './types'

export function calculateItemTotal(quantity: number, unitAmount: number): number {
  return Math.round(quantity * unitAmount * 100) / 100
}

export function sumBudgetItems(items: TripBudgetItem[]): number {
  return items.reduce((sum, item) => sum + item.amountTotal, 0)
}

export function sumDailyEstimates(estimates: TripDailyEstimate[]): number {
  return estimates.reduce(
    (sum, est) => sum + est.amountPerDay * est.daysCount,
    0
  )
}

export function sumItineraryActivities(days: TripItineraryDay[]): number {
  return days.reduce(
    (sum, day) =>
      sum +
      day.activities.reduce(
        (daySum, act) => daySum + (act.estimatedCost ?? 0),
        0
      ),
    0
  )
}

export function calculateTripTotal(
  budgetItems: TripBudgetItem[],
  dailyEstimates: TripDailyEstimate[],
  itineraryDays: TripItineraryDay[]
): number {
  const raw =
    sumBudgetItems(budgetItems) +
    sumDailyEstimates(dailyEstimates) +
    sumItineraryActivities(itineraryDays)
  return Math.round(raw * 100) / 100
}

export function calculatePerPerson(
  total: number,
  travelersCount: number
): number {
  if (travelersCount <= 0) return total
  return Math.round((total / travelersCount) * 100) / 100
}

export function groupBudgetByCategory(
  items: TripBudgetItem[]
): { category: TripBudgetItem['category']; total: number; items: TripBudgetItem[] }[] {
  const map = new Map<TripBudgetItem['category'], TripBudgetItem[]>()
  for (const item of items) {
    const list = map.get(item.category) ?? []
    list.push(item)
    map.set(item.category, list)
  }
  return Array.from(map.entries())
    .map(([category, categoryItems]) => ({
      category,
      total: sumBudgetItems(categoryItems),
      items: categoryItems.sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .sort((a, b) => b.total - a.total)
}
