import {
  calculateTripTotal,
  groupBudgetByCategory,
  sumBudgetItems,
  sumDailyEstimates,
  sumItineraryActivities,
} from './budget'
import type {
  TripBudgetItem,
  TripDailyEstimate,
  TripItineraryDay,
} from './types'

export type ExpenseForecastBreakdown = {
  fixedItems: number
  dailyEstimates: number
  itineraryActivities: number
  total: number
  byCategory: { category: TripBudgetItem['category']; total: number }[]
  dailyByCategory: { category: TripDailyEstimate['category']; total: number }[]
}

export function buildExpenseForecast(
  budgetItems: TripBudgetItem[],
  dailyEstimates: TripDailyEstimate[],
  itineraryDays: TripItineraryDay[]
): ExpenseForecastBreakdown {
  const fixedItems = sumBudgetItems(budgetItems)
  const dailyTotal = sumDailyEstimates(dailyEstimates)
  const itineraryTotal = sumItineraryActivities(itineraryDays)

  return {
    fixedItems,
    dailyEstimates: dailyTotal,
    itineraryActivities: itineraryTotal,
    total: calculateTripTotal(budgetItems, dailyEstimates, itineraryDays),
    byCategory: groupBudgetByCategory(budgetItems).map(g => ({
      category: g.category,
      total: g.total,
    })),
    dailyByCategory: dailyEstimates.map(e => ({
      category: e.category,
      total: e.amountPerDay * e.daysCount,
    })),
  }
}
