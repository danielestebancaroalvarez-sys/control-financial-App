'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const REVALIDATE_PATHS = [
  '/viajes',
  '/viajes/buscar',
  '/viajes/nuevo',
  '/viajes/presupuesto',
  '/viajes/preparacion',
  '/viajes/ajustes',
  '/viajes/configuracion-inicial',
]

function revalidateTravelApp() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path)
}

export async function completeTravelSetup(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('profiles')
    .update({ travel_setup_completed_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidateTravelApp()
  redirect('/viajes')
}
