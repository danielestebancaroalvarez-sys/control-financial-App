import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { getUserHousehold, getHouseholdMembers } from '@/lib/household/queries'
import { getUserDashboardPeriod } from '@/lib/profile/queries'
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const household = await getUserHousehold()
  if (!household || !user) return null

  const period = await getUserDashboardPeriod()
  const { start, end } = getPeriodRange(period)

  const [results, categories, members] = await Promise.all([
    searchTransactions(household.id, {
      q: params.q,
      type: params.type as 'income' | 'expense' | 'all' | undefined,
      categoryId: params.categoryId,
      createdBy: params.createdBy,
      startDate: params.startDate ?? start,
      endDate: params.endDate ?? end,
    }),
    getCategories(household.id),
    getHouseholdMembers(household.id),
  ])

  return (
    <Suspense fallback={<div className="text-[#636E72] text-sm">Cargando...</div>}>
      <BuscarClient
        results={results}
        categories={categories}
        members={members}
        currency={household.base_currency}
        filters={params as Record<string, string>}
        period={period}
        defaultStartDate={start}
        defaultEndDate={end}
      />
    </Suspense>
  )
}
