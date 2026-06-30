'use client'

import { fetchAssistantState } from './assistant-actions'

export async function getNextFinanceStepHref(): Promise<string | null> {
  const state = await fetchAssistantState()
  if (!state?.isOwner) return null
  const next = state.finance.steps.find(s => !s.completed)
  return next?.href ?? null
}
