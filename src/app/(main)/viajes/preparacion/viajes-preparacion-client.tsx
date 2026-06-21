'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, Loader2 } from 'lucide-react'
import { togglePrepStep } from '@/lib/travel/actions'
import { formatShortDate } from '@/lib/travel/format'

type PrepStepRow = {
  id: string
  trip_id: string
  title: string
  due_date: string | null
  step_type: string
  trip: { id: string; name: string; destination: string; start_date: string } | null
  assigneeName: string | null
}

export function ViajesPreparacionClient({
  steps,
  householdId,
}: {
  steps: PrepStepRow[]
  householdId: string
}) {
  const [pending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  function handleToggle(step: PrepStepRow) {
    if (!step.trip) return
    setLoadingId(step.id)
    startTransition(async () => {
      await togglePrepStep(householdId, step.trip_id, step.id, true)
      setLoadingId(null)
    })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-bold text-cc-primary">Preparación</h1>
      <p className="text-[12px] text-cc-secondary">
        Pasos pendientes de todos tus viajes
      </p>
      {steps.length === 0 ? (
        <p className="text-[13px] text-cc-secondary text-center py-8">
          No hay pasos pendientes
        </p>
      ) : (
        <ul className="space-y-2">
          {steps.map(step => (
            <li key={step.id} className="cc-surface rounded-[16px] p-3 flex gap-3">
              <button
                type="button"
                disabled={pending && loadingId === step.id}
                onClick={() => handleToggle(step)}
                className="shrink-0 w-6 h-6 rounded-full border-2 border-[#CBD5E1] flex items-center justify-center"
              >
                {loadingId === step.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-transparent" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-cc-primary">{step.title}</p>
                {step.trip && (
                  <Link
                    href={`/viajes/${step.trip.id}?tab=prep`}
                    className="text-[11px] text-[#0EA5E9] font-medium"
                  >
                    {step.trip.name}
                  </Link>
                )}
                {step.due_date && (
                  <p className="text-[10px] text-cc-muted mt-0.5">
                    {formatShortDate(step.due_date)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
