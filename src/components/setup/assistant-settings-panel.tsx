'use client'

import { useTransition } from 'react'
import { Loader2, Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import {
  setAssistantStatus,
} from '@/lib/setup/assistant-actions'
import type { AssistantModule, AssistantStatus } from '@/lib/setup/assistant-types'

const ACCENTS: Record<AssistantModule, string> = {
  finance: '#00BFA5',
  time: '#6366F1',
}

export function AssistantSettingsPanel({
  module,
  status,
  completedCount,
  totalCount,
}: {
  module: AssistantModule
  status: AssistantStatus
  completedCount: number
  totalCount: number
}) {
  const [pending, startTransition] = useTransition()
  const accent = ACCENTS[module]
  const label = module === 'finance' ? 'Finanzas' : 'Tiempo'

  function run(action: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      await action()
    })
  }

  const statusLabel =
    status === 'active'
      ? 'Activo'
      : status === 'completed'
        ? 'Completado'
        : status === 'declined'
          ? 'Pausado'
          : 'Sin activar'

  return (
    <section className="cc-surface rounded-[24px] p-5">
      <h2 className="text-[15px] font-bold text-cc-primary mb-1 flex items-center gap-2">
        <Sparkles className="w-4 h-4" style={{ color: accent }} />
        Asistente de configuración
      </h2>
      <p className="text-[12px] text-cc-secondary mb-3">
        Guía paso a paso para configurar {label}. Estado:{' '}
        <span className="font-semibold text-cc-primary">{statusLabel}</span>
        {totalCount > 0 ? ` · ${completedCount}/${totalCount} pasos` : ''}
      </p>

      <div className="flex flex-wrap gap-2">
        {(status === 'unset' || status === 'declined' || status === 'completed') && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setAssistantStatus(module, 'active'))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {pending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Activar
          </button>
        )}

        {status === 'active' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setAssistantStatus(module, 'declined'))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold cc-surface-muted text-cc-primary disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Pause className="w-3.5 h-3.5" />
            )}
            Pausar
          </button>
        )}

        {(status === 'completed' || status === 'declined' || status === 'active') && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setAssistantStatus(module, 'active'))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold cc-surface-muted text-cc-primary disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            Reiniciar guía
          </button>
        )}
      </div>
    </section>
  )
}
