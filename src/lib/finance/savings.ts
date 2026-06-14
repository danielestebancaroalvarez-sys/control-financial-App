import type { CompoundProjectionPoint, SavingsGoalInput } from './types'
import { toMonthlyAmount } from './guilt-free'

export function estimateMonthsToGoalStatic(
  target: number,
  current: number,
  monthlyContribution: number
): number | null {
  const remaining = target - current
  if (remaining <= 0) return 0
  if (monthlyContribution <= 0) return null
  return Math.ceil(remaining / monthlyContribution)
}

export function projectCompoundGrowth(
  goal: SavingsGoalInput,
  maxMonths = 120
): CompoundProjectionPoint[] {
  const monthlyRate =
    goal.savings_mode === 'compound' && goal.annual_interest_rate
      ? Number(goal.annual_interest_rate) / 12
      : 0

  const monthlyContribution = goal.contribution_amount
    ? toMonthlyAmount(
        Number(goal.contribution_amount),
        goal.contribution_frequency ?? 'monthly'
      )
    : 0

  const points: CompoundProjectionPoint[] = []
  let balance = Number(goal.current_amount)

  for (let month = 0; month <= maxMonths; month++) {
    points.push({ month, balance: Math.round(balance * 100) / 100 })
    if (balance >= Number(goal.target_amount)) break
    balance = balance * (1 + monthlyRate) + monthlyContribution
  }

  return points
}

export function monthsToReachTargetCompound(
  goal: SavingsGoalInput
): number | null {
  const projection = projectCompoundGrowth(goal)
  const target = Number(goal.target_amount)
  const hit = projection.find(p => p.balance >= target)
  return hit ? hit.month : null
}
