'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X } from 'lucide-react'
import type { GuideStepConfig } from '@/lib/setup/assistant-guide-config'

const MODULE_ACCENTS = {
  finance: '#00BFA5',
  time: '#6366F1',
} as const

export function FloatingGuideModal({
  step,
  onDismiss,
}: {
  step: GuideStepConfig
  onDismiss: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const accent = MODULE_ACCENTS[step.module]

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const modal = (
    <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-md rounded-2xl cc-surface-solid border border-[#EEEEEE] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-4"
        role="dialog"
        aria-label={step.title}
      >
        <div className="flex items-start gap-3">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
            style={{ backgroundColor: accent }}
          >
            <Sparkles className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: accent }}
            >
              Paso {step.stepIndex} de {step.totalSteps}
            </p>
            <p className="text-[14px] font-bold text-cc-primary mt-0.5">
              {step.title}
            </p>
            <p className="text-[12px] text-cc-secondary mt-1 leading-relaxed">
              {step.description}
            </p>
            {step.hint && (
              <p className="text-[11px] text-cc-muted mt-2">{step.hint}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-cc-muted hover:text-cc-primary shrink-0"
            aria-label="Cerrar guía"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 w-full py-2.5 rounded-xl text-[12px] font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          Entendido
        </button>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
