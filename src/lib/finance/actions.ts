'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getRealBalance, getHouseholdBaseCurrency } from './queries'
import { fetchExchangeRate, prepareTransactionAmounts } from './currency'
import { addFrequency } from './format'
import type { CreateSavingsGoalInput, CreateTransactionInput } from './types'

const REVALIDATE_PATHS = ['/', '/buscar', '/ahorros', '/predicciones', '/nuevo']

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

export async function createTransaction(
  input: CreateTransactionInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

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

  let recurringScheduleId: string | null = null

  if (input.isRecurring && input.frequency) {
    const { data: schedule, error: schedError } = await supabase
      .from('recurring_schedules')
      .insert({
        household_id: input.householdId,
        created_by: user.id,
        category_id: input.categoryId,
        type: input.type,
        description: input.description,
        amount_original: amount,
        currency_original: currency,
        frequency: input.frequency,
        next_occurrence: addFrequency(input.transactionDate, input.frequency),
      })
      .select('id')
      .single()

    if (schedError || !schedule) {
      return { error: schedError?.message ?? 'No se pudo crear el gasto recurrente.' }
    }
    recurringScheduleId = schedule.id
  }

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
      recurring_schedule_id: recurringScheduleId,
      is_recurring_instance: !!recurringScheduleId,
    })
    .select('id')
    .single()

  if (txError || !tx) {
    return { error: txError?.message ?? 'No se pudo guardar la transacción.' }
  }

  revalidateAll()
  return { id: tx.id }
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

  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      household_id: input.householdId,
      created_by: user.id,
      name: input.name,
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
