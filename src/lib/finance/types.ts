import type { CurrencyCode } from '@/lib/household/types'

export type TransactionType = 'income' | 'expense' | 'adjustment'

export type Period = 'weekly' | 'monthly'

export type TransactionRow = {
  id?: string
  description?: string | null
  type: TransactionType
  amount_base: number
  transaction_date: string
  category_id?: string | null
  created_by?: string | null
  savings_goal_id?: string | null
  recurring_schedule_id?: string | null
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
  author_avatar_url: string | null
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

export type MemberSpendingStat = {
  userId: string
  name: string
  amount: number
  extraAmount: number
  percent: number
  avatarUrl: string | null
  extraAboveShare: number
  byCategory: {
    categoryName: string
    amount: number
    extraAmount: number
    percent: number
    color: string | null
  }[]
}

export type DashboardSummary = {
  realBalance: number
  balanceBreakdown: BalanceBreakdown
  monthlyIncome: number
  monthlyExpenses: number
  periodSavings: number
  periodRealSavings: number
  realSavingsBreakdown: { name: string; amount: number; color: string }[]
  savingsBreakdown: { name: string; amount: number; color: string }[]
  totalSavings: number
  guiltFreeMoney: number
  budgetDeficit: number
  scheduledFixedExpenses: number
  scheduledFixedIncome: number
  variableSpent: number
  expenseChangePercent: number | null
  topCategories: { name: string; amount: number; color: string | null }[]
  expenseGroups: { name: string; amount: number; color: string }[]
  savingsGoals: {
    name: string
    percent: number
    current: number
    target: number
    targetDate: string | null
    timeRemainingLabel: string
  }[]
  memberSpending: MemberSpendingStat[]
  period: Period
  periodOffset: number
  periodStart: string
  periodEnd: string
  periodLabel: string
  isClosedPeriod: boolean
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
  contribution_frequency: 'weekly' | 'monthly' | null
  auto_contribute: boolean
  next_contribution: string | null
  savings_mode: 'static' | 'compound'
  annual_interest_rate: number | null
  is_active: boolean
}

export type SavingsGoalInput = {
  target_amount: number
  current_amount: number
  contribution_amount: number | null
  contribution_frequency: 'weekly' | 'monthly' | null
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
  status: 'pending' | 'paid' | 'overdue'
  dueDate?: string
  paidAmount?: number
  paidDate?: string
  categoryName: string | null
  categoryIcon: string | null
  occurrences?: number
  dueInNextPeriod?: boolean
  autoRegister?: boolean
  assumedPaid?: boolean
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

export type RecurringScheduleItem = {
  id: string
  type: 'income' | 'expense'
  categoryId: string
  description: string
  amount: number
  currency: CurrencyCode
  frequency: 'weekly' | 'monthly'
  nextOccurrence: string
  nextBillingDate: string
  categoryName: string
  categoryIcon: string | null
  categoryColor: string | null
  autoRegister: boolean
}

export type UpdateRecurringScheduleInput = {
  id: string
  householdId: string
  type: 'income' | 'expense'
  categoryId: string
  description: string
  amount: number
  currency?: CurrencyCode
  frequency: 'weekly' | 'monthly'
  startDate: string
  autoRegister?: boolean
}

export type CreateRecurringScheduleInput = {
  householdId: string
  type: 'income' | 'expense'
  categoryId: string
  description: string
  amount: number
  currency?: CurrencyCode
  frequency: 'weekly' | 'monthly'
  startDate: string
  autoRegister?: boolean
}

export type CreateTransactionInput = {
  householdId: string
  type: 'income' | 'expense'
  categoryId: string
  description: string
  amount: number
  currency?: CurrencyCode
  transactionDate: string
  createdBy?: string
  isRecurring?: boolean
  frequency?: 'weekly' | 'monthly'
  lineItems?: LineItem[]
  savingsGoalId?: string
}

export type RecordSavingsContributionInput = {
  householdId: string
  goalId: string
  amount: number
  transactionDate?: string
  note?: string
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
  contributionFrequency?: 'weekly' | 'monthly'
  autoContribute?: boolean
  nextContribution?: string
  savingsMode?: 'static' | 'compound'
  annualInterestRate?: number
}

export type UpdateSavingsGoalInput = CreateSavingsGoalInput & {
  id: string
}
