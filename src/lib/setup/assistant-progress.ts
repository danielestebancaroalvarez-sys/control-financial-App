import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { getUserHousehold } from '@/lib/household/queries'
import type {
  AssistantModule,
  AssistantStep,
  FinanceStepId,
  ModuleAssistantState,
  TimeStepId,
} from './assistant-types'
import { tourIdForFinanceStep, tourIdForTimeStep } from './tour-config'

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

function financeTourHref(stepId: FinanceStepId): string {
  const tourId = tourIdForFinanceStep(stepId)
  if (stepId === 'savings') return `/ahorros?tour=${tourId}`
  return `/nuevo?tour=${tourId}`
}

function timeTourHref(stepId: TimeStepId): string {
  const tourId = tourIdForTimeStep(stepId)
  if (stepId === 'activity') return `/tiempo/actividades?tour=${tourId}`
  return `/tiempo/nuevo?tour=${tourId}`
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
      href: financeTourHref('income'),
      completed: completed.income,
    },
    {
      id: 'fixed_expense',
      label: 'Gasto fijo',
      description: 'Arriendo, servicios u otros pagos regulares.',
      href: financeTourHref('fixed_expense'),
      completed: completed.fixed_expense,
    },
    {
      id: 'subscription',
      label: 'Suscripción',
      description: 'Netflix, Spotify y otros débitos automáticos.',
      href: financeTourHref('subscription'),
      completed: completed.subscription,
    },
    {
      id: 'savings',
      label: 'Meta de ahorro',
      description: 'Define un objetivo de ahorro para el hogar.',
      href: financeTourHref('savings'),
      completed: completed.savings,
    },
    {
      id: 'receipt_scan',
      label: 'Escanear recibo',
      description: 'Escanea un recibo de Mercado con IA.',
      href: financeTourHref('receipt_scan'),
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
  const user = await getAuthUser()
  const household = await getUserHousehold()
  if (!user || !household) {
    return {
      status: 'unset',
      steps: [],
      completedCount: 0,
      totalCount: 0,
      requiredTotal: 0,
    }
  }

  const isOwner = await getMembershipRole(household.id, user.id) === 'owner'
  if (!isOwner) {
    return {
      status: 'unset',
      steps: [],
      completedCount: 0,
      totalCount: 0,
      requiredTotal: 0,
    }
  }

  const data = await timeProgressData(household.id, user.id)

  const completed: Record<TimeStepId, boolean> = {
    sleep: data.hasSleep,
    fixed_time: data.hasFixedTime,
    activity: data.templateCount > 0,
    first_task: data.taskCount > 0,
  }

  const steps = buildTimeSteps(completed)
  const summary = summarizeSteps(steps)

  return {
    status: 'unset',
    steps,
    ...summary,
  }
}

async function timeProgressData(householdId: string, userId: string) {
  const supabase = await createClient()

  const [templatesRes, tasksRes, sleepSessionsRes, sleepBlocksRes] =
    await Promise.all([
      supabase
        .from('household_task_templates')
        .select('id', { count: 'exact', head: true })
        .eq('household_id', householdId),
      supabase
        .from('household_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('household_id', householdId)
        .in('status', ['pending', 'done']),
      supabase
        .from('sleep_sessions')
        .select('id')
        .eq('household_id', householdId)
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .limit(1),
      supabase
        .from('time_blocks')
        .select('id, time_categories!inner ( name )')
        .eq('household_id', householdId)
        .limit(20),
    ])

  let hasSleepBlock = false
  let hasFixedTime = false

  for (const row of sleepBlocksRes.data ?? []) {
    const cat = Array.isArray(row.time_categories)
      ? row.time_categories[0]
      : row.time_categories
    if (cat?.name === 'Sueño') hasSleepBlock = true
    else hasFixedTime = true
  }

  return {
    templateCount: templatesRes.count ?? 0,
    taskCount: tasksRes.count ?? 0,
    hasSleep: (sleepSessionsRes.data?.length ?? 0) > 0 || hasSleepBlock,
    hasFixedTime,
  }
}

function buildTimeSteps(completed: Record<TimeStepId, boolean>): AssistantStep[] {
  return [
    {
      id: 'sleep',
      label: 'Registro de sueño',
      description: 'Configura o registra tu primer sueño.',
      href: timeTourHref('sleep'),
      completed: completed.sleep,
    },
    {
      id: 'fixed_time',
      label: 'Tiempo fijo',
      description: 'Programa un bloque recurrente en tu horario.',
      href: timeTourHref('fixed_time'),
      completed: completed.fixed_time,
    },
    {
      id: 'activity',
      label: 'Actividad guardada',
      description: 'Plantillas reutilizables para tareas frecuentes.',
      href: timeTourHref('activity'),
      completed: completed.activity,
    },
    {
      id: 'first_task',
      label: 'Primera tarea',
      description: 'Crea una tarea del hogar.',
      href: timeTourHref('first_task'),
      completed: completed.first_task,
    },
  ]
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
  const user = await getAuthUser()
  const household = await getUserHousehold()
  if (!user || !household) return true

  const data = await timeProgressData(household.id, user.id)
  return (
    data.templateCount > 0 ||
    data.taskCount > 0 ||
    data.hasSleep ||
    data.hasFixedTime
  )
}

export async function getIsHouseholdOwner(): Promise<boolean> {
  const user = await getAuthUser()
  const household = await getUserHousehold()
  if (!user || !household) return false
  const role = await getMembershipRole(household.id, user.id)
  return role === 'owner'
}

export async function isModuleSetupComplete(module: AssistantModule): Promise<boolean> {
  const isOwner = await getIsHouseholdOwner()
  if (module === 'time') {
    const progress = await getTimeModuleProgress()
    return progress.completedCount >= progress.requiredTotal
  }
  const progress = await getFinanceModuleProgress(isOwner)
  return progress.completedCount >= progress.requiredTotal
}
