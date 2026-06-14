import { redirect } from 'next/navigation'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
import { getRecurringScheduleItems } from '@/lib/finance/queries'
import { FijosClient } from './fijos-client'

export default async function FijosPage() {
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  const schedules = await getRecurringScheduleItems(ctx.household.id)

  return (
    <FijosClient
      schedules={schedules}
      householdId={ctx.household.id}
      currency={ctx.household.base_currency}
      period={ctx.period}
    />
  )
}
