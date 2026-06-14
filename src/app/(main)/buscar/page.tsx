import { redirect } from 'next/navigation'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
import { getCategories, searchTransactions } from '@/lib/finance/queries'
import { getSearchPresetRange } from '@/lib/finance/format'
import { getHouseholdMembers } from '@/lib/household/queries'
import { BuscarClient } from './buscar-client'

type SearchParams = Promise<{
  q?: string
  type?: string
  preset?: string
  startDate?: string
  endDate?: string
  categoryId?: string
  createdBy?: string
}>

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  const hasCustomRange = !!(params.startDate && params.endDate)
  const preset =
    hasCustomRange
      ? 'custom'
      : params.preset === 'last-week'
        ? 'last-week'
        : 'period'

  const { start, end } = hasCustomRange
    ? { start: params.startDate!, end: params.endDate! }
    : getSearchPresetRange(preset === 'last-week' ? 'last-week' : 'period', ctx.period)

  const [results, categories, members] = await Promise.all([
    searchTransactions(ctx.household.id, {
      q: params.q,
      type: params.type as 'income' | 'expense' | 'all' | undefined,
      categoryId: params.categoryId,
      createdBy: params.createdBy,
      startDate: start,
      endDate: end,
    }),
    getCategories(ctx.household.id),
    getHouseholdMembers(ctx.household.id),
  ])

  return (
    <BuscarClient
      results={results}
      categories={categories}
      members={members}
      householdId={ctx.household.id}
      currency={ctx.household.base_currency}
      filters={{
        q: params.q ?? '',
        type: params.type ?? 'all',
        preset: preset as 'period' | 'last-week' | 'custom',
        startDate: params.startDate ?? '',
        endDate: params.endDate ?? '',
        categoryId: params.categoryId ?? '',
        createdBy: params.createdBy ?? '',
      }}
      period={ctx.period}
      rangeStart={start}
      rangeEnd={end}
    />
  )
}
