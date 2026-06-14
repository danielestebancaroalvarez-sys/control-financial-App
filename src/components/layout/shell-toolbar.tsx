'use client'

import { usePathname } from 'next/navigation'
import { PeriodToggle } from './period-toggle'
import { showsPeriodToggle } from './tab-routes'

export function ShellToolbar() {
  const pathname = usePathname()

  if (!showsPeriodToggle(pathname)) return null

  return (
    <div className="mb-4">
      <PeriodToggle />
    </div>
  )
}
