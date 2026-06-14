import { DonutChart } from '@/components/dashboard/donut-chart'
import { TrendBarChart } from '@/components/dashboard/trend-bar-chart'
import { CategoryBarChart } from '@/components/dashboard/category-bar-chart'
import { PeriodBlockSelector } from '@/components/dashboard/period-block-selector'
import { BalanceEditButton } from '@/app/(main)/balance-edit-button'
import { formatMoney, getPeriodLabels } from '@/lib/finance/format'
import type { DashboardSummary } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'
import { Sparkles, ArrowDownRight, ArrowUpRight, Users, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

function buildBudgetSlices(summary: DashboardSummary) {
  const slices: { value: number; color: string; label: string }[] = []

  if (summary.monthlyExpenses > 0) {
    slices.push({
      value: summary.monthlyExpenses,
      color: '#EC4899',
      label: 'Gastos',
    })
  }

  if (summary.savingsBreakdown.length > 0) {
    for (const goal of summary.savingsBreakdown) {
      slices.push({
        value: goal.amount,
        color: goal.color,
        label: goal.name,
      })
    }
  } else if (summary.periodSavings > 0) {
    slices.push({
      value: summary.periodSavings,
      color: '#F59E0B',
      label: 'Ahorros',
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
  const budgetSlices = buildBudgetSlices(summary)

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
            <p
              className={`text-[24px] font-bold ${
                summary.guiltFreeMoney < 0 ? 'text-[#EC4899]' : 'text-[#F59E0B]'
              }`}
            >
              {fmt(summary.guiltFreeMoney)}
            </p>
            <p className="text-[11px] text-[#636E72] mt-1">
              Ingresos − gastos − ahorros planificados del periodo
            </p>
            {summary.budgetDeficit > 0 && (
              <p className="text-[11px] text-[#EC4899] font-semibold mt-1">
                Déficit: {fmt(summary.budgetDeficit)} por encima del ingreso
              </p>
            )}
            {summary.guiltFreeMoney < 0 && (
              <div className="mt-3 p-3 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2]">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#E53935] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#C62828]">
                      Vas por encima del presupuesto
                    </p>
                    <p className="text-[10px] text-[#636E72] mt-1">
                      Revisa predicciones y mercado para ajustar el mes.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Link
                        href="/predicciones"
                        className="text-[10px] font-bold text-[#00BFA5] px-2 py-1 rounded-lg bg-white"
                      >
                        Predicciones
                      </Link>
                      <Link
                        href="/mercado"
                        className="text-[10px] font-bold text-[#00BFA5] px-2 py-1 rounded-lg bg-white"
                      >
                        Mercado
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {summary.memberSpending.length > 0 && (
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-[#00BFA5]" />
                <p className="text-[12px] font-bold text-[#2D3436]">
                  Gasto variable por miembro
                </p>
              </div>
              <p className="text-[10px] text-[#636E72] mb-3">
                Restaurantes, mercado, transporte y otros gastos no fijos. Sin arriendo,
                servicios ni suscripciones.
              </p>
              <div className="space-y-3">
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
                        <span className="text-[12px] font-medium text-[#2D3436] truncate">
                          {member.name}
                        </span>
                      </div>
                      <span className="text-[12px] font-bold text-[#2D3436] shrink-0 ml-2">
                        {fmt(member.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#EC4899]"
                        style={{ width: `${member.percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[#B2BEC3] mt-0.5">
                      {member.percent}% del gasto variable del periodo
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-[#F5F5F5] p-4">
            <p className="text-[12px] font-bold text-[#2D3436] mb-1">
              Distribución del ingreso
            </p>
            <p className="text-[10px] text-[#636E72] mb-4">
              Ingresos, gastos, ahorros y dinero libre
            </p>
            <DonutChart
              slices={budgetSlices}
              centerValue={fmt(summary.monthlyIncome)}
              centerLabel="Ingresos"
            />
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white text-[11px]">
              <div className="flex items-center gap-1 text-[#00BFA5]">
                <ArrowUpRight className="w-3 h-3" />
                <span className="font-bold">{fmt(summary.monthlyIncome)}</span>
              </div>
              <div className="flex items-center gap-1 text-[#EC4899]">
                <ArrowDownRight className="w-3 h-3" />
                <span className="font-bold">{fmt(summary.monthlyExpenses)}</span>
              </div>
              <div className="text-[#F59E0B] font-bold">
                Ahorros: {fmt(summary.periodSavings)}
              </div>
              <div className="text-[#636E72] font-bold">
                Libre: {fmt(Math.max(0, summary.guiltFreeMoney))}
              </div>
            </div>
            {summary.savingsBreakdown.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white space-y-1.5">
                <p className="text-[10px] font-semibold text-[#636E72]">
                  Aportes por meta este periodo
                </p>
                {summary.savingsBreakdown.map(goal => (
                  <div
                    key={goal.name}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <span className="flex items-center gap-1.5 text-[#2D3436] truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: goal.color }}
                      />
                      {goal.name}
                    </span>
                    <span className="font-bold text-[#636E72] shrink-0 ml-2">
                      {fmt(goal.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {summary.totalSavings > 0 && (
              <p className="text-[10px] text-[#636E72] mt-2">
                Total acumulado en metas: {fmt(summary.totalSavings)}
              </p>
            )}
          </div>

          {summary.expenseGroups.length > 0 && (
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              <p className="text-[12px] font-bold text-[#2D3436] mb-1">
                ¿En qué se va la plata?
              </p>
              <p className="text-[10px] text-[#636E72] mb-4">
                Arriendo, servicios, mercado, restaurantes, transporte y otros
              </p>
              <DonutChart
                slices={summary.expenseGroups.map(g => ({
                  value: g.amount,
                  color: g.color,
                  label: g.name,
                }))}
                centerValue={fmt(summary.monthlyExpenses)}
                centerLabel="Gastos"
              />
            </div>
          )}

          <div className="rounded-2xl bg-[#F5F5F5] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-bold text-[#2D3436]">
                Tendencia ingresos / gastos
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
                Gastos por categoría · periodo actual
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

          {summary.allCategories.length === 0 &&
            summary.savingsGoals.length === 0 &&
            summary.monthlyIncome === 0 && (
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
