'use server'

import { getMainAppContext } from '@/lib/app/context'
import { createClient } from '@/utils/supabase/server'
import { formatMoney, getNextPeriodRange } from '@/lib/finance/format'
import {
  formatReminderDate,
  listPaymentDueDates,
  type PaymentDueReminder,
} from '@/lib/finance/payment-reminders'

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
  }[]
}

export async function getPaymentReminderPayload(): Promise<PaymentReminderPayload | null> {
  const ctx = await getMainAppContext()
  if (!ctx) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('recurring_schedules')
    .select(
      'id, description, amount_original, frequency, next_occurrence, categories (name)'
    )
    .eq('household_id', ctx.household.id)
    .eq('is_active', true)
    .eq('type', 'expense')

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

  return {
    nextWeekStart: start,
    nextWeekEnd: end,
    payments,
    formattedPayments: payments.map(p => ({
      id: p.id,
      scheduleId: p.scheduleId,
      name: p.name,
      amountLabel: formatMoney(p.amount, currency),
      dueDate: p.dueDate,
      dueDateLabel: formatReminderDate(p.dueDate),
      categoryName: p.categoryName,
    })),
  }
}
