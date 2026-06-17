'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getAppModule, moduleHomePath, type AppModule } from '@/lib/app/module'

const MODULES: { id: AppModule; label: string }[] = [
  { id: 'finance', label: 'Finanzas' },
  { id: 'time', label: 'Tiempo' },
]

export function ModuleSwitcher() {
  const pathname = usePathname()
  const active = getAppModule(pathname)

  return (
    <div className="flex rounded-2xl cc-surface-muted p-1 mb-3">
      {MODULES.map(mod => {
        const isActive = active === mod.id
        return (
          <Link
            key={mod.id}
            href={moduleHomePath(mod.id)}
            prefetch
            className={`flex-1 py-2 rounded-xl text-[12px] font-bold text-center transition-all ${
              isActive
                ? mod.id === 'time'
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-sm'
                  : 'bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF] text-white shadow-sm'
                : 'text-cc-secondary'
            }`}
          >
            {mod.label}
          </Link>
        )
      })}
    </div>
  )
}
