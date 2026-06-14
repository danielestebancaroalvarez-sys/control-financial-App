import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getMarketInsights } from '@/lib/finance/queries'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const householdId = searchParams.get('householdId')

  if (!householdId) {
    return NextResponse.json({ error: 'householdId requerido.' }, { status: 400 })
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

  const insights = await getMarketInsights(householdId)
  return NextResponse.json({ shoppingList: insights.shoppingList })
}
