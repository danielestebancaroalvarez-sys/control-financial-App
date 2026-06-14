import { redirect } from 'next/navigation'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
import { getCategories, searchTransactions } from '@/lib/finance/queries'
import { getSearchPresetRange, type SearchDatePreset } from '@/lib/finance/format'
import { BuscarClient } from './buscar-client'

type SearchParams = Promise<{
  q?: string
  type?: string
  preset?: string
}>

const VALID_PRESETS: SearchDatePreset[] = [
  'this-week',
  'last-week',
  'this-month',
  'last-month',
  'period',
]

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  const preset = VALID_PRESETS.includes(params.preset as SearchDatePreset)
    ? (params.preset as SearchDatePreset)
    : 'period'

  const { start, end } = getSearchPresetRange(preset, ctx.period)

  const [results, categories] = await Promise.all([
    searchTransactions(ctx.household.id, {
      q: params.q,
      type: params.type as 'income' | 'expense' | 'all' | undefined,
      startDate: start,
      endDate: end,
    }),
    getCategories(ctx.household.id),
  ])

  return (
    <BuscarClient
      results={results}
      categories={categories}
      householdId={ctx.household.id}
      currency={ctx.household.base_currency}
      filters={{
        q: params.q ?? '',
        type: params.type ?? 'all',
        preset,
      }}
      period={ctx.period}
    />
  )
}
