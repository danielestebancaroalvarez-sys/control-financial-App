import type { CurrencyCode } from '@/lib/household/types'
import { formatMoney, getTodayString } from './format'
import { toMonthlyAmount } from './guilt-free'
import {
  estimateMonthsForGoalInput,
  monthsToReachTargetCompound,
  projectCompoundGrowth,
} from './savings'
import type { SavingsGoal, SavingsGoalInput } from './types'

export type SavingsPlanningMode = 'by_contribution' | 'by_date'

export function countPeriodsUntilDate(
  fromDate: string,
  targetDate: string,
  frequency: 'weekly' | 'monthly'
): number {
  const from = new Date(`${fromDate}T12:00:00`)
  const to = new Date(`${targetDate}T12:00:00`)
  if (to.getTime() <= from.getTime()) return 0

  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000)
  if (frequency === 'weekly') {
    return Math.max(1, Math.ceil(days / 7))
  }

  let months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  if (to.getDate() < from.getDate()) months -= 1
  return Math.max(1, months)
}

export function monthsBetweenDates(fromDate: string, targetDate: string): number {
  return countPeriodsUntilDate(fromDate, targetDate, 'monthly')
}

export function addMonthsToDate(dateStr: string, months: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function estimateTargetDateFromContribution(
  goal: SavingsGoalInput,
  fromDate: string = getTodayString()
): string | null {
  if (Number(goal.current_amount) >= Number(goal.target_amount)) return fromDate
  if (!goal.contribution_amount || goal.contribution_amount <= 0) return null

  if (goal.savings_mode === 'compound' && goal.annual_interest_rate) {
    const projection = projectCompoundGrowth(goal, 600)
    const target = Number(goal.target_amount)
    const hit = projection.find(p => p.balance >= target)
    if (!hit) return null
    return addMonthsToDate(fromDate, hit.month)
  }

  const months = estimateMonthsForGoalInput(goal)
  if (months === null || months <= 0) return null
  return addMonthsToDate(fromDate, months)
}

export function estimateContributionFromTargetDate(
  goal: SavingsGoalInput,
  targetDate: string,
  frequency: 'weekly' | 'monthly',
  fromDate: string = getTodayString()
): number | null {
  const target = Number(goal.target_amount)
  const current = Number(goal.current_amount)
  const remaining = target - current
  if (remaining <= 0) return 0

  const periods = countPeriodsUntilDate(fromDate, targetDate, frequency)
  if (periods <= 0) return null

  if (goal.savings_mode === 'compound' && goal.annual_interest_rate) {
    const monthsUntil = monthsBetweenDates(fromDate, targetDate)
    let low = 0
    let high = Math.max(remaining, 1)
    for (let i = 0; i < 48; i++) {
      const mid = (low + high) / 2
      const testGoal: SavingsGoalInput = {
        ...goal,
        contribution_amount: mid,
        contribution_frequency: frequency,
      }
      const months = monthsToReachTargetCompound(testGoal)
      if (months === null || months > monthsUntil) {
        low = mid
      } else {
        high = mid
      }
    }
    return Math.ceil(high * 100) / 100
  }

  return Math.ceil((remaining / periods) * 100) / 100
}

export function inferPlanningMode(goal: SavingsGoal): SavingsPlanningMode {
  if (goal.target_date && (!goal.contribution_amount || goal.contribution_amount <= 0)) {
    return 'by_date'
  }
  return 'by_contribution'
}

function formatShortDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatPlanningSummary(
  goal: SavingsGoal,
  currency: CurrencyCode
): { mode: SavingsPlanningMode; primary: string; secondary: string | null } {
  const mode = inferPlanningMode(goal)

  if (goal.current_amount >= goal.target_amount) {
    return { mode, primary: 'Meta alcanzada', secondary: null }
  }

  if (mode === 'by_date' && goal.target_date) {
    const input: SavingsGoalInput = {
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      contribution_amount: goal.contribution_amount,
      contribution_frequency: goal.contribution_frequency,
      savings_mode: goal.savings_mode,
      annual_interest_rate: goal.annual_interest_rate,
      target_date: goal.target_date,
    }
    const needed = estimateContributionFromTargetDate(
      input,
      goal.target_date,
      goal.contribution_frequency ?? 'monthly'
    )
    const freqLabel = goal.contribution_frequency === 'weekly' ? 'semana' : 'mes'
    return {
      mode,
      primary: needed
        ? `Aporta ${formatMoney(needed, currency)} por ${freqLabel}`
        : 'La fecha objetivo ya pasó o no es válida',
      secondary: `Para el ${formatShortDate(goal.target_date)}`,
    }
  }

  const input: SavingsGoalInput = {
    target_amount: goal.target_amount,
    current_amount: goal.current_amount,
    contribution_amount: goal.contribution_amount,
    contribution_frequency: goal.contribution_frequency,
    savings_mode: goal.savings_mode,
    annual_interest_rate: goal.annual_interest_rate,
    target_date: null,
  }
  const estimatedDate = estimateTargetDateFromContribution(input)
  const freqLabel = goal.contribution_frequency === 'weekly' ? 'semanal' : 'mensual'

  return {
    mode,
    primary: goal.contribution_amount
      ? `Aporte ${formatMoney(goal.contribution_amount, currency)} ${freqLabel}`
      : 'Define un aporte periódico',
    secondary: estimatedDate
      ? `Llegarías el ${formatShortDate(estimatedDate)}`
      : null,
  }
}

export function goalInputFromForm(form: {
  target: string
  current: string
  contribution: string
  contributionFrequency: 'weekly' | 'monthly'
  mode: 'static' | 'compound'
  rate: string
  targetDate: string
  planningMode: SavingsPlanningMode
}): SavingsGoalInput {
  return {
    target_amount: parseFloat(form.target) || 0,
    current_amount: parseFloat(form.current) || 0,
    contribution_amount:
      form.planningMode === 'by_contribution' && form.contribution
        ? parseFloat(form.contribution)
        : null,
    contribution_frequency:
      form.planningMode === 'by_contribution' && form.contribution
        ? form.contributionFrequency
        : form.planningMode === 'by_date'
          ? form.contributionFrequency
          : null,
    savings_mode: form.mode,
    annual_interest_rate:
      form.mode === 'compound' && form.rate ? parseFloat(form.rate) / 100 : null,
    target_date: form.planningMode === 'by_date' && form.targetDate ? form.targetDate : null,
  }
}

export function resolveSavingsPayloadFromForm(form: {
  target: string
  current: string
  contribution: string
  contributionFrequency: 'weekly' | 'monthly'
  contributionMode: string
  contributionStartDate: string
  mode: 'static' | 'compound'
  rate: string
  targetDate: string
  planningMode: SavingsPlanningMode
}):
  | { error: string }
  | {
      targetDate?: string
      contributionAmount: number
      contributionFrequency: 'weekly' | 'monthly'
    } {
  const baseInput = goalInputFromForm(form)

  if (form.planningMode === 'by_date') {
    if (!form.targetDate) {
      return { error: 'Indica la fecha en que quieres lograr la meta.' as const }
    }
    const contribution = estimateContributionFromTargetDate(
      baseInput,
      form.targetDate,
      form.contributionFrequency
    )
    if (contribution === null || contribution <= 0) {
      return {
        error: 'La fecha debe ser futura y dejar tiempo para ahorrar.' as const,
      }
    }
    return {
      targetDate: form.targetDate,
      contributionAmount: contribution,
      contributionFrequency: form.contributionFrequency,
    }
  }

  if (!form.contribution || parseFloat(form.contribution) <= 0) {
    return { error: 'Indica cuánto puedes aportar cada periodo.' as const }
  }

  return {
    targetDate: undefined,
    contributionAmount: parseFloat(form.contribution),
    contributionFrequency: form.contributionFrequency,
  }
}

export function monthlyEquivalent(
  amount: number,
  frequency: 'weekly' | 'monthly'
): number {
  return toMonthlyAmount(amount, frequency)
}
