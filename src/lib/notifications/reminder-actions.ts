'use server'

import { getMainAppContext } from '@/lib/app/context'
import { createClient } from '@/utils/supabase/server'
import { formatMoney, getNextPeriodRange, getPeriodRangeAtOffset } from '@/lib/finance/format'
import {
  formatReminderDate,
  listPaymentDueDates,
  type PaymentDueReminder,
} from '@/lib/finance/payment-reminders'
import {
  householdHasFinanceData,
  householdHasTimeData,
} from '@/lib/setup/assistant-progress'
import { buildInAppNotifications, type InAppNotification } from './build-notifications'
import {
  buildTimeInAppNotifications,
  formatActivityDueLabel,
  type TimeActivityReminderPayload,
} from './build-time-notifications'

export type PaymentReminderPayload = {
  nextWeekStart: string
  nextWeekEnd: string
  payments: PaymentDueReminder[]
  formattedPayments: {
    id: string
    scheduleId: string
    name: string
    amountLabel: string
    dueDate: string
    dueDateLabel: string
    categoryName: string | null
    href: string
  }[]
}

export async function getPaymentReminderPayload(): Promise<PaymentReminderPayload | null> {
  const ctx = await getMainAppContext()
  if (!ctx) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('recurring_schedules')
    .select(
      'id, description, amount_original, frequency, next_occurrence, auto_register, categories (name)'
    )
    .eq('household_id', ctx.household.id)
    .eq('is_active', true)
    .eq('type', 'expense')
    .eq('auto_register', false)

  const { data: savingsData } = await supabase
    .from('savings_goals')
    .select(
      'id, name, contribution_amount, contribution_frequency, next_contribution'
    )
    .eq('household_id', ctx.household.id)
    .eq('is_active', true)
    .eq('auto_contribute', false)
    .not('contribution_amount', 'is', null)
    .gt('contribution_amount', 0)

  const { start, end } = getNextPeriodRange('weekly')
  const currency = ctx.household.base_currency

  const recurring = (data ?? []).map(r => {
    const cat = Array.isArray(r.categories) ? r.categories[0] : r.categories
    return {
      id: r.id,
      description: r.description,
      amount_original: r.amount_original,
      frequency: r.frequency,
      next_occurrence: r.next_occurrence,
      categories: cat ? { name: cat.name } : null,
    }
  })

  const payments = listPaymentDueDates(recurring, start, end)

  const savingsRecurring = (savingsData ?? [])
    .filter(g => g.next_contribution && g.contribution_frequency)
    .map(g => ({
      id: g.id,
      description: `Aporte: ${g.name}`,
      amount_original: g.contribution_amount,
      frequency: g.contribution_frequency as string,
      next_occurrence: g.next_contribution as string,
      categories: null,
    }))

  const savingsPayments = listPaymentDueDates(savingsRecurring, start, end)
  const allPayments = [...payments, ...savingsPayments].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate)
  )

  return {
    nextWeekStart: start,
    nextWeekEnd: end,
    payments: allPayments,
    formattedPayments: allPayments.map(p => ({
      id: p.id,
      scheduleId: p.scheduleId,
      name: p.name,
      amountLabel: formatMoney(p.amount, currency),
      dueDate: p.dueDate,
      dueDateLabel: formatReminderDate(p.dueDate),
      categoryName: p.categoryName,
      href: p.name.startsWith('Aporte:') ? '/ahorros' : '/predicciones',
    })),
  }
}

export async function getFinanceInAppNotifications(): Promise<InAppNotification[]> {
  const payload = await getPaymentReminderPayload()
  if (!payload) return []

  const items = buildInAppNotifications(payload)
  const ctx = await getMainAppContext()
  if (!ctx) return items

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('assistant_finance_status')
    .eq('id', ctx.user.id)
    .maybeSingle()

  const status = profile?.assistant_finance_status ?? 'unset'
  const hasData = await householdHasFinanceData()

  if ((status === 'unset' || status === 'declined') && !hasData) {
    items.unshift({
      id: 'setup-guide-finance',
      module: 'finance',
      type: 'setup-guide',
      title: 'Configura tus finanzas',
      body: 'Activa el asistente y te guiamos paso a paso.',
      href: '/?activateAssistant=finance',
      createdAt: new Date().toISOString(),
    })
  }

  return items
}

/** @deprecated Use getFinanceInAppNotifications */
export async function getInAppNotifications(): Promise<InAppNotification[]> {
  return getFinanceInAppNotifications()
}

export async function getTimeActivityReminderPayload(): Promise<TimeActivityReminderPayload | null> {
  const ctx = await getMainAppContext()
  if (!ctx) return null

  const supabase = await createClient()
  const { start, end } = getPeriodRangeAtOffset('weekly', 0)

  const [tasksRes, goalsRes] = await Promise.all([
    supabase
      .from('household_tasks')
      .select('id, title, due_date')
      .eq('household_id', ctx.household.id)
      .eq('status', 'pending')
      .not('due_date', 'is', null)
      .gte('due_date', start)
      .lte('due_date', end)
      .order('due_date'),
    supabase
      .from('goal_steps')
      .select('id, title, due_date, goal_id, productivity_goals ( title )')
      .eq('household_id', ctx.household.id)
      .eq('status', 'pending')
      .not('due_date', 'is', null)
      .gte('due_date', start)
      .lte('due_date', end)
      .order('due_date'),
  ])

  const activities: TimeActivityReminderPayload['activities'] = []

  for (const task of tasksRes.data ?? []) {
    if (!task.due_date) continue
    activities.push({
      id: task.id,
      kind: 'task',
      title: task.title,
      dueDate: task.due_date,
      dueDateLabel: formatActivityDueLabel(task.due_date),
      href: '/tiempo/tareas',
    })
  }

  for (const step of goalsRes.data ?? []) {
    if (!step.due_date) continue
    const goalRaw = step.productivity_goals as { title: string } | { title: string }[] | null
    const goalTitle = Array.isArray(goalRaw) ? goalRaw[0]?.title : goalRaw?.title
    activities.push({
      id: step.id,
      kind: 'goal',
      title: step.title,
      dueDate: step.due_date,
      dueDateLabel: formatActivityDueLabel(step.due_date),
      href: '/tiempo/metas',
      goalTitle: goalTitle ?? undefined,
    })
  }

  activities.sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  return {
    weekStart: start,
    weekEnd: end,
    activities,
  }
}

export async function getTimeInAppNotifications(): Promise<InAppNotification[]> {
  const payload = await getTimeActivityReminderPayload()
  if (!payload) return []

  const items = buildTimeInAppNotifications(payload)
  const ctx = await getMainAppContext()
  if (!ctx) return items

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('assistant_time_status')
    .eq('id', ctx.user.id)
    .maybeSingle()

  const status = profile?.assistant_time_status ?? 'unset'
  const hasData = await householdHasTimeData()

  if ((status === 'unset' || status === 'declined') && !hasData) {
    items.unshift({
      id: 'setup-guide-time',
      module: 'time',
      type: 'setup-guide',
      title: 'Configura tu tiempo',
      body: 'Activa el asistente y te guiamos con sueño, actividades y tareas.',
      href: '/?activateAssistant=time',
      createdAt: new Date().toISOString(),
    })
  }

  return items
}
