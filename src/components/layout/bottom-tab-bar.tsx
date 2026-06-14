'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Search, Plus, PiggyBank, LineChart } from 'lucide-react'
import { getTabIndex } from './tab-routes'

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
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="relative -top-5 flex flex-col items-center shrink-0"
                  aria-label={tab.label}
                >
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/90 bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] ${
                      active
                        ? 'shadow-[#00BFA5]/40'
                        : 'shadow-[#00BFA5]/25'
                    }`}
                  >
                    <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </motion.div>
                </Link>
              )
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-col items-center gap-0.5 py-1.5 min-w-[3.25rem]"
              >
                {active && activeIndex === index && (
                  <motion.span
                    layoutId="tab-active"
                    className="absolute -top-0.5 w-1 h-1 rounded-full bg-[#00BFA5]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <motion.div whileTap={{ scale: 0.88 }}>
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      active ? 'text-[#00BFA5]' : 'text-[#B2BEC3]'
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </motion.div>
                <span
                  className={`text-[10px] font-semibold transition-colors ${
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
