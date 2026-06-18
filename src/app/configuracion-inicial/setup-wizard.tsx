'use client'

import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Calendar,
  Check,
  Home,
  Loader2,
  PiggyBank,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { CoupleCashLogo } from '@/components/login/couple-cash-logo'
import { CopyButton } from '@/app/(main)/ajustes/copy-button'
import { ProfileSettingsForm } from '@/components/profile/profile-settings-form'
import { completeInitialSetup, skipInitialSetup } from '@/lib/setup/actions'
import type { SetupContext } from '@/lib/setup/types'
import type { Period } from '@/lib/finance/types'
import { formatMoney } from '@/lib/finance/format'

const FIXED_TEMPLATES = [
  { categoryName: 'Arriendo', label: 'Arriendo / hipoteca', icon: Home },
  { categoryName: 'Luz', label: 'Luz', icon: Zap },
  { categoryName: 'Internet', label: 'Internet', icon: Zap },
] as const

type FullStep = 'welcome' | 'profile' | 'income' | 'fixed' | 'savings' | 'invite' | 'period' | 'done'
type MemberStep = 'welcome' | 'profile' | 'period' | 'done'

export function SetupWizard({ context }: { context: SetupContext }) {
  const fmt = (n: number) => formatMoney(n, context.currency)
  const [loading, setLoading] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [stepIndex, setStepIndex] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [fixedEnabled, setFixedEnabled] = useState<Record<string, boolean>>({
    Arriendo: true,
    Luz: false,
    Internet: false,
  })
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, string>>({})
  const [savingsEnabled, setSavingsEnabled] = useState(false)
  const [savingsName, setSavingsName] = useState('Fondo de emergencia')
  const [savingsMonthly, setSavingsMonthly] = useState('')
  const [savingsTarget, setSavingsTarget] = useState('')
  const [period, setPeriod] = useState<Period>('monthly')

  const steps = useMemo(() => {
    if (context.mode === 'member') {
      return ['welcome', 'profile', 'period', 'done'] as MemberStep[]
    }
    const full: FullStep[] = ['welcome', 'profile', 'income', 'fixed', 'savings', 'period', 'done']
    if (context.isOwner) {
      full.splice(5, 0, 'invite')
    }
    return full
  }, [context.mode, context.isOwner])

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
    const result = await skipInitialSetup()
    if (result?.error) {
      setError(result.error)
      setSkipping(false)
    }
  }

  async function handleFinish() {
    setLoading(true)
    setError(null)

    const fixedExpenses = FIXED_TEMPLATES.flatMap(t => {
      if (!fixedEnabled[t.categoryName]) return []
      const amount = parseFloat(fixedAmounts[t.categoryName] ?? '')
      if (!amount || amount <= 0) return []
      return { categoryName: t.categoryName, amount }
    })

    const result = await completeInitialSetup({
      householdId: context.householdId,
      mode: context.mode,
      monthlyIncome:
        context.mode === 'full' ? parseFloat(monthlyIncome) || undefined : undefined,
      fixedExpenses: context.mode === 'full' ? fixedExpenses : undefined,
      savingsGoalName:
        context.mode === 'full' && savingsEnabled ? savingsName : undefined,
      savingsMonthly:
        context.mode === 'full' && savingsEnabled
          ? parseFloat(savingsMonthly) || undefined
          : undefined,
      savingsTarget:
        context.mode === 'full' && savingsEnabled
          ? parseFloat(savingsTarget) || undefined
          : undefined,
      dashboardPeriod: period,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen cc-app-bg flex flex-col px-5 py-8">
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col">
        <div className="flex flex-col items-center mb-6">
          <CoupleCashLogo className="w-12 h-12 mb-2" />
          <p className="text-[11px] font-semibold text-[#00BFA5] uppercase tracking-wide">
            Configuración inicial
          </p>
        </div>

        <div className="h-1.5 rounded-full cc-surface-muted mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#00BFA5] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="cc-surface rounded-[28px] p-6 flex-1 flex flex-col">
          {currentStep === 'welcome' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#E0F2F1] flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-[#00BFA5]" />
              </div>
              <h1 className="text-[22px] font-bold text-cc-primary mb-2">
                {context.mode === 'full'
                  ? `¡Bienvenido a ${context.householdName}!`
                  : `Te uniste a ${context.householdName}`}
              </h1>
              <p className="text-[14px] text-cc-secondary leading-relaxed">
                {context.mode === 'full'
                  ? 'En unos pasos cargamos lo esencial: ingresos, gastos fijos y cómo quieres ver tu dinero. Así el dashboard ya muestra datos útiles desde el primer día.'
                  : 'Tu pareja ya configuró el hogar. Elige cómo prefieres ver el resumen y empieza a registrar tus gastos.'}
              </p>
              {context.mode === 'full' && (
                <ul className="mt-4 space-y-2 text-[12px] text-cc-secondary">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00BFA5] shrink-0" />
                    Ingreso mensual del hogar
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00BFA5] shrink-0" />
                    Gastos fijos (arriendo, servicios)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00BFA5] shrink-0" />
                    Meta de ahorro opcional
                  </li>
                </ul>
              )}
            </>
          )}

          {currentStep === 'profile' && (
            <>
              <h2 className="text-[20px] font-bold text-cc-primary mb-1">
                Crea tu perfil
              </h2>
              <p className="text-[13px] text-cc-secondary mb-4">
                Tu nombre y foto se mostrarán cuando registres gastos o ingresos en el hogar.
              </p>
              <ProfileSettingsForm
                initialFullName={context.profileFullName}
                initialAvatarUrl={context.profileAvatarUrl}
                email={context.email}
                onSaved={goNext}
                variant="wizard"
              />
            </>
          )}

          {currentStep === 'income' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] flex items-center justify-center mb-4">
                <Banknote className="w-6 h-6 text-[#00BFA5]" />
              </div>
              <h2 className="text-[20px] font-bold text-cc-primary mb-1">
                ¿Cuánto ingresa el hogar al mes?
              </h2>
              <p className="text-[13px] text-cc-secondary mb-5">
                Suma salarios o ingresos fijos. Se registrará como ingreso recurrente mensual.
              </p>
              <label className="text-[12px] font-semibold text-cc-secondary">
                Ingreso mensual total ({context.currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={monthlyIncome}
                onChange={e => setMonthlyIncome(e.target.value)}
                placeholder="Ej: 5000"
                className="mt-1.5 w-full px-4 py-3.5 rounded-2xl cc-input text-[16px] font-semibold outline-none"
              />
              <p className="text-[11px] text-cc-muted mt-2">
                Puedes dejarlo vacío y añadirlo después en Nuevo.
              </p>
            </>
          )}

          {currentStep === 'fixed' && (
            <>
              <h2 className="text-[20px] font-bold text-cc-primary mb-1">
                Gastos fijos del mes
              </h2>
              <p className="text-[13px] text-cc-secondary mb-4">
                Los que se repiten cada mes. Activa los que apliquen e indica el monto.
              </p>
              <div className="space-y-3">
                {FIXED_TEMPLATES.map(t => {
                  const Icon = t.icon
                  const enabled = fixedEnabled[t.categoryName]
                  return (
                    <div
                      key={t.categoryName}
                      className={`rounded-2xl p-3 border transition-colors ${
                        enabled
                          ? 'cc-surface-muted border-[#00BFA5]/30'
                          : 'border-transparent opacity-70'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={e =>
                            setFixedEnabled(prev => ({
                              ...prev,
                              [t.categoryName]: e.target.checked,
                            }))
                          }
                          className="rounded accent-[#00BFA5]"
                        />
                        <Icon className="w-4 h-4 text-[#00BFA5]" />
                        <span className="text-[13px] font-semibold text-cc-primary flex-1">
                          {t.label}
                        </span>
                      </label>
                      {enabled && (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={fixedAmounts[t.categoryName] ?? ''}
                          onChange={e =>
                            setFixedAmounts(prev => ({
                              ...prev,
                              [t.categoryName]: e.target.value,
                            }))
                          }
                          placeholder={`Monto en ${context.currency}`}
                          className="mt-2 w-full px-3 py-2.5 rounded-xl cc-input text-[14px] outline-none"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {currentStep === 'savings' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#FFF8E1] flex items-center justify-center mb-4">
                <PiggyBank className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <h2 className="text-[20px] font-bold text-cc-primary mb-1">
                ¿Tienen una meta de ahorro?
              </h2>
              <p className="text-[13px] text-cc-secondary mb-4">
                Opcional. Puedes crear más metas después en Ahorros.
              </p>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-cc-primary mb-3">
                <input
                  type="checkbox"
                  checked={savingsEnabled}
                  onChange={e => setSavingsEnabled(e.target.checked)}
                  className="rounded accent-[#00BFA5]"
                />
                Sí, quiero definir una meta
              </label>
              {savingsEnabled && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={savingsName}
                    onChange={e => setSavingsName(e.target.value)}
                    placeholder="Nombre de la meta"
                    className="w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={savingsMonthly}
                    onChange={e => setSavingsMonthly(e.target.value)}
                    placeholder={`Aporte mensual (${context.currency})`}
                    className="w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={savingsTarget}
                    onChange={e => setSavingsTarget(e.target.value)}
                    placeholder={`Meta total opcional (${context.currency})`}
                    className="w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
                  />
                </div>
              )}
            </>
          )}

          {currentStep === 'invite' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#E8EAF6] flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#5C6BC0]" />
              </div>
              <h2 className="text-[20px] font-bold text-cc-primary mb-1">
                Invita a tu pareja
              </h2>
              <p className="text-[13px] text-cc-secondary mb-4">
                Comparte este código para que se una al hogar y vean el mismo dashboard en
                tiempo real.
              </p>
              <div className="rounded-2xl cc-surface-muted p-4 flex items-center justify-between gap-3">
                <span className="text-[22px] font-bold tracking-[0.15em] text-cc-primary">
                  {context.inviteCode}
                </span>
                <CopyButton text={context.inviteCode} />
              </div>
              <p className="text-[11px] text-cc-muted mt-3">
                También lo encuentras en Ajustes → Tu Hogar.
              </p>
            </>
          )}

          {currentStep === 'period' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#E0F2F1] flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-[#00BFA5]" />
              </div>
              <h2 className="text-[20px] font-bold text-cc-primary mb-1">
                ¿Cómo prefieres ver tus finanzas?
              </h2>
              <p className="text-[13px] text-cc-secondary mb-5">
                Aplica al inicio, búsqueda y predicciones. Puedes cambiarlo en Ajustes.
              </p>
              <div className="flex rounded-2xl cc-surface-muted p-1">
                {(['weekly', 'monthly'] as const).map(value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPeriod(value)}
                    className={`flex-1 py-3 rounded-xl text-[14px] font-bold transition-all ${
                      period === value
                        ? 'bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF] text-white shadow-sm'
                        : 'text-cc-secondary'
                    }`}
                  >
                    {value === 'weekly' ? 'Semanal' : 'Mensual'}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === 'done' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-[#00BFA5]" />
              </div>
              <h2 className="text-[20px] font-bold text-cc-primary mb-1">
                ¡Listo para empezar!
              </h2>
              <p className="text-[13px] text-cc-secondary leading-relaxed">
                {context.mode === 'full'
                  ? 'Tu hogar ya tiene la base para el dashboard, el radar de pagos y el dinero libre de culpa.'
                  : 'Ya puedes registrar gastos y ver el resumen compartido con tu pareja.'}
              </p>
              {context.mode === 'full' && monthlyIncome && (
                <p className="text-[12px] text-cc-secondary mt-3">
                  Ingreso configurado: {fmt(parseFloat(monthlyIncome) || 0)}/mes
                </p>
              )}
            </>
          )}

          {error && (
            <p className="text-[12px] text-red-600 mt-4">{error}</p>
          )}

          <div className="mt-auto pt-6 flex flex-col gap-2">
            {currentStep === 'done' ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleFinish}
                className="w-full py-4 rounded-full bg-[#00BFA5] text-white font-bold text-[15px] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Ir al inicio
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : currentStep === 'profile' ? null : (
              <button
                type="button"
                onClick={goNext}
                className="w-full py-4 rounded-full bg-[#00BFA5] text-white font-bold text-[15px] flex items-center justify-center gap-2"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center justify-between">
              {stepIndex > 0 && currentStep !== 'done' ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1 text-[13px] font-semibold text-cc-secondary"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                disabled={skipping || loading}
                onClick={handleSkip}
                className="text-[12px] font-semibold text-cc-muted hover:text-cc-secondary disabled:opacity-50"
              >
                {skipping ? 'Omitiendo…' : 'Configurar después'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
