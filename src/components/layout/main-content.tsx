'use client'

import { usePathname } from 'next/navigation'
import { getAppModule } from '@/lib/app/module'

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isTime = getAppModule(pathname) === 'time'

  return (
    <main className={`flex-1 ${isTime ? 'select-none' : ''}`}>{children}</main>
  )
}
