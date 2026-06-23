import type { CompoundProjectionPoint, SavingsGoalInput, SavingsGoal } from './types'
import { toMonthlyAmount } from './guilt-free'
import {
  estimateContributionFromTargetDate,
  estimateTargetDateFromContribution,
  inferPlanningMode,
} from './savings-plan'

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

  const mode = inferPlanningMode(goal)

  if (mode === 'by_date' && goal.target_date) {
    const needed = estimateContributionFromTargetDate(
      {
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        contribution_amount: goal.contribution_amount,
        contribution_frequency: goal.contribution_frequency,
        savings_mode: goal.savings_mode,
        annual_interest_rate: goal.annual_interest_rate,
        target_date: goal.target_date,
      },
      goal.target_date,
      goal.contribution_frequency ?? 'monthly'
    )
    if (needed === null) return 'La fecha objetivo ya pasó o no es válida'
    const freq = goal.contribution_frequency === 'weekly' ? 'semana' : 'mes'
    const dateLabel = new Date(`${goal.target_date}T12:00:00`).toLocaleDateString(
      'es',
      { day: 'numeric', month: 'short', year: 'numeric' }
    )
    return `Para el ${dateLabel}: aporta ${needed.toLocaleString('es')} por ${freq}`
  }

  const estimatedDate = estimateTargetDateFromContribution({
    target_amount: goal.target_amount,
    current_amount: goal.current_amount,
    contribution_amount: goal.contribution_amount,
    contribution_frequency: goal.contribution_frequency,
    savings_mode: goal.savings_mode,
    annual_interest_rate: goal.annual_interest_rate,
    target_date: null,
  })

  if (!estimatedDate) return 'Agrega un aporte periódico para estimar la fecha'

  const dateLabel = new Date(`${estimatedDate}T12:00:00`).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `Llegarías aprox. el ${dateLabel}`
}

export function estimateMonthsForGoalInput(goal: SavingsGoalInput): number | null {
  const monthly = goal.contribution_amount
    ? toMonthlyAmount(
        Number(goal.contribution_amount),
        goal.contribution_frequency ?? 'monthly'
      )
    : 0

  if (goal.savings_mode === 'compound' && goal.annual_interest_rate) {
    return monthsToReachTargetCompound(goal)
  }

  return estimateMonthsToGoalStatic(
    Number(goal.target_amount),
    Number(goal.current_amount),
    monthly
  )
}

export function applyContributionBoost(
  goal: SavingsGoalInput,
  extraMonthly: number
): SavingsGoalInput {
  if (!goal.contribution_amount || extraMonthly <= 0) {
    return {
      ...goal,
      contribution_amount: (goal.contribution_amount ?? 0) + extraMonthly,
      contribution_frequency: goal.contribution_frequency ?? 'monthly',
    }
  }

  const currentMonthly = toMonthlyAmount(
    Number(goal.contribution_amount),
    goal.contribution_frequency ?? 'monthly'
  )

  return {
    ...goal,
    contribution_amount: currentMonthly + extraMonthly,
    contribution_frequency: 'monthly',
  }
}

export function formatMonthsLabel(months: number | null): string {
  if (months === null) return 'Sin estimación'
  if (months === 0) return 'Meta alcanzada'
  if (months < 12) return `${months} mes${months === 1 ? '' : 'es'}`
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return `${years} año${years === 1 ? '' : 's'}`
  return `${years}a ${rem}m`
}
