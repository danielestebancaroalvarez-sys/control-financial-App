import { formatMoney } from '@/lib/finance/format'
import type { DashboardSummary, PredictionsSummary } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

export type ProactiveInsight = {
  message: string
  tone: 'info' | 'warning' | 'positive'
  href?: string
}

export function buildProactiveInsight(
  summary: DashboardSummary,
  predictions: PredictionsSummary,
  currency: CurrencyCode
): ProactiveInsight | null {
  const fmt = (n: number) => formatMoney(n, currency)

  if (summary.guiltFreeMoney < 0) {
    return {
      message: `Vas ${fmt(Math.abs(summary.guiltFreeMoney))} por encima del presupuesto libre este periodo.`,
      tone: 'warning',
      href: '/predicciones',
    }
  }

  const topConsumption = [...predictions.consumptionPredictions].sort(
    (a, b) => b.percentVsAverage - a.percentVsAverage
  )[0]

  if (topConsumption && topConsumption.percentVsAverage >= 12) {
    return {
      message: `${topConsumption.categoryName} va ${topConsumption.percentVsAverage}% arriba de tu promedio.${
        topConsumption.categoryName === 'Mercado' ? ' Revisa la lista de compra.' : ''
      }`,
      tone: 'warning',
      href: topConsumption.categoryName === 'Mercado' ? '/mercado' : '/predicciones',
    }
  }

  const pending = predictions.currentPeriodPayments.filter(p => p.status === 'pending')
  if (pending.length > 0) {
    return {
      message:
        pending.length === 1
          ? `Tienes 1 pago fijo pendiente este periodo.`
          : `Tienes ${pending.length} pagos fijos pendientes este periodo.`,
      tone: 'info',
      href: '/predicciones',
    }
  }

  if (
    summary.expenseChangePercent !== null &&
    summary.expenseChangePercent >= 10
  ) {
    return {
      message: `Gastos ${summary.expenseChangePercent}% más altos que el periodo anterior.`,
      tone: 'warning',
      href: '/buscar',
    }
  }

  if (
    summary.expenseChangePercent !== null &&
    summary.expenseChangePercent <= -8
  ) {
    return {
      message: `Buen control: gastaste ${Math.abs(summary.expenseChangePercent)}% menos que el periodo anterior.`,
      tone: 'positive',
    }
  }

  if (summary.guiltFreeMoney > 0) {
    const mercado = predictions.consumptionPredictions.find(
      c => c.categoryName === 'Mercado'
    )
    if (mercado && mercado.daysRemaining <= 7) {
      return {
        message: `Te quedan ${mercado.daysRemaining} días de periodo con ${fmt(summary.guiltFreeMoney)} libres para ocio.`,
        tone: 'positive',
      }
    }
  }

  return null
}
