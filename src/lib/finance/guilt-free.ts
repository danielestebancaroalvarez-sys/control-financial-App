export function toMonthlyAmount(
  amount: number,
  frequency: 'weekly' | 'biweekly' | 'monthly'
): number {
  switch (frequency) {
    case 'weekly':
      return amount * (52 / 12)
    case 'biweekly':
      return amount * (26 / 12)
    case 'monthly':
      return amount
  }
}

/** Presupuesto libre según APP_VISION: ingresos − fijos programados − metas de ahorro − gasto variable ya hecho */
export function calculateGuiltFreeMoney(
  periodIncome: number,
  scheduledFixedExpenses: number,
  periodSavings: number,
  variableSpent: number
): number {
  const discretionaryBudget =
    periodIncome - scheduledFixedExpenses - periodSavings
  return Math.round((discretionaryBudget - variableSpent) * 100) / 100
}
