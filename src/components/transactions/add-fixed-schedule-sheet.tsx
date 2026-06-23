'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { FixedScheduleForm } from './fixed-schedule-form'
import { GuideCoachBanner } from '@/components/setup/guide-coach-banner'
import type { Category } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'
import type { TxType } from './tx-type-theme'

export type FijosGuideMode = 'income' | 'fixed' | 'subscription'

const GUIDE_COPY: Record<
  FijosGuideMode,
  { title: string; stepIndex: number; totalSteps: number }
> = {
  income: {
    title: 'Registra tu ingreso mensual',
    stepIndex: 3,
    totalSteps: 5,
  },
  fixed: {
    title: 'Añade un gasto fijo del hogar',
    stepIndex: 4,
    totalSteps: 5,
  },
  subscription: {
    title: 'Registra una suscripción',
    stepIndex: 5,
    totalSteps: 5,
  },
}

export function AddFixedScheduleSheet({
  guide,
  householdId,
  currency,
  categories,
  onClose,
  onSaved,
}: {
  guide: FijosGuideMode
  householdId: string
  currency: CurrencyCode
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const coach = GUIDE_COPY[guide]

  const defaultType: TxType = guide === 'income' ? 'income' : 'expense'

  const categoryFilter = useMemo(() => {
    if (guide === 'fixed') return (c: Category) => c.is_fixed
    if (guide === 'subscription') return (c: Category) => c.is_subscription
    return undefined
  }, [guide])

  const defaultCategoryName =
    guide === 'subscription' ? 'Suscripciones' : undefined

  useEffect(() => {
    setMounted(true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  if (!mounted) return null

  const sheet = (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-t-[24px] cc-surface-solid border-t border-[#EEEEEE] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-[#F0F0F0] cc-surface-solid">
          <p className="text-[15px] font-bold text-cc-primary">
            {guide === 'income' ? 'Nuevo ingreso fijo' : 'Nuevo gasto fijo'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-cc-muted hover:text-cc-primary"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <GuideCoachBanner
            module="finance"
            stepIndex={coach.stepIndex}
            totalSteps={coach.totalSteps}
            title={coach.title}
          />
          <FixedScheduleForm
            householdId={householdId}
            baseCurrency={currency}
            categories={categories}
            defaultType={defaultType}
            hideTypeSelector
            defaultCategoryName={defaultCategoryName}
            categoryFilter={categoryFilter}
            onSuccess={() => {
              onSaved()
              onClose()
            }}
          />
        </div>
      </div>
    </div>
  )

  return createPortal(sheet, document.body)
}
