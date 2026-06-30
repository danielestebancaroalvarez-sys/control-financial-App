'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDownLeft, ArrowUpRight, CalendarPlus, Repeat } from 'lucide-react'
import { AddTransactionForm } from '@/components/transactions/add-transaction-form'
import { FixedScheduleForm } from '@/components/transactions/fixed-schedule-form'
import { refreshAssistantProgress } from '@/lib/setup/assistant-actions'
import { TX_TYPE_THEME, type TxType } from '@/components/transactions/tx-type-theme'
import { usePersistedGuideParam, useScrollOnGuideDismiss } from '@/hooks/use-persisted-guide'
import { resolveGuideStepTheme } from '@/lib/setup/guide-step-theme'
import { useIsDark } from '@/hooks/use-is-dark'
import type { Category } from '@/lib/finance/types'
import type { CurrencyCode, HouseholdMember } from '@/lib/household/types'

type EntryMode = 'variable' | 'fixed'

export type NuevoGuideMode = 'income' | 'fixed' | 'subscription'

function parseNuevoGuide(raw: string | null | undefined): NuevoGuideMode | null {
  if (raw === 'income' || raw === 'fixed' || raw === 'subscription') return raw
  return null
}

function guideToDefaults(guide: NuevoGuideMode | null): {
  txType: TxType
  mode: EntryMode
  defaultCategoryName?: string
  categoryFilter?: (category: Category) => boolean
} {
  if (guide === 'income') {
    return { txType: 'income', mode: 'fixed' }
  }
  if (guide === 'fixed') {
    return {
      txType: 'expense',
      mode: 'fixed',
      categoryFilter: c => c.is_fixed,
    }
  }
  if (guide === 'subscription') {
    return {
      txType: 'expense',
      mode: 'fixed',
      defaultCategoryName: 'Suscripciones',
      categoryFilter: c => c.is_subscription,
    }
  }
  return { txType: 'expense', mode: 'variable' }
}

function getFormTheme(guide: NuevoGuideMode | null, txType: TxType) {
  if (guide === 'subscription') return TX_TYPE_THEME.subscription
  return TX_TYPE_THEME[txType]
}

function guideStepThemeId(guide: NuevoGuideMode | null): string {
  if (guide === 'fixed') return 'fixed_expense'
  return guide ?? 'income'
}

