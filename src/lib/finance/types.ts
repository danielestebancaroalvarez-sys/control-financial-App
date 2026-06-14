import type { CurrencyCode } from '@/lib/household/types'

export type TransactionType = 'income' | 'expense' | 'adjustment'

export type TransactionRow = {
  type: TransactionType
  amount_base: number
  transaction_date: string
  category_id?: string | null
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
