'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Clock, Plane, Wallet } from 'lucide-react'
import { CoupleCashLogo } from '@/components/login/couple-cash-logo'
import { getAppModule, moduleHomePath, type AppModule } from '@/lib/app/module'

const MODULES: {
  id: AppModule
  label: string
  description: string
  icon: typeof Wallet
  accent: string
}[] = [
  {
    id: 'finance',
    label: 'Finanzas',
    description: 'Dinero, ahorros y gastos',
    icon: Wallet,
    accent: '#00BFA5',
  },
  {
    id: 'time',
    label: 'Tiempo',
    description: 'Horario, tareas y metas',
    icon: Clock,
    accent: '#6366F1',
  },
  {
    id: 'travel',
    label: 'Viajes',
    description: 'Planificación y presupuesto',
    icon: Plane,
    accent: '#0EA5E9',
  },
]

export function AppModulePicker() {
  const pathname = usePathname()
  const router = useRouter()
  const active = getAppModule(pathname)
  const current = MODULES.find(m => m.id === active) ?? MODULES[0]
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  function selectModule(id: AppModule) {
    setOpen(false)
    if (id === active) return
    router.push(moduleHomePath(id))
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-2xl py-1.5 pr-2 pl-1 -ml-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Cambiar de aplicación"
      >
        <CoupleCashLogo className="w-8 h-8 shrink-0" />
        <div className="text-left min-w-0">
          <p className="text-[9px] font-semibold text-cc-muted uppercase tracking-wide leading-none">
            Couple Hub
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="text-[16px] font-bold text-cc-primary tracking-tight truncate"
              style={{ color: open ? current.accent : undefined }}
            >
              {current.label}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-cc-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Aplicaciones"
          className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2.5rem,16rem)] rounded-2xl cc-surface shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] border border-[var(--cc-border)] overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-[var(--cc-border)]">
            <p className="text-[10px] font-semibold text-cc-muted">Elige una app</p>
          </div>
          <ul className="p-1.5 space-y-1">
            {MODULES.map(mod => {
              const Icon = mod.icon
              const isActive = mod.id === active
              return (
                <li key={mod.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => selectModule(mod.id)}
                    className={`w-full flex items-start gap-3 rounded-xl p-3 text-left transition-colors ${
                      isActive
                        ? 'bg-black/[0.04] dark:bg-white/[0.06]'
                        : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${mod.accent}22`,
                        color: mod.accent,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-cc-primary flex items-center gap-2">
                        {mod.label}
                        {isActive && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white"
                            style={{ backgroundColor: mod.accent }}
                          >
                            Activa
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-cc-secondary mt-0.5">{mod.description}</p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
