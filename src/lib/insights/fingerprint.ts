import { createHash } from 'crypto'
import type { InsightContext } from './gemini-insights'

export function computeInsightFingerprint(context: InsightContext): string {
  const payload = {
    periodEnd: context.periodEnd,
    income: Math.round(context.income * 100),
    expenses: Math.round(context.expenses * 100),
    guiltFreeMoney: Math.round(context.guiltFreeMoney * 100),
    periodSavings: Math.round(context.periodSavings * 100),
    totalSavings: Math.round(context.totalSavingsAccumulated * 100),
    topCategories: context.topCategories.map(c => [
      c.name,
      Math.round(c.amount * 100),
    ]),
    expenseGroups: context.expenseGroups.map(g => [
      g.name,
      Math.round(g.amount * 100),
    ]),
    savingsGoals: context.savingsGoals.map(g => [
      g.name,
      g.percent,
      Math.round(g.current * 100),
    ]),
    mercado: context.mercadoProjection
      ? {
          spent: Math.round(context.mercadoProjection.spentSoFar * 100),
          projected: Math.round(context.mercadoProjection.projectedTotal * 100),
          vsAvg: context.mercadoProjection.percentVsAverage,
          daysLeft: context.mercadoProjection.daysRemaining,
        }
      : null,
    pendingPayments: context.pendingPayments.map(p => [
      p.name,
      Math.round(p.amount * 100),
    ]),
    paidPaymentsCount: context.paidPaymentsCount,
    totalPaymentsCount: context.totalPaymentsCount,
    shoppingListDueCount: context.shoppingListDueCount,
  }

  return createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
    .slice(0, 16)
}
