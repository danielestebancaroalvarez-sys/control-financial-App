import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  getDashboardSummary,
  getMarketInsights,
  getPredictionsSummary,
} from '@/lib/finance/queries'
import {
  generateWeeklyInsight,
  type InsightContext,
} from '@/lib/insights/gemini-insights'
import { buildInsightHighlights } from '@/lib/insights/build-highlights'
import { computeInsightFingerprint } from '@/lib/insights/fingerprint'
import {
  getCachedWeeklyInsight,
  saveWeeklyInsight,
} from '@/lib/insights/insight-cache'
import type { CurrencyCode } from '@/lib/household/types'

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

  const { data: household } = await supabase
    .from('households')
    .select('base_currency')
    .eq('id', householdId)
    .single()

  const currency = (household?.base_currency ?? 'AUD') as CurrencyCode

  const [dashboard, predictions, market] = await Promise.all([
    getDashboardSummary(householdId, 'monthly', 0),
    getPredictionsSummary(householdId, 'monthly'),
    getMarketInsights(householdId),
  ])

  const highlights = buildInsightHighlights(dashboard, predictions, currency)

  const mercado = predictions.consumptionPredictions.find(
    c => c.categoryName === 'Mercado'
  )

  const expenseTotal = dashboard.monthlyExpenses || 1

  const context: InsightContext = {
    currency,
    period: 'mensual',
    periodStart: dashboard.periodStart,
    periodEnd: dashboard.periodEnd,
    realBalance: dashboard.realBalance,
    income: dashboard.monthlyIncome,
    expenses: dashboard.monthlyExpenses,
    guiltFreeMoney: dashboard.guiltFreeMoney,
    periodSavings: dashboard.periodSavings,
    totalSavingsAccumulated: dashboard.totalSavings,
    topCategories: dashboard.topCategories.slice(0, 5).map(c => ({
      name: c.name,
      amount: c.amount,
      percentOfExpenses: Math.round((c.amount / expenseTotal) * 1000) / 10,
    })),
    expenseGroups: dashboard.expenseGroups.slice(0, 5).map(g => ({
      name: g.name,
      amount: g.amount,
    })),
    savingsGoals: dashboard.savingsGoals.slice(0, 4).map(g => ({
      name: g.name,
      percent: g.percent,
      current: g.current,
      target: g.target,
    })),
    mercadoProjection: mercado
      ? {
          spentSoFar: mercado.spentSoFar,
          projectedTotal: mercado.projectedTotal,
          historicalAverage: mercado.historicalAverage,
          percentVsAverage: mercado.percentVsAverage,
          daysRemaining: mercado.daysRemaining,
        }
      : null,
    pendingPayments: predictions.currentPeriodPayments
      .filter(p => p.status === 'pending')
      .slice(0, 6)
      .map(p => ({
        name: p.name,
        amount: p.amount,
        category: p.categoryName,
      })),
    paidPaymentsCount: predictions.currentPeriodPayments.filter(
      p => p.status === 'paid'
    ).length,
    totalPaymentsCount: predictions.currentPeriodPayments.length,
    shoppingListDueCount: market.shoppingList.filter(
      i => i.urgency === 'overdue' || i.urgency === 'soon'
    ).length,
  }

  const fingerprint = computeInsightFingerprint(context)

  if (!refresh) {
    const cached = await getCachedWeeklyInsight(householdId)
    if (cached && cached.dataFingerprint === fingerprint) {
      return NextResponse.json({
        insight: {
          summary: cached.summary,
          tips: cached.tips,
          generatedAt: cached.generatedAt,
        },
        highlights,
        cached: true,
        dataFingerprint: fingerprint,
        aiCalled: false,
      })
    }
  } else {
    const cached = await getCachedWeeklyInsight(householdId)
    if (cached && cached.dataFingerprint === fingerprint) {
      return NextResponse.json({
        insight: {
          summary: cached.summary,
          tips: cached.tips,
          generatedAt: cached.generatedAt,
        },
        highlights,
        cached: true,
        dataFingerprint: fingerprint,
        aiCalled: false,
        upToDate: true,
      })
    }
  }

  try {
    const insight = await generateWeeklyInsight(context)
    await saveWeeklyInsight(householdId, insight, fingerprint)

    return NextResponse.json({
      insight,
      highlights,
      cached: false,
      dataFingerprint: fingerprint,
      aiCalled: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al generar insights.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
