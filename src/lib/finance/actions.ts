'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getRealBalance, getHouseholdBaseCurrency } from './queries'

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

  revalidatePath('/')
  return { adjustment }
}
