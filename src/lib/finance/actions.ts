'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { isValidCategoryIcon, DEFAULT_CATEGORY_ICON } from './category-icons'
import {
  getSavingsCategory,
  isValidSavingsCategoryId,
} from './savings-categories'
import { syncUserProfileFromMetadata } from '@/lib/profile/sync'
import { getRealBalance, getHouseholdBaseCurrency } from './queries'
import { fetchExchangeRate, prepareTransactionAmounts } from './currency'
import {
  applySavingsGoalDelta,
  getSavingsContributionCategoryId,
} from './savings-contribution'
import { getTodayString } from './format'
import type {
  CreateRecurringScheduleInput,
  CreateSavingsGoalInput,
  CreateTransactionInput,
  RecordSavingsContributionInput,
  UpdateSavingsGoalInput,
  UpdateTransactionInput,
} from './types'

const REVALIDATE_PATHS = ['/', '/buscar', '/ahorros', '/predicciones', '/nuevo', '/ajustes', '/fijos']

function revalidateAll() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path)
}

export async function reconcileBalance(
  householdId: string,
  bankBalance: number
): Promise<{ error?: string; adjustment?: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const appBalance = await getRealBalance(householdId)
  const adjustment = Math.round((bankBalance - appBalance) * 100) / 100

  if (adjustment === 0) {
    return { error: 'El saldo ya coincide con el banco. No hay ajuste necesario.' }
  }

  const baseCurrency = await getHouseholdBaseCurrency(householdId)

  const { data: reconciliation, error: reconError } = await supabase
    .from('reconciliations')
    .insert({
      household_id: householdId,
      created_by: user.id,
      app_balance: appBalance,
      bank_balance: bankBalance,
      adjustment_amount: adjustment,
      notes: 'Ajuste bancario automático',
    })
    .select('id')
    .single()

  if (reconError || !reconciliation) {
    return { error: reconError?.message ?? 'No se pudo crear la reconciliación.' }
  }

  const { data: adjustmentTx, error: txError } = await supabase
    .from('transactions')
    .insert({
      household_id: householdId,
      created_by: user.id,
      type: 'adjustment',
      description: `Ajuste bancario (${adjustment >= 0 ? '+' : ''}${adjustment} ${baseCurrency})`,
      transaction_date: new Date().toISOString().slice(0, 10),
      amount_original: Math.abs(adjustment),
      currency_original: baseCurrency,
      exchange_rate: 1,
      amount_base: adjustment,
      currency_base: baseCurrency,
      reconciliation_id: reconciliation.id,
      is_auto_adjustment: true,
    })
    .select('id')
    .single()

  if (txError || !adjustmentTx) {
    return { error: txError?.message ?? 'No se pudo crear la transacción de ajuste.' }
  }

  await supabase
    .from('reconciliations')
    .update({ adjustment_transaction_id: adjustmentTx.id })
    .eq('id', reconciliation.id)

  revalidateAll()
  return { adjustment }
}

export async function createRecurringSchedule(
  input: CreateRecurringScheduleInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  await syncUserProfileFromMetadata()

  const baseCurrency = await getHouseholdBaseCurrency(input.householdId)
  const currency = input.currency ?? baseCurrency

  if (input.amount <= 0) return { error: 'El monto debe ser mayor a cero.' }
  if (!input.description.trim()) return { error: 'La descripción es obligatoria.' }

  const { data: schedule, error } = await supabase
    .from('recurring_schedules')
    .insert({
      household_id: input.householdId,
      created_by: user.id,
      category_id: input.categoryId,
      type: input.type,
      description: input.description.trim(),
      amount_original: input.amount,
      currency_original: currency,
      frequency: input.frequency,
      next_occurrence: input.startDate,
    })
    .select('id')
    .single()

  if (error || !schedule) {
    return { error: error?.message ?? 'No se pudo crear el movimiento fijo.' }
  }

  revalidateAll()
  return { id: schedule.id }
}

