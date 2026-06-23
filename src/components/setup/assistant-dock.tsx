'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { getAppModule } from '@/lib/app/module'
import type { AssistantState } from '@/lib/setup/assistant-types'
import { AssistantStepSheet } from './assistant-step-sheet'

const MODULE_ACCENTS = {
  finance: '#00BFA5',
  time: '#6366F1',
} as const

const MODULE_LABELS = {
  finance: 'Finanzas',
  time: 'Tiempo',
} as const

export function AssistantDock({ state }: { state: AssistantState }) {
  const pathname = usePathname()
  const appModule = getAppModule(pathname)
  const [open, setOpen] = useState(false)

  if (appModule === 'travel') return null

  const moduleState = appModule === 'time' ? state.time : state.finance
  if (moduleState.status !== 'active') return null

  const accent = MODULE_ACCENTS[appModule]
  const label = MODULE_LABELS[appModule]
  const { completedCount, totalCount, steps } = moduleState
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <>
      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-5 pointer-events-none">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full cc-surface-solid border border-[#EEEEEE] shadow-[0_8px_24px_rgba(0,0,0,0.12)] max-w-md w-full"
        >
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
            style={{ backgroundColor: accent }}
          >
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="flex-1 min-w-0 text-left">
            <span className="block text-[12px] font-bold text-cc-primary truncate">
              Asistente {label} · {completedCount}/{totalCount}
            </span>
            <span className="block h-1.5 mt-1 rounded-full bg-[#F0F0F0] overflow-hidden">
              <span
                className="block h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: accent }}
              />
            </span>
          </span>
        </button>
      </div>

      {open && (
        <AssistantStepSheet
          module={appModule}
          steps={steps}
          completedCount={completedCount}
          totalCount={totalCount}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
