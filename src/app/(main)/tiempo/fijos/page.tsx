import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getTimeBlocks } from '@/lib/time/queries'
import { TiempoFijosClient } from './tiempo-fijos-client'

export default async function TiempoFijosPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const blocks = await getTimeBlocks(ctx.household.id)

  return (
    <TiempoFijosClient blocks={blocks} householdId={ctx.household.id} />
  )
}
