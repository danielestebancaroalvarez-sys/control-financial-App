'use client'

import { useState } from 'react'
import { ChevronDown, LineChart } from 'lucide-react'
import { SavingsProjectionChart } from '@/components/savings/savings-projection-chart'
import { SavingsScenarioPanel } from '@/components/savings/savings-scenario-panel'
import type { SavingsGoalInput } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

export function SavingsSimulationCollapsible({
  goal,
  accentColor,
  currency,
  guiltFreeMoney,
  periodSavings,
  defaultOpen = false,
}: {
  goal: SavingsGoalInput
  accentColor: string
  currency: CurrencyCode
  guiltFreeMoney?: number
  periodSavings?: number
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const hasContribution = Boolean(goal.contribution_amount && goal.contribution_amount > 0)

  return (
    <div className="mt-3 rounded-2xl bg-[#F5F5F5] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-[11px] font-bold text-cc-primary">
          <LineChart className="w-3.5 h-3.5 text-[#00BFA5]" />
          Simulación
        </span>
        <ChevronDown
          className={`w-4 h-4 text-cc-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-white/80">
          {hasContribution ? (
            <SavingsScenarioPanel
              baseGoal={goal}
              accentColor={accentColor}
              currency={currency}
              guiltFreeMoney={guiltFreeMoney}
              periodSavings={periodSavings}
            />
          ) : (
            <div className="pt-3">
              <SavingsProjectionChart goal={goal} accentColor={accentColor} height={130} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