export async function deactivateRecurringSchedule(
  householdId: string,
  scheduleId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('recurring_schedules')
    .update({ is_active: false })
    .eq('id', scheduleId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidateAll()
  revalidatePath('/fijos')
  return {}
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  await syncUserProfileFromMetadata()

  const today = getTodayString()
  if (input.transactionDate > today) {
    return {
      error:
        'No puedes registrar movimientos con fecha futura. Usa la sección de ingresos y gastos fijos para programar repetición.',
    }
  }

  const baseCurrency = await getHouseholdBaseCurrency(input.householdId)
  const currency = input.currency ?? baseCurrency

  let amount = input.amount
  if (input.lineItems && input.lineItems.length > 0) {
    amount = input.lineItems.reduce((sum, item) => sum + item.price, 0)
  }

  if (amount <= 0) return { error: 'El monto debe ser mayor a cero.' }

  let exchangeRate = 1
  try {
    exchangeRate = await fetchExchangeRate(supabase, currency, baseCurrency)
  } catch {
    return { error: `No hay tasa de cambio para ${currency} → ${baseCurrency}` }
  }

  const amounts = prepareTransactionAmounts(amount, currency, baseCurrency, exchangeRate)

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      household_id: input.householdId,
      created_by: user.id,
      category_id: input.categoryId,
      type: input.type,
      description: input.description,
      transaction_date: input.transactionDate,
      ...amounts,
      line_items: input.lineItems?.length ? input.lineItems : null,
      recurring_schedule_id: null,
      is_recurring_instance: false,
      savings_goal_id: input.savingsGoalId ?? null,
    })
    .select('id')
    .single()

  if (txError || !tx) {
    return { error: txError?.message ?? 'No se pudo guardar la transacción.' }
  }

  if (input.savingsGoalId) {
    await applySavingsGoalDelta(
      supabase,
      input.savingsGoalId,
      input.householdId,
      amounts.amount_base
    )
  }

  revalidateAll()
  return { id: tx.id }
}

