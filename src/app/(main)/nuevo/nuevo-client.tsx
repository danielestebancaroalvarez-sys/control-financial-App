'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, CalendarPlus, Repeat } from 'lucide-react'
import { AddTransactionForm } from '@/components/transactions/add-transaction-form'
import { FixedScheduleForm } from '@/components/transactions/fixed-schedule-form'
import { TX_TYPE_THEME, type TxType } from '@/components/transactions/tx-type-theme'
import type { Category } from '@/lib/finance/types'
import type { CurrencyCode, HouseholdMember } from '@/lib/household/types'

type EntryMode = 'variable' | 'fixed'

export function NuevoClient({
  householdId,
  baseCurrency,
  categories,
  members,
  currentUserId,
  authorName,
  authorAvatarUrl,
}: {
  householdId: string
  baseCurrency: CurrencyCode
  categories: Category[]
  members: HouseholdMember[]
  currentUserId: string
  authorName: string
  authorAvatarUrl?: string | null
}) {
  const [txType, setTxType] = useState<TxType>('expense')
  const [mode, setMode] = useState<EntryMode>('variable')
  const theme = TX_TYPE_THEME[txType]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold text-cc-primary">Nuevo registro</h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">
          {txType === 'income'
            ? 'Registra dinero que entra o programa ingresos recurrentes.'
            : 'Registra dinero que sale o programa gastos recurrentes.'}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold text-cc-secondary uppercase tracking-wide">
          1 · Tipo
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['income', 'expense'] as const).map(type => {
            const t = TX_TYPE_THEME[type]
            const active = txType === type
            const Icon = type === 'income' ? ArrowDownLeft : ArrowUpRight
            return (
              <button
                key={type}
                type="button"
                onClick={() => setTxType(type)}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  active ? t.cardActive : t.cardIdle
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 bg-gradient-to-br ${t.gradient} text-white`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <p className={`text-[14px] font-bold ${active ? t.text : 'text-cc-primary'}`}>
                  {t.label}
                </p>
                <p className="text-[10px] text-cc-secondary mt-0.5">
                  {type === 'income' ? 'Dinero que entra' : 'Dinero que sale'}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold text-cc-secondary uppercase tracking-wide">
          2 · Forma de registro
        </p>
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => setMode('variable')}
            className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
              mode === 'variable' ? theme.cardActive : theme.cardIdle
            }`}
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
            onClick={() => setMode('fixed')}
            className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
              mode === 'fixed' ? theme.cardActive : theme.cardIdle
            }`}
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
        className={`rounded-[24px] border-2 p-4 space-y-4 ${theme.cardActive}`}
      >
        <div className="flex items-center gap-2">
          <span className={`text-[12px] font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r ${theme.gradient} text-white`}>
            {mode === 'variable' ? theme.variableLabel : theme.fixedLabel}
          </span>
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
              key={`fix-${txType}`}
              householdId={householdId}
              baseCurrency={baseCurrency}
              categories={categories}
              defaultType={txType}
              hideTypeSelector
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
