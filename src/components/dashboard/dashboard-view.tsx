import { DonutChart } from '@/components/dashboard/donut-chart'
import { TrendBarChart } from '@/components/dashboard/trend-bar-chart'
import { CategoryBarChart } from '@/components/dashboard/category-bar-chart'
import { PeriodBlockSelector } from '@/components/dashboard/period-block-selector'
import { ProactiveInsightBanner } from '@/components/dashboard/proactive-insight-banner'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { MemberSpendingDetail } from '@/components/dashboard/member-spending-detail'
import { CurrencyConverterWidget } from '@/components/dashboard/currency-converter-widget'
import { BalanceSnapshotCard } from '@/components/dashboard/balance-snapshot-card'
import { MarketMetricsPreview } from '@/components/dashboard/market-metrics-preview'
import { formatMoney, getPeriodLabels } from '@/lib/finance/format'
import type { DashboardSummary } from '@/lib/finance/types'
import type { CopAudRates } from '@/lib/finance/exchange-rates'
import type { MarketInsights } from '@/lib/finance/market-analytics'
import type { CurrencyCode } from '@/lib/household/types'
import type { ProactiveInsight } from '@/lib/insights/proactive-insight'
import {
  ArrowDownRight,
  ArrowUpRight,
  Users,
  PieChart,
  BarChart3,
  PiggyBank,
  Clock,
} from 'lucide-react'

function buildBudgetSlices(summary: DashboardSummary) {
  const slices: { value: number; color: string; label: string }[] = []
  const savingsAmount = summary.isClosedPeriod
    ? summary.periodRealSavings
    : summary.periodSavings

  if (summary.scheduledFixedExpenses > 0) {
    slices.push({
      value: summary.scheduledFixedExpenses,
      color: '#81D4FA',
      label: 'Fijos',
    })
  }

  if (summary.variableSpent > 0) {
    slices.push({
      value: summary.variableSpent,
      color: '#EC4899',
      label: 'Variable',
    })
  }

  if (savingsAmount > 0) {
    slices.push({
      value: savingsAmount,
      color: '#F59E0B',
      label: summary.isClosedPeriod ? 'Ahorro' : 'Ahorros',
    })
  }

  if (summary.guiltFreeMoney > 0) {
    slices.push({
      value: summary.guiltFreeMoney,
      color: '#FFE082',
      label: 'Libre',
    })
  }

  return slices
}

function expensePieTotal(summary: DashboardSummary): number {
  return summary.expenseGroups.reduce((sum, group) => sum + group.amount, 0)
}

