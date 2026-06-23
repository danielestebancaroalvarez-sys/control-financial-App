'use client'

import { useTransition } from 'react'
import { Sparkles, Wallet, Clock } from 'lucide-react'
import {
  activateAssistant,
  exploreFreely,
} from '@/lib/setup/assistant-actions'

export function AssistantWelcomeCard() {
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      await action()
    })
  }

  return (
    <section className="cc-surface rounded-[24px] p-5 border border-[#00BFA5]/25 bg-gradient-to-br from-[#00BFA5]/8 to-[#6366F1]/8">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-white/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-[#00BFA5]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold text-cc-primary">
            ¿Quieres que te guiemos?
          </h2>
          <p className="text-[12px] text-cc-secondary mt-1 leading-relaxed">
            Activa el asistente por módulo y te llevamos a las pantallas reales de
            configuración, paso a paso. También puedes explorar libremente.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => activateAssistant('finance'))}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#00BFA5] text-white text-[13px] font-bold disabled:opacity-60"
        >
          <Wallet className="w-4 h-4" />
          Activar Finanzas
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => activateAssistant('time'))}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#6366F1] text-white text-[13px] font-bold disabled:opacity-60"
        >
          <Clock className="w-4 h-4" />
          Activar Tiempo
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => exploreFreely())}
          className="w-full py-2.5 rounded-2xl text-[12px] font-semibold text-cc-secondary hover:text-cc-primary"
        >
          Explorar por mi cuenta
        </button>
      </div>
    </section>
  )
}
