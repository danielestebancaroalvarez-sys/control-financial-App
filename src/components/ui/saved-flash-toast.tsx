'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { TX_TYPE_THEME } from '@/components/transactions/tx-type-theme'

const MESSAGES: Record<string, string> = {
  income: TX_TYPE_THEME.income.savedMessage,
  expense: TX_TYPE_THEME.expense.savedMessage,
  'fixed-income': TX_TYPE_THEME.income.savedFixedMessage,
  'fixed-expense': TX_TYPE_THEME.expense.savedFixedMessage,
}

export function SavedFlashToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const saved = searchParams.get('saved')
  const [visible, setVisible] = useState(false)

  const message = saved ? MESSAGES[saved] : null

  useEffect(() => {
    if (!message) {
      setVisible(false)
      return
    }
    setVisible(true)
    const hideTimer = window.setTimeout(() => setVisible(false), 3200)
    const cleanTimer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString())
      next.delete('saved')
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 3400)
    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(cleanTimer)
    }
  }, [message, pathname, router, searchParams])

  if (!visible || !message) return null

  return (
    <div
      role="status"
      className="fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-[var(--cc-border)] bg-[var(--cc-surface-solid)] px-4 py-3 text-[13px] font-semibold text-cc-primary shadow-lg transition-opacity duration-300"
      style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
        <Check className="h-4 w-4" />
      </span>
      {message}
    </div>
  )
}