export function DashboardView({
  firstName,
  householdName,
  householdId,
  currency,
  summary,
  proactiveInsight,
  fxRates,
  marketInsights,
}: {
  firstName: string
  householdName: string
  householdId: string
  currency: CurrencyCode
  summary: DashboardSummary
  proactiveInsight?: ProactiveInsight | null
  fxRates: CopAudRates | null
  marketInsights: MarketInsights
}) {
  const fmt = (n: number) => formatMoney(n, currency)
  const labels = getPeriodLabels(summary.period)
  const budgetSlices = buildBudgetSlices(summary)
  const pieTotal = expensePieTotal(summary)
  const savingsInChart = summary.isClosedPeriod
    ? summary.periodRealSavings
    : summary.periodSavings

  const topCategory = summary.allCategories[0]
  const topMember = summary.memberSpending.reduce(
    (best, m) => (m.amount > (best?.amount ?? 0) ? m : best),
    summary.memberSpending[0]
  )
  const avgGoalPercent =
    summary.savingsGoals.length > 0
      ? Math.round(
          summary.savingsGoals.reduce((s, g) => s + g.percent, 0) /
            summary.savingsGoals.length
        )
      : 0

  const budgetSummary = `${fmt(summary.monthlyIncome)} ingresos · ${fmt(Math.max(0, summary.guiltFreeMoney))} libre`
  const expenseSummary =
    pieTotal > 0
      ? `${fmt(pieTotal)} gastados${topCategory ? ` · ${topCategory.name}` : ''}`
      : 'Sin gastos en el periodo'
  const trendSummary =
    summary.expenseChangePercent !== null
      ? `Gastos ${summary.expenseChangePercent > 0 ? '+' : ''}${summary.expenseChangePercent}% vs anterior`
      : 'Comparación con periodo anterior'
  const memberSummary = topMember
    ? `${topMember.name}: ${fmt(topMember.amount)}`
    : undefined
  const savingsSummary =
    summary.savingsGoals.length > 0
      ? `${summary.savingsGoals.length} meta${summary.savingsGoals.length === 1 ? '' : 's'} · ${avgGoalPercent}% promedio`
      : undefined

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-[24px] font-bold text-cc-primary">Hola, {firstName}</h1>
        <p className="text-[13px] text-cc-secondary">
          {householdName} · Vista {labels.view}
        </p>
      </div>

      {proactiveInsight && <ProactiveInsightBanner insight={proactiveInsight} />}

      <div className="cc-surface rounded-[24px] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-bold text-cc-primary">
            Periodo · {summary.periodLabel}
          </p>
          <p className="text-[10px] text-cc-secondary">
            {summary.periodStart} → {summary.periodEnd}
          </p>
        </div>
        <PeriodBlockSelector
          period={summary.period}
          activeOffset={summary.periodOffset}
        />
      </div>

      <BalanceSnapshotCard
        householdId={householdId}
        currentBalance={summary.realBalance}
        currency={currency}
        breakdown={summary.balanceBreakdown}
        guiltFreeMoney={summary.guiltFreeMoney}
      />

      {budgetSlices.length > 0 && (
        <CollapsibleSection
          title="Presupuesto del periodo"
          summary={budgetSummary}
          icon={<PieChart className="w-4 h-4 text-[#00BFA5]" />}
          defaultOpen
        >
          <DonutChart
            slices={budgetSlices}
            centerValue={fmt(summary.monthlyIncome)}
            centerLabel="Ingresos"
          />
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--cc-border-subtle)] text-[11px]">
            <div className="flex items-center gap-1 text-[#00BFA5]">
              <ArrowUpRight className="w-3 h-3" />
              <span className="font-bold">{fmt(summary.monthlyIncome)}</span>
            </div>
            <div className="flex items-center gap-1 text-[#81D4FA]">
              <ArrowDownRight className="w-3 h-3" />
              <span className="font-bold">{fmt(summary.scheduledFixedExpenses)}</span>
              <span className="text-cc-muted font-normal">fijos</span>
            </div>
            <div className="text-[#EC4899] font-bold">
              Variable: {fmt(summary.variableSpent)}
            </div>
            <div className="text-[#F59E0B] font-bold">
              {summary.isClosedPeriod ? 'Ahorro' : 'Ahorros'}: {fmt(savingsInChart)}
            </div>
            <div className="text-cc-secondary font-bold col-span-2">
              Libre: {fmt(Math.max(0, summary.guiltFreeMoney))}
            </div>
            {summary.totalSavings > 0 && (
              <div className="text-[10px] text-cc-secondary col-span-2">
                Total acumulado en ahorros: {fmt(summary.totalSavings)}
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {(summary.expenseGroups.length > 0 || summary.allCategories.length > 0) && (
        <CollapsibleSection
          title="Gastos del periodo"
          summary={expenseSummary}
          icon={<PieChart className="w-4 h-4 text-[#EC4899]" />}
          defaultOpen
        >
          {summary.expenseGroups.length > 0 && (
            <DonutChart
              slices={summary.expenseGroups.map(g => ({
                value: g.amount,
                color: g.color,
                label: g.name,
              }))}
              centerValue={fmt(pieTotal)}
              centerLabel="Total"
            />
          )}
          {summary.allCategories.length > 0 && (
            <div className={summary.expenseGroups.length > 0 ? 'mt-4 pt-4 border-t border-[var(--cc-border-subtle)]' : 'pt-2'}>
              <CategoryBarChart items={summary.allCategories} currency={currency} />
            </div>
          )}
        </CollapsibleSection>
      )}

      {summary.trend.length > 0 && (
        <CollapsibleSection
          title="Tendencia"
          summary={trendSummary}
          icon={<BarChart3 className="w-4 h-4 text-[#00BFA5]" />}
          defaultOpen
        >
          <div className="flex gap-3 text-[9px] font-semibold text-cc-secondary pt-2 pb-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-[#00BFA5]" /> Ingresos
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-[#EC4899]" /> Gastos
            </span>
          </div>
          <TrendBarChart data={summary.trend} />
        </CollapsibleSection>
      )}

      {summary.memberSpending.length > 0 && memberSummary && (
        <CollapsibleSection
          title="Gastos extra por persona"
          summary={memberSummary}
          icon={<Users className="w-4 h-4 text-[#00BFA5]" />}
          defaultOpen
        >
          <MemberSpendingDetail
            members={summary.memberSpending}
            currency={currency}
            periodStart={summary.periodStart}
            periodEnd={summary.periodEnd}
          />
        </CollapsibleSection>
      )}

      {summary.savingsGoals.length > 0 && savingsSummary && (
        <CollapsibleSection
          title="Metas de ahorro"
          summary={savingsSummary}
          icon={<PiggyBank className="w-4 h-4 text-[#F59E0B]" />}
          defaultOpen
        >
          <div className="space-y-3 pt-2">
            {summary.savingsGoals.map(goal => {
              const isOverdue = goal.timeRemainingLabel.startsWith('Venció')
              const isUrgent =
                goal.timeRemainingLabel === 'Vence hoy' ||
                goal.timeRemainingLabel === '1 día restante'

              return (
                <div key={goal.name}>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="text-[12px] text-cc-primary font-medium truncate">
                      {goal.name}
                    </span>
                    <span className="text-cc-secondary shrink-0 text-[12px] font-bold">
                      {goal.percent}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full cc-track overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#F59E0B]"
                      style={{ width: `${goal.percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-[10px] text-cc-secondary">
                      {fmt(goal.current)} de {fmt(goal.target)}
                    </p>
                    <p
                      className={`text-[10px] font-semibold flex items-center gap-0.5 shrink-0 ${
                        isOverdue
                          ? 'text-[#EC4899]'
                          : isUrgent
                            ? 'text-[#F59E0B]'
                            : 'text-cc-muted'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {goal.timeRemainingLabel}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CollapsibleSection>
      )}

      <CurrencyConverterWidget initialRates={fxRates} />

      <MarketMetricsPreview insights={marketInsights} currency={currency} />

      {summary.allCategories.length === 0 &&
        summary.savingsGoals.length === 0 &&
        summary.monthlyIncome === 0 &&
        budgetSlices.length === 0 && (
          <div className="cc-surface rounded-[24px] px-5 py-4 text-center">
            <p className="text-[13px] text-cc-secondary">
              Añade transacciones para ver gráficos en este periodo.
            </p>
          </div>
        )}
    </div>
  )
}
