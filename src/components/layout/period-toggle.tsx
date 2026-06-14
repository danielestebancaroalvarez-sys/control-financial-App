'use client'

import { motion } from 'framer-motion'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

type Period = 'weekly' | 'monthly'

export function PeriodToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = (searchParams.get('period') === 'weekly' ? 'weekly' : 'monthly') as Period

  const setPeriod = useCallback(
    (value: Period) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === 'monthly') {
        params.delete('period')
      } else {
        params.set('period', value)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="relative flex rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 p-1 shadow-sm">
      {(['weekly', 'monthly'] as const).map(value => {
        const active = period === value
        const label = value === 'weekly' ? 'Semanal' : 'Mensual'
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className="relative flex-1 py-2 text-[12px] font-semibold z-10 transition-colors"
            style={{ color: active ? '#fff' : '#636E72' }}
          >
            {active && (
              <motion.span
                layoutId="period-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF] shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
