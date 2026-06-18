'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export function CollapsibleSection({
  title,
  summary,
  icon,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string
  summary?: string
  icon?: ReactNode
  badge?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="cc-surface rounded-[24px] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex flex-1 items-center gap-3 min-w-0 text-left"
          aria-expanded={open}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="flex-1 min-w-0">
            <span className="text-[13px] font-bold text-cc-primary">{title}</span>
            {summary && !open && (
              <span className="block text-[11px] text-cc-secondary mt-0.5 truncate">
                {summary}
              </span>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-cc-muted shrink-0 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
        {badge && <span className="shrink-0">{badge}</span>}
      </div>

      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-[var(--cc-border-subtle)]">
          {children}
        </div>
      )}
    </div>
  )
}
