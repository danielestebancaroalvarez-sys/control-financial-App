import { DonutChart } from '@/components/dashboard/donut-chart'
import { TrendBarChart } from '@/components/dashboard/trend-bar-chart'
import { CategoryBarChart } from '@/components/dashboard/category-bar-chart'
import { PeriodBlockSelector } from '@/components/dashboard/period-block-selector'
import { ProactiveInsightBanner } from '@/components/dashboard/proactive-insight-banner'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { BalanceEditButton } from '@/app/(main)/balance-edit-button'
import { formatMoney, getPeriodLabels } from '@/lib/finance/format'
import type { DashboardSummary } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'
import type { ProactiveInsight } from '@/lib/insights/proactive-insight'
import {
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  PiggyBank,
} from 'lucide-react'
import Link from 'next/link'

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

function GuiltFreeBreakdown({
  summary,
  currency,
  labels,
}: {
  summary: DashboardSummary
  currency: CurrencyCode
  labels: ReturnType<typeof getPeriodLabels>
}) {
  const fmt = (n: number) => formatMoney(n, currency)

  return (
    <div className="mt-3 pt-3 border-t border-[var(--cc-border-subtle)] space-y-2">
      <p className="text-[11px] text-cc-secondary">
        {summary.isClosedPeriod
          ? 'Ingresos reales − gastos fijos − ahorro depositado − gasto variable'
          : `Ingresos prometidos ${labels.ofPeriod} − gastos fijos prometidos − ahorros − gasto variable`}
      </p>
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-cc-muted">
        {summary.scheduledFixedIncome > 0 && (
          <span>Ingresos fijos: {fmt(summary.scheduledFixedIncome)}</span>
        )}
        <span>Gastos fijos: {fmt(summary.scheduledFixedExpenses)}</span>
        <Link href="/fijos" className="text-[#00BFA5] font-semibold">
          Ver fijos
        </Link>
        <span>Variable: {fmt(summary.variableSpent)}</span>
        {!summary.isClosedPeriod && (
          <span>Ahorros planificados: {fmt(summary.periodSavings)}</span>
        )}
        {summary.periodRealSavings > 0 && (
          <span>Ahorro depositado: {fmt(summary.periodRealSavings)}</span>
        )}
      </div>
      {summary.expenseChangePercent !== null && (
        <p
          className={`text-[11px] font-semibold flex items-center gap-1 ${
            summary.expenseChangePercent > 0 ? 'text-[#EC4899]' : 'text-[#00BFA5]'
          }`}
        >
          {summary.expenseChangePercent > 0 ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          Gastos {summary.expenseChangePercent > 0 ? '+' : ''}
          {summary.expenseChangePercent}% vs periodo anterior
        </p>
      )}
      {summary.budgetDeficit > 0 && (
        <p className="text-[11px] text-[#EC4899] font-semibold">
          Déficit: {fmt(summary.budgetDeficit)} por encima del ingreso
        </p>
      )}
      {summary.guiltFreeMoney < 0 && (
        <div className="p-3 rounded-xl cc-accent-danger border">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E53935] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[#C62828]">
                Vas por encima del presupuesto
              </p>
              <div className="flex gap-2 mt-2">
                <Link
                  href="/predicciones"
                  className="text-[10px] font-bold text-[#00BFA5] px-2 py-1 rounded-lg cc-surface-muted"
                >
                  Radar
                </Link>
                <Link
                  href="/mercado"
                  className="text-[10px] font-bold text-[#00BFA5] px-2 py-1 rounded-lg cc-surface-muted"
                >
                  Mercado
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function DashboardView({
  firstName,
  householdName,
  householdId,
  currency,
  summary,
  proactiveInsight,
}: {
  firstName: string
  householdName: string
  householdId: string
  currency: CurrencyCode
  summary: DashboardSummary
  proactiveInsight?: ProactiveInsight | null
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

      <div className="relative rounded-[24px] bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] p-5 text-white shadow-lg">
        <div className="absolute top-4 right-4">
          <BalanceEditButton
            householdId={householdId}
            currentBalance={summary.realBalance}
            currency={currency}
          />
        </div>
        <p className="text-[12px] font-medium opacity-90 mb-1">Saldo real</p>
        <p className="text-[32px] font-bold tracking-tight pr-10">
          {fmt(summary.realBalance)}
        </p>
        <p className="text-[10px] opacity-80 mt-2 pr-10">
          Ingresos {fmt(summary.balanceBreakdown.income)} − Gastos{' '}
          {fmt(summary.balanceBreakdown.expense)}
          {summary.balanceBreakdown.adjustment !== 0 && (
            <>
              {' '}
              {summary.balanceBreakdown.adjustment > 0 ? '+' : '−'}{' '}
              {fmt(Math.abs(summary.balanceBreakdown.adjustment))} ajustes
            </>
          )}
        </p>
      </div>

      <div className="cc-surface rounded-[24px] p-4 cc-accent-warn border">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-[13px] font-bold text-cc-primary">Dinero libre</span>
        </div>
        <p
          className={`text-[28px] font-bold ${
            summary.guiltFreeMoney < 0 ? 'text-[#EC4899]' : 'text-[#F59E0B]'
          }`}
        >
          {fmt(summary.guiltFreeMoney)}
        </p>
        <p className="text-[11px] text-cc-secondary mt-1">
          Lo que queda tras fijos, ahorros y gasto variable · {labels.current}
        </p>
        <details className="mt-3 group">
          <summary className="text-[11px] font-semibold text-[#00BFA5] cursor-pointer list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">›</span>
            Ver desglose
          </summary>
          <GuiltFreeBreakdown summary={summary} currency={currency} labels={labels} />
        </details>
      </div>

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
          defaultOpen={false}
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
              <CategoryBarChart items={summary.allCategories} formatValue={fmt} />
            </div>
          )}
        </CollapsibleSection>
      )}

      {summary.trend.length > 0 && (
        <CollapsibleSection
          title="Tendencia"
          summary={trendSummary}
          icon={<BarChart3 className="w-4 h-4 text-[#00BFA5]" />}
          defaultOpen={false}
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
          defaultOpen={false}
        >
          <div className="space-y-3 pt-2">
            {summary.memberSpending.map(member => (
              <div key={member.userId}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-[#00BFA5]/20 text-[#00BFA5] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="text-[12px] font-medium text-cc-primary truncate">
                      {member.name}
                    </span>
                  </div>
                  <span className="text-[12px] font-bold text-cc-primary shrink-0 ml-2">
                    {fmt(member.amount)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full cc-track overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#EC4899]"
                    style={{ width: `${member.percent}%` }}
                  />
                </div>
                {member.extraAboveShare !== 0 && (
                  <p className="text-[10px] text-cc-muted mt-0.5">
                    {member.extraAboveShare > 0 ? (
                      <span className="text-[#EC4899] font-semibold">
                        +{fmt(member.extraAboveShare)} sobre la media
                      </span>
                    ) : (
                      <span className="text-[#00BFA5] font-semibold">
                        {fmt(Math.abs(member.extraAboveShare))} bajo la media
                      </span>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {summary.savingsGoals.length > 0 && savingsSummary && (
        <CollapsibleSection
          title="Metas de ahorro"
          summary={savingsSummary}
          icon={<PiggyBank className="w-4 h-4 text-[#F59E0B]" />}
          defaultOpen={false}
        >
          <div className="space-y-3 pt-2">
            {summary.savingsGoals.map(goal => (
              <div key={goal.name}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-cc-primary font-medium truncate">{goal.name}</span>
                  <span className="text-cc-secondary shrink-0 ml-2">{goal.percent}%</span>
                </div>
                <div className="h-2 rounded-full cc-track overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#F59E0B]"
                    style={{ width: `${goal.percent}%` }}
                  />
                </div>
                <p className="text-[10px] text-cc-secondary mt-1">
                  {fmt(goal.current)} de {fmt(goal.target)}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

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
