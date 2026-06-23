'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2, Moon, Sun, CalendarClock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  endSleepSession,
  logSleepManual,
  startSleepSession,
} from '@/lib/time/sleep-actions'
import { formatDuration } from '@/lib/time/format'
import type { SleepTrackerData } from '@/lib/time/sleep-queries'

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SleepTracker({
  householdId,
  data,
  variant = 'standalone',
  onActionSuccess,
}: {
  householdId: string
  data: SleepTrackerData
  variant?: 'standalone' | 'embedded'
  onActionSuccess?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)

  const defaultEnd = useMemo(() => new Date(), [])
  const defaultStart = useMemo(() => {
    const d = new Date()
    d.setHours(d.getHours() - 8)
    return d
  }, [])

  const [manualStart, setManualStart] = useState(toLocalInputValue(defaultStart))
  const [manualEnd, setManualEnd] = useState(toLocalInputValue(defaultEnd))

  function runAction(
    action: () => Promise<{ error?: string }>,
    options?: { navigateTo?: string }
  ) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        setError(result.error)
        return
      }
      onActionSuccess?.()
      if (options?.navigateTo) {
        router.push(options.navigateTo)
      }
      router.refresh()
    })
  }

  const isEmbedded = variant === 'embedded'

  return (
    <section
      className={
        isEmbedded
          ? 'cc-surface rounded-[24px] p-4 space-y-3'
          : 'cc-surface rounded-[24px] p-4 border border-[#4F46E5]/20'
      }
    >
      {!isEmbedded && (
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="text-[14px] font-bold text-cc-primary flex items-center gap-2">
              <Moon className="w-4 h-4 text-[#4F46E5]" />
              Registro de sueño
            </h2>
            <p className="text-[11px] text-cc-secondary mt-0.5">
              Botón rápido o registro manual de inicio y fin
            </p>
          </div>
          <Link
            href="/tiempo/buscar?tab=fijos"
            className="text-[10px] font-semibold text-[#6366F1] shrink-0"
          >
            Bloque fijo →
          </Link>
        </div>
      )}

      {isEmbedded && (
        <p className="text-[11px] text-cc-secondary">
          Si registras sueño real, reemplaza el bloque fijo de esa noche en el horario y las
          estadísticas.
        </p>
      )}

      {data.activeSession ? (
        <div className="rounded-2xl bg-[#4F46E5]/10 p-3 mb-3">
          <p className="text-[12px] text-cc-primary font-medium">
            Durmiendo desde {formatClock(data.activeSession.startedAt)}
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => runAction(() => endSleepSession(householdId))}
            className="mt-2 w-full py-2.5 rounded-xl bg-[#4F46E5] text-white text-[12px] font-bold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sun className="w-4 h-4" />
                Desperté
              </>
            )}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => runAction(() => startSleepSession(householdId))}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white text-[12px] font-bold disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Moon className="w-4 h-4" />
              Estoy durmiendo
            </>
          )}
        </button>
      )}

      <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
        <div className="rounded-xl cc-surface-muted p-2.5">
          <p className="text-cc-muted">Anoche</p>
          <p className="font-bold text-cc-primary text-[14px]">
            {data.lastNightMinutes > 0 ? formatDuration(data.lastNightMinutes) : '—'}
          </p>
        </div>
        <div className="rounded-xl cc-surface-muted p-2.5">
          <p className="text-cc-muted">Media 7 días</p>
          <p className="font-bold text-cc-primary text-[14px]">
            {data.weeklyAverageMinutes > 0
              ? formatDuration(data.weeklyAverageMinutes)
              : '—'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowManual(v => !v)}
        className="text-[11px] font-semibold text-[#6366F1] flex items-center gap-1"
      >
        <CalendarClock className="w-3.5 h-3.5" />
        {showManual ? 'Ocultar registro manual' : 'Registrar sueño manualmente'}
      </button>

      {showManual && (
        <form
          className="mt-3 space-y-2"
          onSubmit={e => {
            e.preventDefault()
            runAction(
              () =>
                logSleepManual(
                  householdId,
                  new Date(manualStart).toISOString(),
                  new Date(manualEnd).toISOString()
                ),
              isEmbedded ? { navigateTo: '/tiempo' } : undefined
            )
          }}
        >
          <label className="block text-[10px] text-cc-secondary">
            Dormí
            <input
              type="datetime-local"
              value={manualStart}
              onChange={e => setManualStart(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl cc-surface-muted text-[12px] outline-none focus:ring-2 focus:ring-[#6366F1]/30"
            />
          </label>
          <label className="block text-[10px] text-cc-secondary">
            Desperté
            <input
              type="datetime-local"
              value={manualEnd}
              onChange={e => setManualEnd(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl cc-surface-muted text-[12px] outline-none focus:ring-2 focus:ring-[#6366F1]/30"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full py-2 rounded-xl bg-[#6366F1] text-white text-[12px] font-bold disabled:opacity-60"
          >
            {pending ? 'Guardando...' : 'Guardar sueño'}
          </button>
        </form>
      )}

      {isEmbedded && (
        <Link
          href="/tiempo/buscar?tab=fijos"
          className="text-[11px] font-semibold text-[#6366F1] inline-flex items-center gap-1"
        >
          Configurar bloque fijo de sueño →
        </Link>
      )}

      {error && <p className="text-[11px] text-red-600 mt-2">{error}</p>}
    </section>
  )
}
