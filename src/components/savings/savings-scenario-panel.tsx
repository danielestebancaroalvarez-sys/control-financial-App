'use client'

import { useMemo, useState } from 'react'
import { formatMoney } from '@/lib/finance/format'
import {
  applyContributionBoost,
  estimateMonthsForGoalInput,
  formatMonthsLabel,
} from '@/lib/finance/savings'
import { SavingsProjectionChart } from '@/components/savings/savings-projection-chart'
import type { SavingsGoalInput } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

export function SavingsScenarioPanel({
  baseGoal,
  accentColor,
  currency,
  guiltFreeMoney,
  periodSavings,
}: {
  baseGoal: SavingsGoalInput
  accentColor: string
  currency: CurrencyCode
  guiltFreeMoney?: number
  periodSavings?: number
}) {
  const [extraContribution, setExtraContribution] = useState(0)
  const fmt = (n: number) => formatMoney(n, currency)

  const baseMonths = useMemo(() => estimateMonthsForGoalInput(baseGoal), [baseGoal])
  const scenarioGoal = useMemo(
    () => applyContributionBoost(baseGoal, extraContribution),
    [baseGoal, extraContribution]
  )
  const scenarioMonths = useMemo(
    () => estimateMonthsForGoalInput(scenarioGoal),
    [scenarioGoal]
  )

  const monthsSaved =
    baseMonths !== null && scenarioMonths !== null && extraContribution > 0
      ? Math.max(0, baseMonths - scenarioMonths)
      : 0

  const remainingGuiltFree =
    guiltFreeMoney !== undefined && periodSavings !== undefined
      ? guiltFreeMoney - extraContribution
      : null

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-bold text-[#2D3436]">
            ¿Y si aportas más al mes?
          </p>
          <span className="text-[12px] font-bold text-[#00BFA5]">
            +{fmt(extraContribution)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={500}
          step={10}
          value={extraContribution}
          onChange={e => setExtraContribution(Number(e.target.value))}
          className="w-full accent-[#00BFA5]"
        />
        <div className="flex justify-between text-[10px] text-[#B2BEC3] mt-0.5">
          <span>$0</span>
          <span>+$500/mes</span>
        </div>
      </div>

      {extraContribution > 0 && (
        <div className="rounded-xl bg-white px-3 py-2 space-y-1">
          <p className="text-[11px] text-[#636E72]">
            Base: <span className="font-semibold">{formatMonthsLabel(baseMonths)}</span>
            {' → '}
            Con +{fmt(extraContribution)}:{' '}
            <span className="font-semibold text-[#00BFA5]">
              {formatMonthsLabel(scenarioMonths)}
            </span>
          </p>
          {monthsSaved > 0 && (
            <p className="text-[11px] text-[#00BFA5] font-semibold">
              Llegas {monthsSaved} mes{monthsSaved === 1 ? '' : 'es'} antes
            </p>
          )}
          {remainingGuiltFree !== null && (
            <p
              className={`text-[11px] font-medium ${
                remainingGuiltFree < 0 ? 'text-[#EC4899]' : 'text-[#636E72]'
              }`}
            >
              Dinero libre tras aportes: {fmt(remainingGuiltFree)}
            </p>
          )}
        </div>
      )}

      <SavingsProjectionChart
        goal={extraContribution > 0 ? scenarioGoal : baseGoal}
        accentColor={accentColor}
        height={100}
      />
    </div>
  )
}
