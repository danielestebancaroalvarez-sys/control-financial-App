'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { getAppModule } from '@/lib/app/module'
import type { AssistantState } from '@/lib/setup/assistant-types'
import { shouldShowWelcomeCard } from '@/lib/setup/assistant-types'
import { AssistantStepSheet } from './assistant-step-sheet'

const MODULE_ACCENTS = {
  finance: '#00BFA5',
  time: '#6366F1',
  travel: '#0EA5E9',
} as const

export function AssistantHeaderButton({ state }: { state: AssistantState }) {
  const pathname = usePathname()
  const appModule = getAppModule(pathname)
  const [open, setOpen] = useState(false)

  if (appModule === 'travel') return null

  const moduleState = appModule === 'time' ? state.time : state.finance
  const accent = MODULE_ACCENTS[appModule]

  const showDot =
    shouldShowWelcomeCard(state) ||
    (moduleState.status === 'active' &&
      moduleState.completedCount < moduleState.totalCount)

  const showButton =
    shouldShowWelcomeCard(state) || moduleState.status === 'active'

  if (!showButton) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 rounded-full bg-white/80 border border-white/70 shadow-sm flex items-center justify-center text-cc-secondary transition-colors shrink-0"
        aria-label="Asistente de configuración"
      >
        <Sparkles className="w-5 h-5" style={{ color: accent }} />
        {showDot && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[10px] h-[10px] rounded-full border-2 border-white"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
        )}
      </button>

      {open && moduleState.steps.length > 0 && (
        <AssistantStepSheet
          module={appModule === 'time' ? 'time' : 'finance'}
          steps={moduleState.steps}
          completedCount={moduleState.completedCount}
          totalCount={moduleState.totalCount}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
