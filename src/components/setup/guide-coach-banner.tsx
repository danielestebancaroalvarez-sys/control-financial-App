'use client'

import { Sparkles } from 'lucide-react'

const ACCENTS = {
  finance: '#00BFA5',
  time: '#6366F1',
} as const

export function GuideCoachBanner({
  module,
  stepIndex,
  totalSteps,
  title,
}: {
  module: 'finance' | 'time'
  stepIndex: number
  totalSteps: number
  title: string
}) {
  const accent = ACCENTS[module]

  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-start gap-3 border"
      style={{
        borderColor: `${accent}40`,
        backgroundColor: `${accent}12`,
      }}
    >
      <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: accent }}>
          Paso {stepIndex} de {totalSteps}
        </p>
        <p className="text-[13px] font-semibold text-cc-primary mt-0.5">{title}</p>
      </div>
    </div>
  )
}
