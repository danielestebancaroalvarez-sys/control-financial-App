'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Settings2 } from 'lucide-react'

const DISMISS_KEYS = {
  finance: 'couplehub_dismiss_finance_setup_nudge',
  time: 'couplehub_dismiss_time_setup_nudge',
  travel: 'couplehub_dismiss_travel_setup_nudge',
} as const

export function SetupNudgeBanner({
  module,
  href,
  title,
  description,
}: {
  module: 'finance' | 'time' | 'travel'
  href: string
  title: string
  description: string
}) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(DISMISS_KEYS[module]) === '1'
  })

  if (dismissed) return null

  const accent =
    module === 'travel' ? '#0EA5E9' : module === 'time' ? '#6366F1' : '#00BFA5'

  return (
    <div
      className="rounded-2xl p-4 flex gap-3 border"
      style={{
        borderColor: `${accent}40`,
        backgroundColor: `${accent}12`,
      }}
    >
      <Settings2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: accent }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-cc-primary">{title}</p>
        <p className="text-[11px] text-cc-secondary mt-0.5">{description}</p>
        <Link
          href={href}
          className="inline-block mt-2 text-[12px] font-bold"
          style={{ color: accent }}
        >
          Completar configuración →
        </Link>
      </div>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(DISMISS_KEYS[module], '1')
          setDismissed(true)
        }}
        className="shrink-0 p-1 text-cc-muted hover:text-cc-primary"
        aria-label="Cerrar aviso"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
