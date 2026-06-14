import { addFrequency } from './format'
import type { Period, SavingsGoal } from './types'

const SAVINGS_COLORS = ['#F59E0B', '#FBBF24', '#F97316', '#EAB308', '#D97706']

function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00`)
  const b = new Date(`${end}T12:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function countContributionSlots(
  frequency: 'weekly' | 'biweekly' | 'monthly',
  rangeStart: string,
  rangeEnd: string,
  period: Period
): number {
  const days = daysBetween(rangeStart, rangeEnd) + 1
  if (days <= 0) return 0

  if (frequency === 'weekly') {
    return Math.max(1, Math.floor(days / 7))
  }

  if (frequency === 'biweekly') {
    let date = rangeStart
    let count = 0
    let guard = 0
    while (date <= rangeEnd && guard < 60) {
      count++
      date = addFrequency(date, 'biweekly')
      guard++
    }
    return count
  }

  if (period === 'monthly') return 1
  return days >= 7 ? 1 : 0
}

export type PeriodSavingsAllocation = {
  name: string
  amount: number
  color: string
}

export function calculatePeriodSavingsAllocations(
  goals: SavingsGoal[],
  period: Period,
  rangeStart: string,
  rangeEnd: string
): { total: number; items: PeriodSavingsAllocation[] } {
  const items: PeriodSavingsAllocation[] = []
  let colorIndex = 0

  for (const goal of goals) {
    const contribution = goal.contribution_amount
    if (!contribution || contribution <= 0) continue

    const frequency = goal.contribution_frequency ?? 'monthly'
    const slots = countContributionSlots(frequency, rangeStart, rangeEnd, period)
    if (slots <= 0) continue

    const amount = Math.round(contribution * slots * 100) / 100
    items.push({
      name: goal.name,
      amount,
      color: goal.color ?? SAVINGS_COLORS[colorIndex % SAVINGS_COLORS.length],
    })
    colorIndex++
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0)
  return { total, items }
}
