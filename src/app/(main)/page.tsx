import { createClient } from '@/utils/supabase/server'
import { getUserHousehold } from '@/lib/household/queries'
import { getUserDashboardPeriod } from '@/lib/profile/queries'
import { getDashboardSummary } from '@/lib/finance/queries'
import { formatMoney } from '@/lib/finance/format'
import { ReconcileForm } from './reconcile-form'
import {
  DollarSign, PiggyBank, BarChart2, Sparkles,
  ArrowDownRight, ArrowUpRight,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const household = await getUserHousehold()
  if (!household || !user) return null

  const period = await getUserDashboardPeriod()
  const summary = await getDashboardSummary(household.id, period)
  const currency = household.base_currency
  const fmt = (n: number) => formatMoney(n, currency)
  const periodLabel = period === 'weekly' ? 'Esta semana' : 'Este mes'

  const incomeVsExpenseTotal = summary.monthlyIncome + summary.monthlyExpenses
  const incomePercent =
    incomeVsExpenseTotal > 0
      ? Math.round((summary.monthlyIncome / incomeVsExpenseTotal) * 100)
      : 50

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-[#2D3436]">Dashboard</h1>
        <p className="text-[13px] text-[#636E72]">
          {household.name} · {periodLabel}
        </p>
      </div>

      <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm overflow-hidden">
        <div className="rounded-2xl bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] m-4 p-5 text-white shadow-lg">
          <p className="text-[12px] font-medium opacity-90 mb-1">Saldo real</p>
          <p className="text-[32px] font-bold tracking-tight">{fmt(summary.realBalance)}</p>
          <p className="text-[11px] opacity-75 mt-1">Ingresos − Gastos + Ajustes (histórico)</p>
        </div>

        <div className="px-4 pb-4 space-y-4">
          <ReconcileForm
            householdId={household.id}
            currentBalance={summary.realBalance}
            currency={currency}
          />

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
            <p className="text-[11px] text-[#636E72] mt-1">
              Ingresos del periodo − gastos fijos − aportes a ahorro
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: DollarSign, label: 'Balance', value: fmt(summary.realBalance), color: 'from-[#00BFA5]/20 to-[#2DD4BF]/20', iconColor: 'text-[#00BFA5]' },
              { icon: PiggyBank, label: 'Ahorros', value: fmt(summary.totalSavings), color: 'from-[#F59E0B]/20 to-[#FBBF24]/20', iconColor: 'text-[#F59E0B]' },
              { icon: BarChart2, label: 'Gastos', value: fmt(summary.monthlyExpenses), color: 'from-[#EC4899]/20 to-[#F472B6]/20', iconColor: 'text-[#EC4899]' },
            ].map(({ icon: Icon, label, value, color, iconColor }) => (
              <div
                key={label}
                className={`rounded-2xl bg-gradient-to-br ${color} p-3 flex flex-col items-center gap-1`}
              >
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <span className="text-[10px] text-[#636E72] font-medium">{label}</span>
                <span className="text-[11px] font-bold text-[#2D3436] text-center leading-tight">{value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-[#F5F5F5] p-4">
            <p className="text-[12px] font-semibold text-[#2D3436] mb-3">{periodLabel}</p>
            <div className="flex h-3 rounded-full overflow-hidden mb-3">
              <div className="bg-[#00BFA5]" style={{ width: `${incomePercent}%` }} />
              <div className="bg-[#EC4899]" style={{ width: `${100 - incomePercent}%` }} />
            </div>
            <div className="flex justify-between text-[12px]">
              <div className="flex items-center gap-1 text-[#00BFA5]">
                <ArrowUpRight className="w-3 h-3" />
                <span className="font-semibold">{fmt(summary.monthlyIncome)}</span>
              </div>
              <div className="flex items-center gap-1 text-[#EC4899]">
                <ArrowDownRight className="w-3 h-3" />
                <span className="font-semibold">{fmt(summary.monthlyExpenses)}</span>
              </div>
            </div>
          </div>

          {summary.topCategories.length > 0 && (
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              <p className="text-[12px] font-semibold text-[#2D3436] mb-3">
                Top categorías — {periodLabel.toLowerCase()}
              </p>
              <div className="space-y-2">
                {summary.topCategories.map(cat => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color ?? '#636E72' }}
                    />
                    <span className="text-[13px] text-[#2D3436] flex-1 truncate">{cat.name}</span>
                    <span className="text-[13px] font-bold text-[#2D3436]">{fmt(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.savingsGoals.length > 0 && (
            <div className="rounded-2xl bg-[#F5F5F5] p-4">
              <p className="text-[12px] font-semibold text-[#2D3436] mb-3">
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

          {summary.topCategories.length === 0 && summary.savingsGoals.length === 0 && (
            <div className="rounded-2xl bg-[#F5F5F5] px-5 py-4 text-center">
              <p className="text-[13px] text-[#636E72]">
                Añade transacciones y metas de ahorro para ver estadísticas aquí.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
