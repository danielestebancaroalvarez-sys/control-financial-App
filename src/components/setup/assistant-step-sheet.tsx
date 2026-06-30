'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Sparkles, X } from 'lucide-react'
import { useIsDark } from '@/hooks/use-is-dark'
import type { AssistantModule, AssistantStep } from '@/lib/setup/assistant-types'
import { resolveGuideStepTheme } from '@/lib/setup/guide-step-theme'

const MODULE_LABELS: Record<AssistantModule, string> = {
  finance: 'Finanzas',
  time: 'Tiempo',
}

const MODULE_ACCENTS: Record<AssistantModule, string> = {
  finance: '#00BFA5',
  time: '#6366F1',
}

export function AssistantStepSheet({
  module,
  steps,
  completedCount,
  totalCount,
  onClose,
}: {
  module: AssistantModule
  steps: AssistantStep[]
  completedCount: number
  totalCount: number
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const isDark = useIsDark()
  const accent = MODULE_ACCENTS[module]
  const label = MODULE_LABELS[module]
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  useEffect(() => {
    setMounted(true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    for (const step of steps) {
      if (!step.completed) router.prefetch(step.href)
    }
  }, [steps, router])

  if (!mounted) return null

  const sheet = (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-t-[24px] cc-surface-solid border-t border-[var(--cc-border-subtle)] shadow-[0_-8px_40px_rgba(0,0,0,0.25)] max-h-[75vh] flex flex-col">
        <div className="px-5 pt-4 pb-3 border-b border-[var(--cc-border-subtle)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-cc-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
                Asistente {label}
              </p>
              <p className="text-[18px] font-bold text-cc-primary mt-1">
                {completedCount}/{totalCount} pasos
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-cc-muted hover:text-cc-primary hover:bg-[var(--cc-surface-muted)]"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[var(--cc-surface-muted)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: accent }}
            />
          </div>
        </div>

        <ul className="overflow-y-auto px-4 py-3 space-y-2">
          {steps.map((step, index) => {
            const isOptional = step.optional
            const done = step.completed
            const stepTheme = resolveGuideStepTheme(step.id, isDark)
            return (
              <li key={step.id}>
                {done ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--cc-surface-muted)] opacity-80">
                    <span
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white"
                      style={{ background: stepTheme.gradient }}
                    >
                      <Check className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-cc-primary line-through decoration-cc-muted">
                        {step.label}
                        {isOptional ? ' (opcional)' : ''}
                      </p>
                      <p className="text-[11px] text-cc-secondary">{step.description}</p>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={step.href}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-2xl border-2 transition-colors hover:opacity-95"
                    style={{
                      borderColor: stepTheme.accent,
                      backgroundColor: stepTheme.surfaceBg,
                    }}
                  >
                    <span
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[12px] font-bold text-white"
                      style={{ background: stepTheme.gradient }}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-cc-primary">
                        {step.label}
                        {isOptional ? (
                          <span className="text-[10px] font-semibold text-cc-muted ml-1">
                            · opcional
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-cc-secondary">{step.description}</p>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 shrink-0"
                      style={{ color: stepTheme.accent }}
                    />
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )

  return createPortal(sheet, document.body)
}
