'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { getAppModule } from '@/lib/app/module'
import type { AssistantModule, AssistantState } from '@/lib/setup/assistant-types'
import { shouldShowWelcomeCard } from '@/lib/setup/assistant-types'
import { getTourStepTheme } from '@/lib/setup/tour-step-theme'
import { AssistantStepSheet } from './assistant-step-sheet'

const MODULE_ACCENTS: Record<Exclude<AssistantModule, never>, string> = {
  finance: '#00BFA5',
  time: '#6366F1',
}

export function AssistantHeaderButton({ state }: { state: AssistantState }) {
  const pathname = usePathname()
  const appModule = getAppModule(pathname)
  const [open, setOpen] = useState(false)

  if (appModule === 'travel' || !state.isOwner) return null

  const module: AssistantModule = appModule === 'time' ? 'time' : 'finance'
  const moduleState = module === 'time' ? state.time : state.finance
  const accent = MODULE_ACCENTS[module]
  const nextStep = moduleState.steps.find(s => !s.completed)
  const dotAccent = nextStep ? getTourStepTheme(nextStep.id).accent : accent

  const moduleActive =
    moduleState.status === 'active' &&
    moduleState.completedCount < moduleState.totalCount

  const showDot = shouldShowWelcomeCard(state) || moduleActive

  const showButton =
    shouldShowWelcomeCard(state) ||
    moduleState.status === 'active' ||
    (moduleState.status === 'completed' && moduleState.steps.length > 0)

  if (!showButton || moduleState.steps.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 rounded-full bg-white/80 border border-white/70 shadow-sm flex items-center justify-center text-cc-secondary transition-colors shrink-0"
        aria-label="Guía de configuración"
      >
        <Sparkles className="w-5 h-5" style={{ color: accent }} />
        {showDot && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[10px] h-[10px] rounded-full border-2 border-white"
            style={{ backgroundColor: dotAccent }}
            aria-hidden
          />
        )}
      </button>

      {open && (
        <AssistantStepSheet
          module={module}
          steps={moduleState.steps}
          completedCount={moduleState.completedCount}
          totalCount={moduleState.totalCount}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
