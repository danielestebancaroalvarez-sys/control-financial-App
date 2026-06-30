import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { getUserHousehold } from '@/lib/household/queries'
import type {
  AssistantModule,
  AssistantStep,
  FinanceStepId,
  ModuleAssistantState,
} from './assistant-types'
import { tourIdForFinanceStep } from './tour-config'

async function getMembershipRole(
  householdId: string,
  userId: string
): Promise<'owner' | 'member'> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .maybeSingle()

  return data?.role === 'owner' ? 'owner' : 'member'
}

async function financeProgressData(householdId: string) {
  const supabase = await createClient()

  const [incomeRes, schedulesRes, savingsRes, txRes, mercadoCatRes] =
    await Promise.all([
      supabase
        .from('recurring_schedules')
        .select('id, categories ( is_fixed, is_subscription )')
        .eq('household_id', householdId)
        .eq('is_active', true)
        .eq('type', 'income')
        .limit(1),
      supabase
        .from('recurring_schedules')
        .select('id, categories ( is_fixed, is_subscription )')
        .eq('household_id', householdId)
        .eq('is_active', true)
        .eq('type', 'expense'),
      supabase
        .from('savings_goals')
        .select('id')
        .eq('household_id', householdId)
        .eq('is_active', true)
        .limit(1),
      supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('household_id', householdId),
      supabase
        .from('categories')
        .select('id')
        .eq('household_id', householdId)
        .eq('name', 'Mercado')
        .eq('type', 'expense')
        .maybeSingle(),
    ])

  const expenses = schedulesRes.data ?? []
  let hasFixed = false
  let hasSubscription = false

  for (const row of expenses) {
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
    if (cat?.is_fixed) hasFixed = true
    if (cat?.is_subscription) hasSubscription = true
  }

  let hasReceiptScan = false
  if (mercadoCatRes.data?.id) {
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .eq('category_id', mercadoCatRes.data.id)
      .or('receipt_image_path.not.is.null,line_items.not.is.null')

    hasReceiptScan = (count ?? 0) > 0
  }

  return {
    hasIncome: (incomeRes.data?.length ?? 0) > 0,
    hasFixed,
    hasSubscription,
    hasSavings: (savingsRes.data?.length ?? 0) > 0,
    hasReceiptScan,
    transactionCount: txRes.count ?? 0,
  }
}

function tourHref(stepId: FinanceStepId): string {
  const tourId = tourIdForFinanceStep(stepId)
  if (stepId === 'savings') return `/ahorros?tour=${tourId}`
  return `/nuevo?tour=${tourId}`
}

function buildFinanceSteps(
  isOwner: boolean,
  completed: Record<FinanceStepId, boolean>
): AssistantStep[] {
  if (!isOwner) return []

  return [
    {
      id: 'income',
      label: 'Ingreso fijo',
      description: 'Salario u otros ingresos recurrentes.',
      href: tourHref('income'),
      completed: completed.income,
    },
    {
      id: 'fixed_expense',
      label: 'Gasto fijo',
      description: 'Arriendo, servicios u otros pagos regulares.',
      href: tourHref('fixed_expense'),
      completed: completed.fixed_expense,
    },
    {
      id: 'subscription',
      label: 'Suscripción',
      description: 'Netflix, Spotify y otros débitos automáticos.',
      href: tourHref('subscription'),
      completed: completed.subscription,
    },
    {
      id: 'savings',
      label: 'Meta de ahorro',
      description: 'Define un objetivo de ahorro para el hogar.',
      href: tourHref('savings'),
      completed: completed.savings,
    },
    {
      id: 'receipt_scan',
      label: 'Escanear recibo',
      description: 'Escanea un recibo de Mercado con IA.',
      href: tourHref('receipt_scan'),
      completed: completed.receipt_scan,
    },
  ]
}

function summarizeSteps(steps: AssistantStep[]): Pick<
  ModuleAssistantState,
  'completedCount' | 'totalCount' | 'requiredTotal'
> {
  const required = steps.filter(s => !s.optional)
  return {
    completedCount: required.filter(s => s.completed).length,
    totalCount: required.length,
    requiredTotal: required.length,
  }
}

export async function getFinanceModuleProgress(
  isOwner: boolean
): Promise<ModuleAssistantState> {
  const household = await getUserHousehold()
  if (!household) {
    return {
      status: 'unset',
      steps: [],
      completedCount: 0,
      totalCount: 0,
      requiredTotal: 0,
    }
  }

  const data = await financeProgressData(household.id)

  const completed: Record<FinanceStepId, boolean> = {
    income: data.hasIncome,
    fixed_expense: data.hasFixed,
    subscription: data.hasSubscription,
    savings: data.hasSavings,
    receipt_scan: data.hasReceiptScan,
  }

  const steps = buildFinanceSteps(isOwner, completed)
  const summary = summarizeSteps(steps)

  return {
    status: 'unset',
    steps,
    ...summary,
  }
}

export async function getTimeModuleProgress(): Promise<ModuleAssistantState> {
  return {
    status: 'unset',
    steps: [],
    completedCount: 0,
    totalCount: 0,
    requiredTotal: 0,
  }
}

export async function householdHasFinanceData(): Promise<boolean> {
  const household = await getUserHousehold()
  if (!household) return true

  const data = await financeProgressData(household.id)
  return (
    data.hasIncome ||
    data.hasFixed ||
    data.hasSubscription ||
    data.hasSavings ||
    data.hasReceiptScan ||
    data.transactionCount > 0
  )
}

export async function householdHasTimeData(): Promise<boolean> {
  return true
}

export async function getIsHouseholdOwner(): Promise<boolean> {
  const user = await getAuthUser()
  const household = await getUserHousehold()
  if (!user || !household) return false
  const role = await getMembershipRole(household.id, user.id)
  return role === 'owner'
}

export async function isModuleSetupComplete(module: AssistantModule): Promise<boolean> {
  if (module === 'time') return true

  const isOwner = await getIsHouseholdOwner()
  const progress = await getFinanceModuleProgress(isOwner)
  return progress.completedCount >= progress.requiredTotal
}
