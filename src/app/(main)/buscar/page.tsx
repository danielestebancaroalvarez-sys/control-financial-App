import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { getUserHousehold, getHouseholdMembers } from '@/lib/household/queries'
import { getCategories, searchTransactions } from '@/lib/finance/queries'
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

  const [results, categories, members] = await Promise.all([
    searchTransactions(household.id, {
      q: params.q,
      type: params.type as 'income' | 'expense' | 'all' | undefined,
      categoryId: params.categoryId,
      createdBy: params.createdBy,
      startDate: params.startDate,
      endDate: params.endDate,
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
      />
    </Suspense>
  )
}
