import type { CompoundProjectionPoint, SavingsGoalInput, SavingsGoal } from './types'
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

export function formatEstimatedTime(goal: SavingsGoal): string {
  if (goal.current_amount >= goal.target_amount) return 'Meta alcanzada'

  const monthly = goal.contribution_amount
    ? toMonthlyAmount(
        goal.contribution_amount,
        goal.contribution_frequency ?? 'monthly'
      )
    : 0

  let months: number | null
  if (goal.savings_mode === 'compound' && goal.annual_interest_rate) {
    months = monthsToReachTargetCompound({
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      contribution_amount: goal.contribution_amount,
      contribution_frequency: goal.contribution_frequency,
      savings_mode: goal.savings_mode,
      annual_interest_rate: goal.annual_interest_rate,
      target_date: goal.target_date,
    })
  } else {
    months = estimateMonthsToGoalStatic(
      goal.target_amount,
      goal.current_amount,
      monthly
    )
  }

  if (months === null) return 'Agrega un aporte periódico para estimar el tiempo'
  if (months === 0) return 'Meta alcanzada'

  if (months < 12) {
    return `Tiempo estimado: ${months} mes${months === 1 ? '' : 'es'}`
  }

  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) {
    return `Tiempo estimado: ${years} año${years === 1 ? '' : 's'}`
  }
  return `Tiempo estimado: ${years} año${years === 1 ? '' : 's'} y ${rem} mes${rem === 1 ? '' : 'es'}`
}
