import type { Period } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

export type SetupMode = 'full' | 'member'

export type SetupContext = {
  householdId: string
  householdName: string
  currency: CurrencyCode
  inviteCode: string
  isOwner: boolean
  mode: SetupMode
  memberCount: number
}

export type FixedExpenseInput = {
  categoryName: string
  amount: number
}

export type InitialSetupInput = {
  householdId: string
  mode: SetupMode
  monthlyIncome?: number
  fixedExpenses?: FixedExpenseInput[]
  savingsGoalName?: string
  savingsMonthly?: number
  savingsTarget?: number
  dashboardPeriod: Period
}
