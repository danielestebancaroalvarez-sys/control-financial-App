'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart2,
  CheckSquare,
  Moon,
  PiggyBank,
  Repeat,
  Sparkles,
  Tv,
  User,
  X,
} from 'lucide-react'
import { useIsDark } from '@/hooks/use-is-dark'
import type { GuideStepConfig } from '@/lib/setup/assistant-guide-config'
import { resolveGuideStepTheme } from '@/lib/setup/guide-step-theme'

function StepIcon({ stepId }: { stepId: GuideStepConfig['id'] }) {
  const className = 'w-5 h-5 text-white'
  switch (stepId) {
    case 'income':
      return <ArrowDownLeft className={className} />
    case 'fixed':
      return <ArrowUpRight className={className} />
    case 'subscription':
      return <Tv className={className} />
    case 'savings':
      return <PiggyBank className={className} />
    case 'period':
      return <BarChart2 className={className} />
    case 'profile':
      return <User className={className} />
    case 'sleep':
      return <Moon className={className} />
    case 'task':
      return <CheckSquare className={className} />
    case 'new':
      return <Repeat className={className} />
    default:
      return <Sparkles className={className} />
  }
}

export function FloatingGuideModal({
  step,
  onDismiss,
}: {
  step: GuideStepConfig
  onDismiss: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const isDark = useIsDark()
  const theme = resolveGuideStepTheme(step.id, isDark)
  const progress = (step.stepIndex / step.totalSteps) * 100

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const modal = (
    <AnimatePresence>
      <motion.button
        key="backdrop"
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[69] bg-black/50 backdrop-blur-[2px]"
        aria-label="Cerrar guía"
        onClick={onDismiss}
      />
      <motion.div
        key="panel"
        initial={{ opacity: 0, y: 32, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-md rounded-[22px] overflow-hidden border-2 cc-surface-solid"
          style={{
            borderColor: theme.accent,
            boxShadow: `${theme.glow}, 0 8px 32px rgba(0,0,0,0.2)`,
          }}
          role="dialog"
          aria-label={step.title}
        >
          <div className="h-1.5 w-full bg-[var(--cc-surface-muted)] overflow-hidden">
            <motion.div
              className="h-full rounded-r-full"
              style={{ background: theme.gradient }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div
            className="px-4 py-3 flex items-center gap-3 relative overflow-hidden"
            style={{ backgroundColor: theme.surfaceBg }}
          >
            <div
              className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
              style={{ background: theme.accent }}
            />
            <motion.span
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative"
              style={{ background: theme.gradient }}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <StepIcon stepId={step.id} />
            </motion.span>
            <div className="flex-1 min-w-0 relative">
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: theme.accent }}
              >
                Paso {step.stepIndex} de {step.totalSteps}
              </p>
              <p className="text-[15px] font-bold text-cc-primary leading-snug mt-0.5">
                {step.title}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 rounded-xl bg-[var(--cc-surface-solid)] text-cc-muted hover:text-cc-primary shrink-0 relative shadow-sm border border-[var(--cc-border-subtle)]"
              aria-label="Cerrar guía"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-3 space-y-3 bg-[var(--cc-surface-solid)]">
            <div className="flex justify-center gap-1.5">
              {Array.from({ length: step.totalSteps }, (_, i) => {
                const n = i + 1
                const done = n < step.stepIndex
                const current = n === step.stepIndex
                return (
                  <span
                    key={n}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: current ? 20 : 6,
                      background: done || current ? theme.accent : `${theme.accent}40`,
                    }}
                  />
                )
              })}
            </div>

            <p className="text-[13px] text-cc-secondary leading-relaxed">
              {step.description}
            </p>
            {step.hint && (
              <p
                className="text-[11px] font-semibold rounded-xl px-3 py-2 border"
                style={{
                  color: theme.accent,
                  backgroundColor: theme.surfaceBg,
                  borderColor: `${theme.accent}40`,
                }}
              >
                {step.hint}
              </p>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-3 rounded-2xl text-[13px] font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
              style={{ background: theme.gradient }}
            >
              Entendido, continuar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}
