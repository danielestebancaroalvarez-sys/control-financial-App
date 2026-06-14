'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { CurrencyCode } from './types'

export async function createHousehold(
  name: string,
  baseCurrency: CurrencyCode
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const trimmed = name.trim()
  if (!trimmed) return { error: 'El nombre del hogar es obligatorio.' }

  const { data: existing } = await supabase
    .from('household_members')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (existing) return { error: 'Ya perteneces a un hogar.' }

  const { error } = await supabase.from('households').insert({
    name: trimmed,
    base_currency: baseCurrency,
    created_by: user.id,
    invite_code: '',
  })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function joinHouseholdByCode(
  inviteCode: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const code = inviteCode.trim()
  if (!code) return { error: 'Ingresa un código de invitación.' }

  const { data: existing } = await supabase
    .from('household_members')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (existing) return { error: 'Ya perteneces a un hogar.' }

  const { error } = await supabase.rpc('join_household_by_code', {
    p_invite_code: code,
  })

  if (error) return { error: 'Código inválido. Verifica e intenta de nuevo.' }

  revalidatePath('/', 'layout')
  redirect('/')
}

const REVALIDATE_PATHS = ['/', '/buscar', '/ahorros', '/predicciones', '/nuevo', '/ajustes']

function revalidateApp() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path)
}

export async function resetHouseholdData(
  householdId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase.rpc('reset_household_data', {
    p_household_id: householdId,
  })

  if (error) return { error: error.message }

  revalidateApp()
  return {}
}
