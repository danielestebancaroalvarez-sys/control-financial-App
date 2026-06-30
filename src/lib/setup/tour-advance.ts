'use client'

import type { AssistantModule } from './assistant-types'
import { fetchAssistantState } from './assistant-actions'

export async function getNextFinanceStepHref(): Promise<string | null> {
  const state = await fetchAssistantState()
  if (!state?.isOwner) return null
  const next = state.finance.steps.find(s => !s.completed)
  return next?.href ?? null
}

export async function getNextTimeStepHref(): Promise<string | null> {
  const state = await fetchAssistantState()
  if (!state?.isOwner) return null
  const next = state.time.steps.find(s => !s.completed)
  return next?.href ?? null
}

export async function getNextModuleStepHref(
  module: AssistantModule
): Promise<string | null> {
  return module === 'time' ? getNextTimeStepHref() : getNextFinanceStepHref()
}
