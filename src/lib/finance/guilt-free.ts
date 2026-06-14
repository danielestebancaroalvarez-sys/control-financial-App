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

export function calculateGuiltFreeMoney(
  periodIncome: number,
  periodExpenses: number,
  periodSavings = 0
): number {
  return periodIncome - periodExpenses - periodSavings
}
