export type AssistantModule = 'finance' | 'time'

export type AssistantStatus = 'unset' | 'active' | 'declined' | 'completed'

export type FinanceStepId =
  | 'profile'
  | 'period'
  | 'income'
  | 'fixed_expense'
  | 'subscription'
  | 'savings'

export type TimeStepId = 'profile' | 'sleep' | 'fixed_time' | 'activity' | 'first_task'

export type AssistantStep = {
  id: string
  label: string
  description: string
  href: string
  optional?: boolean
  completed: boolean
}

export type ModuleAssistantState = {
  status: AssistantStatus
  steps: AssistantStep[]
  completedCount: number
  totalCount: number
  requiredTotal: number
}

export type AssistantState = {
  welcomeSeen: boolean
  finance: ModuleAssistantState
  time: ModuleAssistantState
  isOwner: boolean
}

export function shouldShowWelcomeCard(state: AssistantState): boolean {
  if (state.welcomeSeen) return false
  return state.finance.status === 'unset' || state.time.status === 'unset'
}
