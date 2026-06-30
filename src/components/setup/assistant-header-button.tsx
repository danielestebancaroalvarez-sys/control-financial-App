'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { AssistantState } from '@/lib/setup/assistant-types'
import { shouldShowWelcomeCard } from '@/lib/setup/assistant-types'
import { getTourStepTheme } from '@/lib/setup/tour-step-theme'
import { AssistantStepSheet } from './assistant-step-sheet'

const ACCENT = '#00BFA5'

export function AssistantHeaderButton({ state }: { state: AssistantState }) {
  const [open, setOpen] = useState(false)

  if (!state.isOwner) return null

  const moduleState = state.finance
  const nextStep = moduleState.steps.find(s => !s.completed)
  const dotAccent = nextStep ? getTourStepTheme(nextStep.id).accent : ACCENT

  const showDot =
    shouldShowWelcomeCard(state) ||
    (moduleState.status === 'active' &&
      moduleState.completedCount < moduleState.totalCount)

  const showButton =
    shouldShowWelcomeCard(state) ||
    moduleState.status === 'active' ||
    (moduleState.status === 'completed' && moduleState.steps.length > 0)

  if (!showButton) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 rounded-full bg-white/80 border border-white/70 shadow-sm flex items-center justify-center text-cc-secondary transition-colors shrink-0"
        aria-label="Guía de configuración"
      >
        <Sparkles className="w-5 h-5" style={{ color: ACCENT }} />
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
          steps={moduleState.steps}
          completedCount={moduleState.completedCount}
          totalCount={moduleState.totalCount}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
