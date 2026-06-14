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

export type MarketProductGroup =
  | 'carne'
  | 'aseo'
  | 'frutas-verduras'
  | 'lacteos'
  | 'panaderia'
  | 'bebidas'
  | 'otros'

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
  receipt_image_path: string | null
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
  periodSavings: number
  savingsBreakdown: { name: string; amount: number; color: string }[]
  totalSavings: number
  guiltFreeMoney: number
  budgetDeficit: number
  topCategories: { name: string; amount: number; color: string | null }[]
  expenseGroups: { name: string; amount: number; color: string }[]
  savingsGoals: { name: string; percent: number; current: number; target: number }[]
  period: Period
  periodOffset: number
  periodStart: string
  periodEnd: string
  periodLabel: string
  trend: { offset: number; label: string; income: number; expenses: number }[]
  allCategories: { name: string; amount: number; color: string | null }[]
}

export type SavingsGoal = {
  id: string
  name: string
  category: string
  icon: string
  color: string
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
  categoryName: string | null
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
  upcomingPayments: FixedServiceStatus[]
  currentPeriodPayments: FixedServiceStatus[]
  purchasePredictions: ItemPurchasePrediction[]
  consumptionPredictions: ConsumptionPrediction[]
  nextPeriodStart: string
  nextPeriodEnd: string
  currentPeriodStart: string
  currentPeriodEnd: string
  period: Period
}

export type WeeklyInsight = {
  summary: string
  tips: string[]
  generatedAt: string
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

export type UpdateTransactionInput = {
  id: string
  householdId: string
  type: 'income' | 'expense'
  categoryId: string
  description: string
  amount: number
  currency?: CurrencyCode
  transactionDate: string
  lineItems?: LineItem[]
}

export type CreateSavingsGoalInput = {
  householdId: string
  name: string
  category?: string
  icon?: string
  color?: string
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
