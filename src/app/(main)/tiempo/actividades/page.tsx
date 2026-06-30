import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getTaskTemplates } from '@/lib/time/queries'
import { TiempoActividadesClient } from './tiempo-actividades-client'

export default async function TiempoActividadesPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const templates = await getTaskTemplates(ctx.household.id)

  return (
    <Suspense fallback={null}>
      <TiempoActividadesClient
        householdId={ctx.household.id}
        initialTemplates={templates}
      />
    </Suspense>
  )
}
