'use server'

import { getMainAppContext } from '@/lib/app/context'
import { createClient } from '@/utils/supabase/server'
import { formatMoney, getNextPeriodRange } from '@/lib/finance/format'
import {
  formatReminderDate,
  listPaymentDueDates,
  type PaymentDueReminder,
} from '@/lib/finance/payment-reminders'
import { buildInAppNotifications, type InAppNotification } from './build-notifications'

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

export async function getInAppNotifications(): Promise<InAppNotification[]> {
  const payload = await getPaymentReminderPayload()
  if (!payload) return []
  return buildInAppNotifications(payload)
}
