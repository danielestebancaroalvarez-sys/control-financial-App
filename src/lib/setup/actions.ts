'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTodayString } from '@/lib/finance/format'
import { getCategories } from '@/lib/finance/queries'
import { createSavingsGoal, createRecurringSchedule } from '@/lib/finance/actions'
import { updateDashboardPeriod } from '@/lib/profile/actions'
import { ensureUserProfile } from '@/lib/profile/sync'
import type { InitialSetupInput } from './types'

const REVALIDATE_PATHS = [
  '/',
  '/buscar',
  '/ahorros',
  '/predicciones',
  '/nuevo',
  '/ajustes',
  '/configuracion-inicial',
]

function revalidateApp() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path)
}

async function markSetupCompleted(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  await ensureUserProfile()

  const { error } = await supabase
    .from('profiles')
    .update({ setup_completed_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return {}
}

export async function completeInitialSetup(
  input: InitialSetupInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .eq('household_id', input.householdId)
    .maybeSingle()

  if (!membership) return { error: 'No perteneces a este hogar.' }

  const periodResult = await updateDashboardPeriod(input.dashboardPeriod)
  if (periodResult.error) return periodResult

  if (input.mode === 'full') {
    const categories = await getCategories(input.householdId)
    const categoryByName = new Map(categories.map(c => [c.name, c.id]))
    const today = getTodayString()

    if (input.monthlyIncome && input.monthlyIncome > 0) {
      const incomeCategoryId =
        categoryByName.get('Salario') ?? categoryByName.get('Otros ingresos')
      if (!incomeCategoryId) {
        return { error: 'No se encontró categoría de ingreso.' }
      }

      const incomeResult = await createRecurringSchedule({
        householdId: input.householdId,
        type: 'income',
        categoryId: incomeCategoryId,
        description: 'Ingreso mensual del hogar',
        amount: input.monthlyIncome,
        frequency: 'monthly',
        startDate: today,
      })
      if (incomeResult.error) return { error: incomeResult.error }
    }

    for (const expense of input.fixedExpenses ?? []) {
      if (!expense.amount || expense.amount <= 0) continue

      const categoryId = categoryByName.get(expense.categoryName)
      if (!categoryId) continue

      const expenseResult = await createRecurringSchedule({
        householdId: input.householdId,
        type: 'expense',
        categoryId,
        description: expense.categoryName,
        amount: expense.amount,
        frequency: 'monthly',
        startDate: today,
      })
      if (expenseResult.error) return { error: expenseResult.error }
    }

    const subscriptionsCategoryId = categoryByName.get('Suscripciones')
    for (const sub of input.subscriptions ?? []) {
      if (!sub.amount || sub.amount <= 0 || !sub.label.trim()) continue
      if (!subscriptionsCategoryId) continue

      const subResult = await createRecurringSchedule({
        householdId: input.householdId,
        type: 'expense',
        categoryId: subscriptionsCategoryId,
        description: sub.label.trim(),
        amount: sub.amount,
        frequency: 'monthly',
        startDate: today,
      })
      if (subResult.error) return { error: subResult.error }
    }

    if (
      input.savingsGoalName?.trim() &&
      input.savingsMonthly &&
      input.savingsMonthly > 0
    ) {
      const target = input.savingsTarget && input.savingsTarget > 0
        ? input.savingsTarget
        : input.savingsMonthly * 12

      const goalResult = await createSavingsGoal({
        householdId: input.householdId,
        name: input.savingsGoalName.trim(),
        targetAmount: target,
        contributionAmount: input.savingsMonthly,
        contributionFrequency: 'monthly',
      })
      if (goalResult.error) return { error: goalResult.error }
    }
  }

  const done = await markSetupCompleted()
  if (done.error) return done

  revalidateApp()
  redirect('/')
}

export async function skipInitialSetup(): Promise<{ error?: string }> {
  const done = await markSetupCompleted()
  if (done.error) return done

  revalidateApp()
  redirect('/')
}
