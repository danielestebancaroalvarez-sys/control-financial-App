'use client'

import { usePathname } from 'next/navigation'
import { Home, Search, Plus, PiggyBank, LineChart } from 'lucide-react'
import { getTabIndex } from './tab-routes'
import { TabBarLink } from './tab-bar-link'

const TABS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/buscar', label: 'Buscar', icon: Search },
  { href: '/nuevo', label: 'Añadir', icon: Plus, center: true },
  { href: '/ahorros', label: 'Ahorros', icon: PiggyBank },
  { href: '/predicciones', label: 'Radar', icon: LineChart },
] as const

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function BottomTabBar() {
  const pathname = usePathname()
  const activeIndex = getTabIndex(pathname)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md px-4">
        <div className="relative flex items-end justify-around rounded-[28px] bg-white/75 backdrop-blur-2xl border border-white/70 shadow-[0_8px_40px_rgba(0,0,0,0.14)] px-2 py-2">
          {TABS.map((tab, index) => {
            const active = isActive(pathname, tab.href)
            const Icon = tab.icon

            if ('center' in tab && tab.center) {
              return (
                <TabBarLink
                  key={tab.href}
                  href={tab.href}
                  label={tab.label}
                  icon={Icon}
                  active={active}
                  center
                >
                  <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                </TabBarLink>
              )
            }

            return (
              <TabBarLink
                key={tab.href}
                href={tab.href}
                label={tab.label}
                icon={Icon}
                active={active}
                showActiveDot={active && activeIndex === index}
              />
            )
          })}
        </div>
      </div>
    </nav>
  )
}
