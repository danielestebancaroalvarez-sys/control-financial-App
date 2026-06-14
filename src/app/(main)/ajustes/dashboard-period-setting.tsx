'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2 } from 'lucide-react'
import { updateDashboardPeriod } from '@/lib/profile/actions'
import type { Period } from '@/lib/finance/types'

export function DashboardPeriodSetting({ current }: { current: Period }) {
  const router = useRouter()
  const [period, setPeriod] = useState(current)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setPeriod(current)
  }, [current])

  function handleChange(value: Period) {
    setPeriod(value)
    setError(null)
    startTransition(async () => {
      const result = await updateDashboardPeriod(value)
      if (result.error) {
        setError(result.error)
        setPeriod(current)
        return
      }
      router.refresh()
    })
  }

  return (
    <section className="rounded-[24px] bg-white/90 backdrop-blur-md shadow-sm border border-white/60 p-5">
      <h2 className="text-[15px] font-bold text-[#2D3436] mb-1 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-[#00BFA5]" />
        Vista del Dashboard
      </h2>
      <p className="text-[12px] text-[#636E72] mb-4">
        Aplica a inicio, búsqueda, radar y predicciones.
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
      {error && (
        <p className="text-[11px] text-red-600 mt-2">{error}</p>
      )}
    </section>
  )
}
