'use client'

import { useState, useTransition } from 'react'
import { BarChart2 } from 'lucide-react'
import { updateDashboardPeriod } from '@/lib/profile/actions'
import type { Period } from '@/lib/finance/types'

export function DashboardPeriodSetting({ current }: { current: Period }) {
  const [period, setPeriod] = useState(current)
  const [pending, startTransition] = useTransition()

  function handleChange(value: Period) {
    setPeriod(value)
    startTransition(async () => {
      await updateDashboardPeriod(value)
    })
  }

  return (
    <section className="rounded-[24px] bg-white/90 backdrop-blur-md shadow-sm border border-white/60 p-5">
      <h2 className="text-[15px] font-bold text-[#2D3436] mb-1 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-[#00BFA5]" />
        Vista del Dashboard
      </h2>
      <p className="text-[12px] text-[#636E72] mb-4">
        Elige si prefieres ver ingresos y gastos por semana o por mes.
      </p>
      <div className="flex rounded-2xl bg-[#F5F5F5] p-1">
        {(['weekly', 'monthly'] as const).map(value => (
          <button
            key={value}
            type="button"
            disabled={pending}
            onClick={() => handleChange(value)}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all disabled:opacity-60 ${
              period === value
                ? 'bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF] text-white shadow-sm'
                : 'text-[#636E72]'
            }`}
          >
            {value === 'weekly' ? 'Semanal' : 'Mensual'}
          </button>
        ))}
      </div>
    </section>
  )
}
