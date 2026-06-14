import { formatMoney } from '@/lib/finance/format'
import type { InsightHighlight } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'
import type { DashboardSummary, PredictionsSummary } from '@/lib/finance/types'

export function buildInsightHighlights(
  dashboard: DashboardSummary,
  predictions: PredictionsSummary,
  currency: CurrencyCode
): InsightHighlight[] {
  const fmt = (n: number) => formatMoney(n, currency)
  const highlights: InsightHighlight[] = []

  highlights.push({
    label: 'Ingresos del periodo',
    value: fmt(dashboard.monthlyIncome),
    tone: 'positive',
  })

  highlights.push({
    label: 'Gastos del periodo',
    value: fmt(dashboard.monthlyExpenses),
    tone: 'negative',
  })

  highlights.push({
    label: 'Dinero libre',
    value: fmt(dashboard.guiltFreeMoney),
    tone:
      dashboard.guiltFreeMoney < 0
        ? 'warning'
        : dashboard.guiltFreeMoney > 0
          ? 'positive'
          : 'neutral',
  })

  if (dashboard.periodSavings > 0) {
    highlights.push({
      label: 'Ahorros planificados',
      value: fmt(dashboard.periodSavings),
      tone: 'neutral',
    })
  }

  const mercado = predictions.consumptionPredictions.find(
    c => c.categoryName === 'Mercado'
  )
  if (mercado) {
    highlights.push({
      label: 'Mercado proyectado',
      value: `${fmt(mercado.projectedTotal)} (${mercado.percentVsAverage > 0 ? '+' : ''}${mercado.percentVsAverage}%)`,
      tone: mercado.percentVsAverage > 10 ? 'warning' : 'neutral',
    })
  }

  const pending = predictions.currentPeriodPayments.filter(p => p.status === 'pending')
  if (predictions.currentPeriodPayments.length > 0) {
    highlights.push({
      label: 'Pagos recurrentes',
      value: `${predictions.currentPeriodPayments.filter(p => p.status === 'paid').length}/${predictions.currentPeriodPayments.length} pagados`,
      tone: pending.length > 0 ? 'warning' : 'positive',
    })
  }

  if (dashboard.topCategories[0]) {
    highlights.push({
      label: 'Mayor gasto',
      value: `${dashboard.topCategories[0].name} · ${fmt(dashboard.topCategories[0].amount)}`,
      tone: 'neutral',
    })
  }

  return highlights.slice(0, 6)
}