export function NuevoClient({
  householdId,
  baseCurrency,
  categories,
  members,
  currentUserId,
  authorName,
  authorAvatarUrl,
  initialGuide = null,
}: {
  householdId: string
  baseCurrency: CurrencyCode
  categories: Category[]
  members: HouseholdMember[]
  currentUserId: string
  authorName: string
  authorAvatarUrl?: string | null
  initialGuide?: NuevoGuideMode | null
}) {
  const router = useRouter()
  const isDark = useIsDark()
  const { urlGuide, effectiveGuide, locked } = usePersistedGuideParam(
    parseNuevoGuide,
    initialGuide
  )
  const defaults = useMemo(() => guideToDefaults(effectiveGuide), [effectiveGuide])
  const initialDefaults = useMemo(
    () => guideToDefaults(initialGuide ?? null),
    [initialGuide]
  )
  const [txType, setTxType] = useState<TxType>(initialDefaults.txType)
  const [mode, setMode] = useState<EntryMode>(initialDefaults.mode)
  const theme = getFormTheme(effectiveGuide, txType)
  const accentTheme = resolveGuideStepTheme(guideStepThemeId(effectiveGuide), isDark)

  useScrollOnGuideDismiss('guide-step-form')

  useEffect(() => {
    if (!urlGuide) return
    const next = guideToDefaults(urlGuide)
    setTxType(next.txType)
    setMode(next.mode)
  }, [urlGuide])

  async function handleFixedSaved() {
    if (effectiveGuide) {
      await refreshAssistantProgress('finance')
    }
    router.refresh()
  }

  const sectionHighlight = locked
    ? { boxShadow: `0 0 0 2px ${accentTheme.accent}40` }
    : undefined

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold text-cc-primary">Nuevo registro</h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">
          {effectiveGuide === 'income'
            ? 'Programa un ingreso recurrente (salario, rentas…).'
            : effectiveGuide === 'subscription'
              ? 'Programa suscripciones y débitos automáticos.'
              : effectiveGuide === 'fixed'
                ? 'Programa un gasto fijo recurrente (arriendo, servicios…).'
                : txType === 'income'
                  ? 'Registra dinero que entra o programa ingresos recurrentes.'
                  : 'Registra dinero que sale o programa gastos recurrentes.'}
        </p>
      </div>

      <div id="guide-step-type" className="space-y-2 rounded-2xl" style={sectionHighlight}>
        <p className="text-[11px] font-bold text-cc-secondary uppercase tracking-wide">
          1 · Tipo
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['income', 'expense'] as const).map(type => {
            const t =
              effectiveGuide === 'subscription' && type === 'expense'
                ? TX_TYPE_THEME.subscription
                : TX_TYPE_THEME[type]
            const active = txType === type
            const Icon = type === 'income' ? ArrowDownLeft : ArrowUpRight
            const disabled = locked && !active
            return (
              <button
                key={type}
                type="button"
                onClick={() => !locked && setTxType(type)}
                disabled={disabled}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  active ? t.cardActive : t.cardIdle
                } ${disabled ? 'opacity-60 cursor-default' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 bg-gradient-to-br ${t.gradient} text-white`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <p className={`text-[14px] font-bold ${active ? t.text : 'text-cc-primary'}`}>
                  {effectiveGuide === 'subscription' && type === 'expense'
                    ? 'Suscripción'
                    : t.label}
                </p>
                <p className="text-[10px] text-cc-secondary mt-0.5">
                  {type === 'income' ? 'Dinero que entra' : 'Dinero que sale'}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div id="guide-step-mode" className="space-y-2 rounded-2xl" style={sectionHighlight}>
        <p className="text-[11px] font-bold text-cc-secondary uppercase tracking-wide">
          2 · Forma de registro
        </p>
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => !locked && setMode('variable')}
            disabled={locked && mode !== 'variable'}
            className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
              mode === 'variable' ? theme.cardActive : theme.cardIdle
            } ${locked && mode !== 'variable' ? 'opacity-60 cursor-default' : ''}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${theme.gradient} text-white`}
            >
              <CalendarPlus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className={`text-[13px] font-bold ${mode === 'variable' ? theme.text : 'text-cc-primary'}`}>
                {theme.variableLabel}
              </p>
              <p className="text-[11px] text-cc-secondary mt-0.5">
                {theme.variableHint}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => !locked && setMode('fixed')}
            disabled={locked && mode !== 'fixed'}
            className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
              mode === 'fixed' ? theme.cardActive : theme.cardIdle
            } ${locked && mode !== 'fixed' ? 'opacity-60 cursor-default' : ''}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${theme.gradient} text-white`}
            >
              <Repeat className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className={`text-[13px] font-bold ${mode === 'fixed' ? theme.text : 'text-cc-primary'}`}>
                {theme.fixedLabel}
              </p>
              <p className="text-[11px] text-cc-secondary mt-0.5">
                {theme.fixedHint}
              </p>
            </div>
          </button>
        </div>
      </div>

      <div
        id="guide-step-form"
        className={`rounded-[24px] border-2 p-4 space-y-4 ${theme.cardActive}`}
        style={locked ? { borderColor: accentTheme.accent } : undefined}
      >
        <div className="flex items-center gap-2">
          <span className={`text-[12px] font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r ${theme.gradient} text-white`}>
            {mode === 'variable' ? theme.variableLabel : theme.fixedLabel}
          </span>
          {locked && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
              style={{ color: accentTheme.accent, backgroundColor: accentTheme.surfaceBg }}
            >
              Paso del asistente
            </span>
          )}
        </div>

        {mode === 'variable' ? (
          <AddTransactionForm
            key={`var-${txType}`}
            householdId={householdId}
            baseCurrency={baseCurrency}
            categories={categories}
            members={members}
            currentUserId={currentUserId}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            defaultType={txType}
            hideTypeSelector
          />
        ) : (
          <>
            <FixedScheduleForm
              key={`fix-${txType}-${effectiveGuide ?? 'none'}`}
              householdId={householdId}
              baseCurrency={baseCurrency}
              categories={categories}
              defaultType={txType}
              hideTypeSelector
              defaultCategoryName={defaults.defaultCategoryName}
              categoryFilter={defaults.categoryFilter}
              onSuccess={effectiveGuide ? handleFixedSaved : undefined}
            />
            <Link
              href="/fijos"
              className={`block text-center text-[12px] font-semibold ${theme.text}`}
            >
              Ver todos los fijos configurados →
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
