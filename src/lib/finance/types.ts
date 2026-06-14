import type { CurrencyCode } from '@/lib/household/types'

export type TransactionType = 'income' | 'expense' | 'adjustment'

export type Period = 'weekly' | 'monthly'

export type TransactionRow = {
  type: TransactionType
  amount_base: number
  transaction_date: string
  category_id?: string | null
}

export type Category = {
  id: string
  name: string
  type: 'income' | 'expense'
  icon: string | null
  color: string | null
  is_fixed: boolean
  is_subscription: boolean
  is_system: boolean
}

export type LineItem = {
  name: string
  price: number
}

export type TransactionListItem = {
  id: string
  type: TransactionType
  description: string
  transaction_date: string
  amount_base: number
  amount_original: number
  currency_original: CurrencyCode
  category_id: string | null
  category_name: string | null
  category_icon: string | null
  category_color: string | null
  created_by: string
  author_name: string | null
  line_items: LineItem[] | null
}

export type SearchFilters = {
  q?: string
  type?: 'income' | 'expense' | 'all'
  categoryId?: string
  createdBy?: string
  startDate?: string
  endDate?: string
}

export type BalanceBreakdown = {
  income: number
  expense: number
  adjustment: number
  balance: number
}

export type DashboardSummary = {
  realBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  totalSavings: number
  guiltFreeMoney: number
  topCategories: { name: string; amount: number; color: string | null }[]
  savingsGoals: { name: string; percent: number; current: number; target: number }[]
  period: Period
}

export type SavingsGoal = {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  contribution_amount: number | null
  contribution_frequency: 'weekly' | 'biweekly' | 'monthly' | null
  savings_mode: 'static' | 'compound'
  annual_interest_rate: number | null
  is_active: boolean
}

export type SavingsGoalInput = {
  target_amount: number
  current_amount: number
  contribution_amount: number | null
  contribution_frequency: 'weekly' | 'biweekly' | 'monthly' | null
  savings_mode: 'static' | 'compound'
  annual_interest_rate: number | null
  target_date: string | null
}

export type CompoundProjectionPoint = {
  month: number
  balance: number
}

export type FixedServiceStatus = {
  id: string
  name: string
  amount: number
  frequency: string
  status: 'pending' | 'paid'
  paidAmount?: number
  paidDate?: string
  categoryIcon: string | null
  occurrences?: number
  dueInNextPeriod?: boolean
}

export type ItemPurchasePrediction = {
  itemName: string
  avgUnitPrice: number
  expectedPurchases: number
  projectedSpend: number
  lastPurchased: string | null
}

export type ConsumptionPrediction = {
  categoryName: string
  spentSoFar: number
  projectedTotal: number
  historicalAverage: number
  percentVsAverage: number
  daysRemaining: number
  period: Period
}

export type PredictionsSummary = {
  fixedServices: FixedServiceStatus[]
  subscriptions: FixedServiceStatus[]
  purchasePredictions: ItemPurchasePrediction[]
  nextPeriodStart: string
  nextPeriodEnd: string
  period: Period
}

export type CreateTransactionInput = {
  householdId: string
  type: 'income' | 'expense'
  categoryId: string
  description: string
  amount: number
  currency?: CurrencyCode
  transactionDate: string
  isRecurring?: boolean
  frequency?: 'weekly' | 'biweekly' | 'monthly'
  lineItems?: LineItem[]
}

export type CreateSavingsGoalInput = {
  householdId: string
  name: string
  targetAmount: number
  currentAmount?: number
  targetDate?: string
  contributionAmount?: number
  contributionFrequency?: 'weekly' | 'biweekly' | 'monthly'
  savingsMode?: 'static' | 'compound'
  annualInterestRate?: number
}

export type UpdateSavingsGoalInput = CreateSavingsGoalInput & {
  id: string
}
