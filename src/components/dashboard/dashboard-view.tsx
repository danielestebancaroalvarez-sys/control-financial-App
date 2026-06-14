import { DonutChart } from '@/components/dashboard/donut-chart'
import { TrendBarChart } from '@/components/dashboard/trend-bar-chart'
import { CategoryBarChart } from '@/components/dashboard/category-bar-chart'
import { PeriodBlockSelector } from '@/components/dashboard/period-block-selector'
import { BalanceEditButton } from '@/app/(main)/balance-edit-button'
import { formatMoney, getPeriodLabels } from '@/lib/finance/format'
import type { DashboardSummary } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'
import { Sparkles, ArrowDownRight, ArrowUpRight } from 'lucide-react'

export function DashboardView({
  firstName,
  householdName,
  householdId,
  currency,
  summary,
}: {
  firstName: string
  householdName: string
  householdId: string
  currency: CurrencyCode
  summary: DashboardSummary
}) {
  const fmt = (n: number) => formatMoney(n, currency)
  const labels = getPeriodLabels(summary.period)
  const incomeVsExpenseTotal = summary.monthlyIncome + summary.monthlyExpenses

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[24px] font-bold text-[#2D3436]">Hola, {firstName}</h1>
        <p className="text-[13px] text-[#636E72]">
          {householdName} · Vista {labels.view}
        </p>
      </div>

      <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-bold text-[#2D3436]">
            Periodo · {summary.periodLabel}
          </p>
          <p className="text-[10px] text-[#636E72]">
            {summary.periodStart} → {summary.periodEnd}
          </p>
        </div>
        <PeriodBlockSelector
          period={summary.period}
          activeOffset={summary.periodOffset}
        />
      </div>

      <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm overflow-hidden">
        <div className="relative rounded-2xl bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] m-4 p-5 text-white shadow-lg">
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
          <p className="text-[11px] opacity-75 mt-1">Histórico · ingresos − gastos + ajustes</p>
        </div>

        <div className="px-4 pb-4 space-y-4">
          <div className="rounded-2xl bg-[#FFF8E1] border border-[#FFE082]/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-[13px] font-bold text-[#2D3436]">
                Dinero libre de culpa
              </span>
            </div>
            <p className="text-[24px] font-bold text-[#F59E0B]">
              {fmt(summary.guiltFreeMoney)}
            </p>
            <p className="text-[11px] text-[#636E72] mt-1">Ingresos − gastos del periodo</p>
          </div>

          <div className="rounded-2xl bg-[#F5F5F5] p-4">
            <p className="text-[12px] font-bold text-[#2D3436] mb-1">
              Distribución del periodo
            </p>
            <p className="text-[10px] text-[#636E72] mb-4">Ingresos vs gastos</p>
            <DonutChart
              slices={[
                {
                  value: summary.monthlyIncome,
                  color: '#00BFA5',
                  label: 'Ingresos',
                },
                {
                  value: summary.monthlyExpenses,
                  color: '#EC4899',
                  label: 'Gastos',
                },
              ]}
            />
            <div className="flex justify-between mt-4 pt-3 border-t border-white text-[12px]">
              <div className="flex items-center gap-1 text-[#00BFA5]">
                <ArrowUpRight className="w-3 h-3" />
                <span className="font-bold">{fmt(summary.monthlyIncome)}</span>
              </div>
              <div className="flex items-center gap-1 text-[#EC4899]">
                <ArrowDownRight className="w-3 h-3" />
                <span className="font-bold">{fmt(summary.monthlyExpenses)}</span>
              </div>
            </div>
            {incomeVsExpenseTotal > 0 && (
              <p className="text-[10px] text-[#636E72] text-center mt-2">
                Balance del periodo:{' '}
                <span className="font-semibold text-[#2D3436]">
                  {fmt(summary.monthlyIncome - summary.monthlyExpenses)}
                </span>
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-[#F5F5F5] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-bold text-[#2D3436]">
                Tendencia ({summary.period === 'weekly' ? 'semanas' : 'meses'})
              </p>
              <div className="flex gap-3 text-[9px] font-semibold text-[#636E72]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-[#00BFA5]" /> Ing.
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-[#EC4899]" /> Gast.
                </span>
              </div>
            </div>
            <TrendBarChart data={summary.trend} />
          </div>

          {summary.allCategories.length > 0 && (
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              <p className="text-[12px] font-bold text-[#2D3436] mb-3">
                Gastos por categoría
              </p>
              <CategoryBarChart items={summary.allCategories} formatValue={fmt} />
            </div>
          )}

          {summary.savingsGoals.length > 0 && (
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              <p className="text-[12px] font-bold text-[#2D3436] mb-3">
                Metas de ahorro
              </p>
              <div className="space-y-3">
                {summary.savingsGoals.map(goal => (
                  <div key={goal.name}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-[#2D3436] font-medium truncate">{goal.name}</span>
                      <span className="text-[#636E72] shrink-0 ml-2">{goal.percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#F59E0B]"
                        style={{ width: `${goal.percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[#636E72] mt-1">
                      {fmt(goal.current)} de {fmt(goal.target)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.allCategories.length === 0 && summary.savingsGoals.length === 0 && (
            <div className="rounded-2xl bg-[#F5F5F5] px-5 py-4 text-center">
              <p className="text-[13px] text-[#636E72]">
                Añade transacciones para ver gráficos en este periodo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
