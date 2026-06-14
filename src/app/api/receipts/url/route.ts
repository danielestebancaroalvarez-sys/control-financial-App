import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getReceiptSignedUrl } from '@/lib/receipts/get-signed-url'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  const householdId = searchParams.get('householdId')

  if (!path || !householdId) {
    return NextResponse.json({ error: 'Parámetros inválidos.' }, { status: 400 })
  }

  if (!path.startsWith(`${householdId}/`)) {
    return NextResponse.json({ error: 'Ruta no permitida.' }, { status: 403 })
  }

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Sin acceso.' }, { status: 403 })
  }

  const url = await getReceiptSignedUrl(path)
  if (!url) {
    return NextResponse.json({ error: 'No se pudo obtener la imagen.' }, { status: 404 })
  }

  return NextResponse.json({ url })
}
