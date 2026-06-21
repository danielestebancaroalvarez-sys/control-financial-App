import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getHouseholdMembers } from '@/lib/household/queries'
import {
  getHouseholdTasks,
  getProductivityGoals,
  getTimeBlocks,
  getTimeCategories,
} from '@/lib/time/queries'
import { TiempoBuscarClient } from './tiempo-buscar-client'

type SearchParams = Promise<{ tab?: string }>

function parseInitialTab(tab?: string): 'all' | 'tasks' | 'goals' | 'blocks' {
  if (tab === 'fijos' || tab === 'blocks') return 'blocks'
  if (tab === 'tasks' || tab === 'tareas') return 'tasks'
  if (tab === 'goals' || tab === 'metas') return 'goals'
  return 'all'
}

export default async function TiempoBuscarPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const params = await searchParams
  const initialTab = parseInitialTab(params.tab)

  const [tasks, goals, blocks, categories, members] = await Promise.all([
    getHouseholdTasks(ctx.household.id),
    getProductivityGoals(ctx.household.id),
    getTimeBlocks(ctx.household.id),
    getTimeCategories(ctx.household.id),
    getHouseholdMembers(ctx.household.id),
  ])

  return (
    <TiempoBuscarClient
      tasks={tasks}
      goals={goals}
      blocks={blocks}
      categories={categories}
      members={members}
      householdId={ctx.household.id}
      initialTab={initialTab}
    />
  )
}
