'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Sparkles, Wallet, X } from 'lucide-react'
import {
  activateAssistant,
  exploreFreely,
} from '@/lib/setup/assistant-actions'
import type { AssistantState } from '@/lib/setup/assistant-types'
import { shouldShowWelcomeCard } from '@/lib/setup/assistant-types'
import { AssistantStepSheet } from './assistant-step-sheet'

export function AssistantWelcomeModal({ state }: { state: AssistantState }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [stepSheetOpen, setStepSheetOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (shouldShowWelcomeCard(state)) {
      setOpen(true)
    }
  }, [state])

  function firstIncompleteHref(): string | null {
    const step = state.finance.steps.find(s => !s.completed)
    return step?.href ?? null
  }

  function run(
    action: () => Promise<{ error?: string }>,
    options?: { openSheet?: boolean; startTour?: boolean }
  ) {
    startTransition(async () => {
      const result = await action()
      if (result.error) return
      setOpen(false)
      if (options?.openSheet) {
        setStepSheetOpen(true)
        return
      }
      if (options?.startTour) {
        const href = firstIncompleteHref()
        if (href) router.push(href)
      }
      router.refresh()
    })
  }

  if (!mounted) return null

  if (stepSheetOpen && state.finance.steps.length > 0) {
    return (
      <AssistantStepSheet
        steps={state.finance.steps}
        completedCount={state.finance.completedCount}
        totalCount={state.finance.totalCount}
        onClose={() => setStepSheetOpen(false)}
      />
    )
  }

  if (!open) return null

  const modal = (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
        onClick={() => run(() => exploreFreely())}
      />
      <div className="relative w-full max-w-md rounded-[24px] cc-surface-solid border border-[var(--cc-border-subtle)] shadow-[0_12px_40px_rgba(0,0,0,0.25)] p-5">
        <button
          type="button"
          onClick={() => run(() => exploreFreely())}
          className="absolute top-3 right-3 p-2 rounded-xl text-cc-muted hover:text-cc-primary"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-[#00BFA5]/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#00BFA5]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-cc-primary">
              Configura tu hogar en 5 pasos
            </h2>
            <p className="text-[12px] text-cc-secondary mt-1 leading-relaxed">
              Te guiamos con flechas sobre la app: ingresos fijos, gastos,
              suscripciones, ahorros y escaneo de recibos.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() => activateAssistant('finance'), { startTour: true })
            }
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#00BFA5] text-white text-[13px] font-bold disabled:opacity-60"
          >
            <Wallet className="w-4 h-4" />
            Empezar guía
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() => activateAssistant('finance'), { openSheet: true })
            }
            className="w-full py-2.5 rounded-2xl text-[12px] font-semibold text-cc-secondary hover:text-cc-primary cc-surface-muted"
          >
            Ver lista de pasos
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => exploreFreely())}
            className="w-full py-2.5 rounded-2xl text-[12px] font-semibold text-cc-secondary hover:text-cc-primary"
          >
            Explorar por mi cuenta
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
