import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getDashboardSummary, getPredictionsSummary } from '@/lib/finance/queries'
import {
  generateWeeklyInsight,
  type InsightContext,
} from '@/lib/insights/gemini-insights'
import {
  getCachedWeeklyInsight,
  saveWeeklyInsight,
} from '@/lib/insights/insight-cache'

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
  const refresh = searchParams.get('refresh') === '1'

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
    return NextResponse.json({ error: 'Sin acceso al hogar.' }, { status: 403 })
  }

  if (!refresh) {
    const cached = await getCachedWeeklyInsight(householdId)
    if (cached) {
      return NextResponse.json({ insight: cached, cached: true })
    }
  }

  try {
    const [dashboard, predictions] = await Promise.all([
      getDashboardSummary(householdId, 'monthly', 0),
      getPredictionsSummary(householdId, 'monthly'),
    ])

    const mercado = predictions.consumptionPredictions.find(
      c => c.categoryName === 'Mercado'
    )

    const { data: household } = await supabase
      .from('households')
      .select('base_currency')
      .eq('id', householdId)
      .single()

    const context: InsightContext = {
      currency: household?.base_currency ?? 'AUD',
      period: 'mensual',
      income: dashboard.monthlyIncome,
      expenses: dashboard.monthlyExpenses,
      guiltFreeMoney: dashboard.guiltFreeMoney,
      periodSavings: dashboard.periodSavings,
      topCategories: dashboard.topCategories.slice(0, 5).map(c => ({
        name: c.name,
        amount: c.amount,
      })),
      mercadoProjection: mercado
        ? {
            spentSoFar: mercado.spentSoFar,
            projectedTotal: mercado.projectedTotal,
            historicalAverage: mercado.historicalAverage,
            percentVsAverage: mercado.percentVsAverage,
          }
        : null,
      pendingPayments: predictions.currentPeriodPayments
        .filter(p => p.status === 'pending')
        .slice(0, 5)
        .map(p => ({ name: p.name, amount: p.amount })),
      paidPaymentsCount: predictions.currentPeriodPayments.filter(
        p => p.status === 'paid'
      ).length,
      totalPaymentsCount: predictions.currentPeriodPayments.length,
    }

    const insight = await generateWeeklyInsight(context)
    await saveWeeklyInsight(householdId, insight)

    return NextResponse.json({ insight, cached: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al generar insights.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
