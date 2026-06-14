'use client'

import { useState } from 'react'
import { CalendarPlus, Repeat } from 'lucide-react'
import { AddTransactionForm } from '@/components/transactions/add-transaction-form'
import { FixedScheduleForm } from '@/components/transactions/fixed-schedule-form'
import type { Category } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

type NuevoTab = 'registro' | 'fijos'

export function NuevoClient({
  householdId,
  baseCurrency,
  categories,
  authorName,
}: {
  householdId: string
  baseCurrency: CurrencyCode
  categories: Category[]
  authorName: string
}) {
  const [tab, setTab] = useState<NuevoTab>('registro')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-cc-primary">Nuevo registro</h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">
          {tab === 'registro'
            ? 'Ingreso o gasto que ya ocurrió hoy o antes.'
            : 'Programa ingresos o gastos que se repiten solos.'}
        </p>
      </div>

      <div className="flex rounded-2xl cc-surface-muted p-1">
        <button
          type="button"
          onClick={() => setTab('registro')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
            tab === 'registro'
              ? 'bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF] text-white shadow-sm'
              : 'text-cc-secondary'
          }`}
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Registro
        </button>
        <button
          type="button"
          onClick={() => setTab('fijos')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
            tab === 'fijos'
              ? 'bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF] text-white shadow-sm'
              : 'text-cc-secondary'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          Fijos
        </button>
      </div>

      {tab === 'registro' ? (
        <AddTransactionForm
          householdId={householdId}
          baseCurrency={baseCurrency}
          categories={categories}
          authorName={authorName}
        />
      ) : (
        <FixedScheduleForm
          householdId={householdId}
          baseCurrency={baseCurrency}
          categories={categories}
        />
      )}
    </div>
  )
}
