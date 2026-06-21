import type { SplitAllocation, TripBudgetItem, TripSplitMode } from './types'
import { calculatePerPerson } from './budget'

export function buildEqualSplit(
  amountTotal: number,
  memberIds: string[]
): SplitAllocation[] {
  if (memberIds.length === 0) return []
  const perPerson = calculatePerPerson(amountTotal, memberIds.length)
  const sharePct = Math.round((100 / memberIds.length) * 100) / 100
  return memberIds.map(userId => ({
    userId,
    amount: perPerson,
    sharePct,
  }))
}

export function getMemberShare(
  item: TripBudgetItem,
  userId: string,
  memberIds: string[]
): number {
  if (item.splitMode === 'custom' && item.splitAllocations?.length) {
    const alloc = item.splitAllocations.find(a => a.userId === userId)
    return alloc?.amount ?? 0
  }
  return calculatePerPerson(item.amountTotal, memberIds.length)
}

export function resolveSplitAllocations(
  amountTotal: number,
  splitMode: TripSplitMode,
  memberIds: string[],
  custom?: SplitAllocation[] | null
): SplitAllocation[] | null {
  if (splitMode === 'equal') {
    return buildEqualSplit(amountTotal, memberIds)
  }
  return custom ?? buildEqualSplit(amountTotal, memberIds)
}
