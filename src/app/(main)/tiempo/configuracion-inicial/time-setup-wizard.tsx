'use client'

import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  Clock,
  Loader2,
  Moon,
  Sparkles,
} from 'lucide-react'
import { CoupleHubMark } from '@/components/brand/couple-cash-mark'
import { ProfileSettingsForm } from '@/components/profile/profile-settings-form'
import {
  requestNotificationPermission,
  setActivityRemindersEnabled,
} from '@/lib/notifications/activity-reminder-preferences'
import { completeTimeSetup, skipTimeSetup } from '@/lib/setup/time-actions'
import type { TimeSetupContext } from '@/lib/setup/time-types'

type Step = 'welcome' | 'profile' | 'sleep' | 'reminders' | 'done'

export function TimeSetupWizard({ context }: { context: TimeSetupContext }) {
  const [loading, setLoading] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)

  const [sleepMode, setSleepMode] = useState<'tracker' | 'block'>('tracker')
  const [sleepStart, setSleepStart] = useState('22:30')
  const [sleepEnd, setSleepEnd] = useState('07:00')
  const [enableReminders, setEnableReminders] = useState(true)

  const steps = useMemo(() => {
    const list: Step[] = ['welcome']
    if (context.needsProfile) list.push('profile')
    list.push('sleep', 'reminders', 'done')
    return list
  }, [context.needsProfile])

  const currentStep = steps[stepIndex]
  const progress = ((stepIndex + 1) / steps.length) * 100

  function goNext() {
    setError(null)
    if (stepIndex < steps.length - 1) setStepIndex(i => i + 1)
  }

  function goBack() {
    setError(null)
    if (stepIndex > 0) setStepIndex(i => i - 1)
  }

  async function handleSkip() {
    setSkipping(true)
    setError(null)
    const result = await skipTimeSetup()
    if (result?.error) {
      setError(result.error)
      setSkipping(false)
    }
  }

  async function handleFinish() {
    setLoading(true)
    setError(null)

    if (enableReminders) {
      const permission = await requestNotificationPermission()
      if (permission === 'granted') {
        setActivityRemindersEnabled(true)
      }
    }

    const result = await completeTimeSetup({
      householdId: context.householdId,
      createSleepBlock: sleepMode === 'block',
      sleepStartTime: sleepMode === 'block' ? sleepStart : undefined,
      sleepEndTime: sleepMode === 'block' ? sleepEnd : undefined,
      enableReminders,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#EEF2FF] to-[#F8FAFC] flex flex-col">
      <div className="h-1 bg-[#E0E7FF]">
        <div
          className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-5 py-8 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <CoupleHubMark className="w-10 h-10" />
          <button
            type="button"
            onClick={handleSkip}
            disabled={skipping || loading}
            className="text-[12px] font-semibold text-cc-secondary disabled:opacity-50"
          >
            {skipping ? 'Saltando...' : 'Saltar'}
          </button>
        </div>

        {currentStep === 'welcome' && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-[26px] font-bold text-cc-primary mb-2">
              Configura Tiempo
            </h1>
            <p className="text-[14px] text-cc-secondary mb-6">
              Registra sueño, bloques fijos, tareas y metas con {context.householdName}.
            </p>
            <ul className="space-y-3 text-[13px] text-cc-primary">
              <li className="flex gap-2">
                <Moon className="w-4 h-4 text-[#6366F1] shrink-0 mt-0.5" />
                Contador de sueño con botón o bloque nocturno
              </li>
              <li className="flex gap-2">
                <Clock className="w-4 h-4 text-[#6366F1] shrink-0 mt-0.5" />
                Horario semanal y productividad
              </li>
              <li className="flex gap-2">
                <Bell className="w-4 h-4 text-[#6366F1] shrink-0 mt-0.5" />
                Recordatorios de actividades
              </li>
            </ul>
          </div>
        )}

        {currentStep === 'profile' && (
          <div className="flex-1">
            <h2 className="text-[22px] font-bold text-cc-primary mb-2">Tu perfil</h2>
            <p className="text-[13px] text-cc-secondary mb-4">
              Así te verá tu pareja en el horario y las tareas.
            </p>
            <ProfileSettingsForm
              initialFullName={context.profileFullName}
              initialAvatarUrl={context.profileAvatarUrl}
              email={context.email}
              accent="time"
            />
          </div>
        )}

        {currentStep === 'sleep' && (
          <div className="flex-1 space-y-4">
            <h2 className="text-[22px] font-bold text-cc-primary">¿Cómo registrarás el sueño?</h2>
            <p className="text-[13px] text-cc-secondary">
              Puedes cambiarlo después en el dashboard o en Bloques fijos.
            </p>
            <button
              type="button"
              onClick={() => setSleepMode('tracker')}
              className={`w-full text-left p-4 rounded-2xl border-2 ${
                sleepMode === 'tracker'
                  ? 'border-[#6366F1] bg-[#6366F1]/10'
                  : 'border-transparent cc-surface'
              }`}
            >
              <p className="font-bold text-[14px] text-cc-primary">Botón al dormir / despertar</p>
              <p className="text-[12px] text-cc-secondary mt-1">
                Recomendado si tu horario varía
              </p>
            </button>
            <button
              type="button"
              onClick={() => setSleepMode('block')}
              className={`w-full text-left p-4 rounded-2xl border-2 ${
                sleepMode === 'block'
                  ? 'border-[#6366F1] bg-[#6366F1]/10'
                  : 'border-transparent cc-surface'
              }`}
            >
              <p className="font-bold text-[14px] text-cc-primary">Bloque fijo nocturno</p>
              <p className="text-[12px] text-cc-secondary mt-1">
                Misma franja cada día en el horario
              </p>
            </button>
            {sleepMode === 'block' && (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-[12px] text-cc-secondary">
                  Dormir
                  <input
                    type="time"
                    value={sleepStart}
                    onChange={e => setSleepStart(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl cc-surface-muted text-[13px]"
                  />
                </label>
                <label className="text-[12px] text-cc-secondary">
                  Despertar
                  <input
                    type="time"
                    value={sleepEnd}
                    onChange={e => setSleepEnd(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl cc-surface-muted text-[13px]"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {currentStep === 'reminders' && (
          <div className="flex-1 space-y-4">
            <h2 className="text-[22px] font-bold text-cc-primary">Recordatorios</h2>
            <p className="text-[13px] text-cc-secondary">
              Te avisamos de tareas e hitos de metas en el navegador (con identidad Couple Hub).
            </p>
            <button
              type="button"
              onClick={() => setEnableReminders(v => !v)}
              className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between ${
                enableReminders
                  ? 'border-[#6366F1] bg-[#6366F1]/10'
                  : 'border-transparent cc-surface'
              }`}
            >
              <span className="font-bold text-[14px] text-cc-primary">
                Activar recordatorios de actividades
              </span>
              <span
                className={`w-10 h-6 rounded-full relative transition-colors ${
                  enableReminders ? 'bg-[#6366F1]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    enableReminders ? 'left-5' : 'left-1'
                  }`}
                />
              </span>
            </button>
          </div>
        )}

        {currentStep === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#6366F1]/15 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-[#6366F1]" />
            </div>
            <h2 className="text-[22px] font-bold text-cc-primary mb-2">¡Listo!</h2>
            <p className="text-[14px] text-cc-secondary">
              Tu módulo Tiempo está configurado. Empieza registrando sueño o una actividad.
            </p>
          </div>
        )}

        {error && <p className="text-[12px] text-red-600 mt-4">{error}</p>}

        <div className="mt-8 flex gap-3">
          {stepIndex > 0 && currentStep !== 'done' && (
            <button
              type="button"
              onClick={goBack}
              className="flex-1 py-3.5 rounded-2xl cc-surface-muted text-cc-primary font-bold text-[14px] flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </button>
          )}
          {currentStep === 'done' ? (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-[14px] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Ir a Tiempo
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-[14px] flex items-center justify-center gap-1"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
