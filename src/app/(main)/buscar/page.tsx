import { redirect } from 'next/navigation'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
import { getHouseholdMembers } from '@/lib/household/queries'
import { getCategories, searchTransactions } from '@/lib/finance/queries'
import { getPeriodRange } from '@/lib/finance/format'
import { BuscarClient } from './buscar-client'

type SearchParams = Promise<{
  q?: string
  type?: string
  categoryId?: string
  createdBy?: string
  startDate?: string
  endDate?: string
}>

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  const { start, end } = getPeriodRange(ctx.period)

  const [results, categories, members] = await Promise.all([
    searchTransactions(ctx.household.id, {
      q: params.q,
      type: params.type as 'income' | 'expense' | 'all' | undefined,
      categoryId: params.categoryId,
      createdBy: params.createdBy,
      startDate: params.startDate ?? start,
      endDate: params.endDate ?? end,
    }),
    getCategories(ctx.household.id),
    getHouseholdMembers(ctx.household.id),
  ])

  return (
    <BuscarClient
      results={results}
      categories={categories}
      members={members}
      currency={ctx.household.base_currency}
      filters={params as Record<string, string>}
      period={ctx.period}
      defaultStartDate={start}
      defaultEndDate={end}
    />
  )
}
