import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import {
  getFinanceModuleProgress,
  getIsHouseholdOwner,
  getTimeModuleProgress,
} from './assistant-progress'
import type { AssistantState, AssistantStatus } from './assistant-types'

export const getAssistantState = cache(async (): Promise<AssistantState | null> => {
  const user = await getAuthUser()
  if (!user) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'assistant_finance_status, assistant_time_status, assistant_welcome_seen_at'
    )
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return null

  const isOwner = await getIsHouseholdOwner()
  const [financeProgress, timeProgress] = await Promise.all([
    getFinanceModuleProgress(isOwner),
    getTimeModuleProgress(),
  ])

  const financeStatus = (data.assistant_finance_status ??
    'unset') as AssistantStatus
  const timeStatus = (data.assistant_time_status ?? 'unset') as AssistantStatus

  return {
    welcomeSeen: !!data.assistant_welcome_seen_at,
    isOwner,
    finance: {
      ...financeProgress,
      status: financeStatus,
    },
    time: {
      ...timeProgress,
      status: timeStatus,
    },
  }
})

