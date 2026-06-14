'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Search, Plus, PiggyBank, LineChart, Settings,
} from 'lucide-react'

const TABS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/buscar', label: 'Buscar', icon: Search },
  { href: '/nuevo', label: 'Añadir', icon: Plus, center: true },
  { href: '/ahorros', label: 'Ahorros', icon: PiggyBank },
  { href: '/predicciones', label: 'Radar', icon: LineChart },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
] as const

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-auto max-w-md px-4 pb-4">
        <div className="flex items-end justify-between rounded-[28px] bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-2 py-2">
          {TABS.map(tab => {
            const active = isActive(pathname, tab.href)
            const Icon = tab.icon

            if ('center' in tab && tab.center) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="relative -top-4 flex flex-col items-center"
                  aria-label={tab.label}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] flex items-center justify-center shadow-lg shadow-[#00BFA5]/30 ring-4 ring-white/80">
                    <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                </Link>
              )
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-1 flex-col items-center gap-0.5 py-1.5 min-w-0"
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? 'text-[#00BFA5]' : 'text-[#B2BEC3]'
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={`text-[9px] font-semibold truncate transition-colors ${
                    active ? 'text-[#00BFA5]' : 'text-[#B2BEC3]'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