export async function updateTransaction(
  input: UpdateTransactionInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const today = getTodayString()
  if (input.transactionDate > today) {
    return { error: 'No puedes usar una fecha futura.' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('transactions')
    .select('id, type, is_auto_adjustment, household_id')
    .eq('id', input.id)
    .eq('household_id', input.householdId)
    .single()

  if (fetchError || !existing) {
    return { error: 'No se encontró el movimiento.' }
  }

  if (existing.type === 'adjustment' || existing.is_auto_adjustment) {
    return { error: 'Este movimiento no se puede editar.' }
  }

  const baseCurrency = await getHouseholdBaseCurrency(input.householdId)
  const currency = input.currency ?? baseCurrency

  let amount = input.amount
  if (input.lineItems && input.lineItems.length > 0) {
    amount = input.lineItems.reduce((sum, item) => sum + item.price, 0)
  }

  if (amount <= 0) return { error: 'El monto debe ser mayor a cero.' }

  let exchangeRate = 1
  try {
    exchangeRate = await fetchExchangeRate(supabase, currency, baseCurrency)
  } catch {
    return { error: `No hay tasa de cambio para ${currency} → ${baseCurrency}` }
  }

  const amounts = prepareTransactionAmounts(amount, currency, baseCurrency, exchangeRate)

  const { error: txError } = await supabase
    .from('transactions')
    .update({
      category_id: input.categoryId,
      type: input.type,
      description: input.description.trim(),
      transaction_date: input.transactionDate,
      ...amounts,
      line_items: input.lineItems?.length ? input.lineItems : null,
    })
    .eq('id', input.id)
    .eq('household_id', input.householdId)

  if (txError) return { error: txError.message }

  revalidateAll()
  return {}
}

export async function deleteTransaction(
  id: string,
  householdId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const { data: existing, error: fetchError } = await supabase
    .from('transactions')
    .select('id, type, is_auto_adjustment, savings_goal_id, amount_base')
    .eq('id', id)
    .eq('household_id', householdId)
    .single()

  if (fetchError || !existing) {
    return { error: 'No se encontró el movimiento.' }
  }

  if (existing.type === 'adjustment' || existing.is_auto_adjustment) {
    return { error: 'Este movimiento no se puede eliminar.' }
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  if (existing.savings_goal_id) {
    await applySavingsGoalDelta(
      supabase,
      existing.savings_goal_id,
      householdId,
      -Number(existing.amount_base)
    )
  }

  revalidateAll()
  return {}
}

export async function recordSavingsContribution(
  input: RecordSavingsContributionInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  if (input.amount <= 0) return { error: 'El monto debe ser mayor a cero.' }

  const { data: goal } = await supabase
    .from('savings_goals')
    .select('id, name, current_amount, target_amount')
    .eq('id', input.goalId)
    .eq('household_id', input.householdId)
    .eq('is_active', true)
    .single()

  if (!goal) return { error: 'Meta de ahorro no encontrada.' }

  const categoryId = await getSavingsContributionCategoryId(supabase, input.householdId)
  if (!categoryId) return { error: 'No hay categoría de gasto disponible.' }

  const transactionDate = input.transactionDate ?? getTodayString()
  const description =
    input.note?.trim() || `Aporte a ${goal.name}`

  return createTransaction({
    householdId: input.householdId,
    type: 'expense',
    categoryId,
    description,
    amount: input.amount,
    transactionDate,
    savingsGoalId: input.goalId,
  })
}

export async function createSavingsGoal(
  input: CreateSavingsGoalInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  if (input.targetAmount <= 0) return { error: 'La meta debe ser mayor a cero.' }

  const savingsCat = isValidSavingsCategoryId(input.category)
    ? getSavingsCategory(input.category)
    : getSavingsCategory('other')

  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      household_id: input.householdId,
      created_by: user.id,
      name: input.name,
      category: savingsCat.id,
      icon: input.icon && isValidCategoryIcon(input.icon) ? input.icon : savingsCat.icon,
      color: input.color ?? savingsCat.color,
      target_amount: input.targetAmount,
      current_amount: input.currentAmount ?? 0,
      target_date: input.targetDate ?? null,
      contribution_amount: input.contributionAmount ?? null,
      contribution_frequency: input.contributionFrequency ?? null,
      savings_mode: input.savingsMode ?? 'static',
      annual_interest_rate: input.annualInterestRate ?? 0,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'No se pudo crear la meta.' }
  }

  revalidatePath('/ahorros')
  revalidatePath('/')
  return { id: data.id }
}

export async function updateSavingsGoal(
  input: UpdateSavingsGoalInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }
  if (input.targetAmount <= 0) return { error: 'La meta debe ser mayor a cero.' }

  const savingsCat = isValidSavingsCategoryId(input.category)
    ? getSavingsCategory(input.category)
    : getSavingsCategory('other')

  const { error } = await supabase
    .from('savings_goals')
    .update({
      name: input.name,
      category: savingsCat.id,
      icon: input.icon && isValidCategoryIcon(input.icon) ? input.icon : savingsCat.icon,
      color: input.color ?? savingsCat.color,
      target_amount: input.targetAmount,
      current_amount: input.currentAmount ?? 0,
      target_date: input.targetDate ?? null,
      contribution_amount: input.contributionAmount ?? null,
      contribution_frequency: input.contributionFrequency ?? null,
      savings_mode: input.savingsMode ?? 'static',
      annual_interest_rate:
        input.savingsMode === 'compound' ? (input.annualInterestRate ?? 0) : 0,
    })
    .eq('id', input.id)
    .eq('household_id', input.householdId)

  if (error) return { error: error.message }

  revalidatePath('/ahorros')
  revalidatePath('/')
  return {}
}

export async function deleteSavingsGoal(
  goalId: string,
  householdId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('savings_goals')
    .update({ is_active: false })
    .eq('id', goalId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/ahorros')
  revalidatePath('/')
  return {}
}

export async function createCategory(input: {
  householdId: string
  name: string
  type: 'income' | 'expense'
  color?: string
  icon?: string
  isSubscription?: boolean
}): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const name = input.name.trim()
  if (!name) return { error: 'El nombre es obligatorio.' }

  const icon = isValidCategoryIcon(input.icon) ? input.icon : DEFAULT_CATEGORY_ICON

  const { data, error } = await supabase
    .from('categories')
    .insert({
      household_id: input.householdId,
      name,
      type: input.type,
      icon,
      color: input.color ?? '#636E72',
      is_fixed: false,
      is_subscription: input.type === 'expense' && !!input.isSubscription,
      is_system: false,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'No se pudo crear la categoría.' }
  }

  revalidateAll()
  return { id: data.id }
}

export async function deleteCategory(
  categoryId: string,
  householdId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('household_id', householdId)
    .eq('is_system', false)

  if (error) return { error: error.message }

  revalidateAll()
  return {}
}
