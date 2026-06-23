'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import {
  getFinanceModuleProgress,
  getIsHouseholdOwner,
  getTimeModuleProgress,
  isModuleSetupComplete,
} from './assistant-progress'
import { getAssistantState } from './assistant-queries'
import type { AssistantModule, AssistantState, AssistantStatus } from './assistant-types'

const REVALIDATE_PATHS = [
  '/',
  '/tiempo',
  '/ajustes',
  '/tiempo/ajustes',
  '/fijos',
  '/nuevo',
  '/tiempo/actividades',
  '/tiempo/nuevo',
]

function revalidateAssistant() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path)
  }
}

async function updateStatusColumn(
  module: AssistantModule,
  status: AssistantStatus
): Promise<{ error?: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const column =
    module === 'finance' ? 'assistant_finance_status' : 'assistant_time_status'

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ [column]: status })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidateAssistant()
  return {}
}

async function maybeAutoComplete(module: AssistantModule): Promise<void> {
  const complete = await isModuleSetupComplete(module)
  if (complete) {
    await updateStatusColumn(module, 'completed')
  }
}

export async function setAssistantStatus(
  module: AssistantModule,
  status: AssistantStatus
): Promise<{ error?: string }> {
  const result = await updateStatusColumn(module, status)
  if (!result.error && status === 'active') {
    await maybeAutoComplete(module)
  }
  return result
}

export async function markAssistantWelcomeSeen(): Promise<{ error?: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ assistant_welcome_seen_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidateAssistant()
  return {}
}

export async function activateAssistant(
  module: AssistantModule
): Promise<{ error?: string }> {
  await markAssistantWelcomeSeen()
  return setAssistantStatus(module, 'active')
}

export async function exploreFreely(): Promise<{ error?: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('assistant_finance_status, assistant_time_status')
    .eq('id', user.id)
    .maybeSingle()

  const updates: Record<string, string> = {
    assistant_welcome_seen_at: new Date().toISOString(),
  }

  if (data?.assistant_finance_status === 'unset') {
    updates.assistant_finance_status = 'declined'
  }
  if (data?.assistant_time_status === 'unset') {
    updates.assistant_time_status = 'declined'
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
  if (error) return { error: error.message }

  revalidateAssistant()
  return {}
}

export async function refreshAssistantProgress(
  module: AssistantModule
): Promise<{ error?: string }> {
  const state = await getAssistantState()
  if (!state) return { error: 'Sin sesión.' }

  const moduleState = module === 'finance' ? state.finance : state.time
  if (moduleState.status !== 'active') return {}

  await maybeAutoComplete(module)
  revalidateAssistant()
  return {}
}

export async function fetchAssistantState(): Promise<AssistantState | null> {
  return getAssistantState()
}
