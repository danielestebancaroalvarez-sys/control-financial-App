import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { getUserHousehold } from '@/lib/household/queries'
import { getUserProfile } from '@/lib/profile/queries'
import type {
  AssistantModule,
  AssistantStep,
  FinanceStepId,
  ModuleAssistantState,
  TimeStepId,
} from './assistant-types'

async function hasProfileStep(): Promise<boolean> {
  const profile = await getUserProfile()
  return (profile?.fullName?.trim().length ?? 0) >= 2
}

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

  const [incomeRes, schedulesRes, savingsRes, txRes] = await Promise.all([
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
  ])

  const expenses = schedulesRes.data ?? []
  let hasFixed = false
  let hasSubscription = false

  for (const row of expenses) {
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
    if (cat?.is_fixed) hasFixed = true
    if (cat?.is_subscription) hasSubscription = true
  }

  return {
    hasIncome: (incomeRes.data?.length ?? 0) > 0,
    hasFixed,
    hasSubscription,
    hasSavings: (savingsRes.data?.length ?? 0) > 0,
    transactionCount: txRes.count ?? 0,
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

  const hasSleepBlock = (sleepBlocksRes.data ?? []).some(row => {
    const cat = Array.isArray(row.time_categories)
      ? row.time_categories[0]
      : row.time_categories
    return cat?.name === 'Sueño'
  })

  return {
    templateCount: templatesRes.count ?? 0,
    taskCount: tasksRes.count ?? 0,
    hasSleep:
      (sleepSessionsRes.data?.length ?? 0) > 0 || hasSleepBlock,
  }
}

function buildFinanceSteps(
  isOwner: boolean,
  completed: Record<FinanceStepId, boolean>
): AssistantStep[] {
  const steps: AssistantStep[] = [
    {
      id: 'profile',
      label: 'Tu perfil',
      description: 'Nombre para que tu pareja te identifique.',
      href: '/ajustes?guide=profile',
      completed: completed.profile,
    },
    {
      id: 'period',
      label: 'Periodo del dashboard',
      description: 'Elige vista semanal o mensual.',
      href: '/ajustes?guide=period',
      completed: completed.period,
    },
  ]

  if (isOwner) {
    steps.push(
      {
        id: 'income',
        label: 'Ingreso fijo',
        description: 'Salario u otros ingresos recurrentes.',
        href: '/fijos?guide=income',
        completed: completed.income,
      },
      {
        id: 'fixed_expense',
        label: 'Gasto fijo',
        description: 'Arriendo, servicios u otros pagos regulares.',
        href: '/fijos?guide=fixed',
        completed: completed.fixed_expense,
      },
      {
        id: 'subscription',
        label: 'Suscripción',
        description: 'Netflix, Spotify y otros débitos automáticos.',
        href: '/fijos?guide=subscription',
        completed: completed.subscription,
      },
      {
        id: 'savings',
        label: 'Meta de ahorro',
        description: 'Opcional: define un objetivo de ahorro.',
        href: '/ahorros?guide=savings',
        optional: true,
        completed: completed.savings,
      }
    )
  }

  return steps
}

function buildTimeSteps(completed: Record<TimeStepId, boolean>): AssistantStep[] {
  return [
    {
      id: 'profile',
      label: 'Tu perfil',
      description: 'Nombre visible en tareas y horario.',
      href: '/tiempo/ajustes?guide=profile',
      completed: completed.profile,
    },
    {
      id: 'sleep',
      label: 'Registro de sueño',
      description: 'Configura o registra tu primer sueño.',
      href: '/tiempo/nuevo?guide=sleep',
      completed: completed.sleep,
    },
    {
      id: 'activity',
      label: 'Actividad guardada',
      description: 'Plantillas reutilizables para tareas frecuentes.',
      href: '/tiempo/actividades?guide=new',
      completed: completed.activity,
    },
    {
      id: 'first_task',
      label: 'Primera tarea',
      description: 'Crea una tarea del hogar.',
      href: '/tiempo/nuevo?guide=task',
      completed: completed.first_task,
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

  const [profileDone, data] = await Promise.all([
    hasProfileStep(),
    financeProgressData(household.id),
  ])

  const completed: Record<FinanceStepId, boolean> = {
    profile: profileDone,
    period: true,
    income: data.hasIncome,
    fixed_expense: data.hasFixed,
    subscription: data.hasSubscription,
    savings: data.hasSavings,
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

  const [profileDone, data] = await Promise.all([
    hasProfileStep(),
    timeProgressData(household.id, user.id),
  ])

  const completed: Record<TimeStepId, boolean> = {
    profile: profileDone,
    sleep: data.hasSleep,
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

export async function householdHasFinanceData(): Promise<boolean> {
  const household = await getUserHousehold()
  if (!household) return true

  const data = await financeProgressData(household.id)
  return (
    data.hasIncome ||
    data.hasFixed ||
    data.hasSubscription ||
    data.transactionCount > 0
  )
}

export async function householdHasTimeData(): Promise<boolean> {
  const user = await getAuthUser()
  const household = await getUserHousehold()
  if (!user || !household) return true

  const data = await timeProgressData(household.id, user.id)
  return data.templateCount > 0 || data.taskCount > 0 || data.hasSleep
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
  if (module === 'finance') {
    const progress = await getFinanceModuleProgress(isOwner)
    return progress.completedCount >= progress.requiredTotal
  }
  const progress = await getTimeModuleProgress()
  return progress.completedCount >= progress.requiredTotal
}
