'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarClock,
  Loader2,
  Pencil,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { EditFixedScheduleSheet } from '@/components/transactions/edit-fixed-schedule-sheet'
import { PaymentModeBadge } from '@/components/transactions/payment-mode-selector'
import { deactivateRecurringSchedule } from '@/lib/finance/actions'
import { formatFrequency, formatMoney, formatShortDate, getPeriodLabels } from '@/lib/finance/format'
import type { Category, Period, RecurringScheduleItem } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

function ScheduleList({
  title,
  items,
  currency,
  householdId,
  categories,
  onRemoved,
  onEdit,
}: {
  title: string
  items: RecurringScheduleItem[]
  currency: CurrencyCode
  householdId: string
  categories: Category[]
  onRemoved: (id: string) => void
  onEdit: (item: RecurringScheduleItem) => void
}) {
  const fmt = (n: number) => formatMoney(n, currency)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleRemove(id: string) {
    setRemovingId(id)
    const result = await deactivateRecurringSchedule(householdId, id)
    if (!result.error) onRemoved(id)
    setRemovingId(null)
  }

  if (items.length === 0) {
    return (
      <section className="cc-surface rounded-[24px] p-5">
        <h2 className="text-[14px] font-bold text-cc-primary mb-2">{title}</h2>
        <p className="text-[12px] text-cc-secondary">Ninguno configurado.</p>
      </section>
    )
  }

  return (
    <section className="cc-surface rounded-[24px] p-5 space-y-3">
      <h2 className="text-[14px] font-bold text-cc-primary">{title}</h2>
      <ul className="space-y-2">
        {items.map(item => (
          <li
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-2xl cc-surface-muted"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${item.categoryColor ?? '#00BFA5'}22`,
                color: item.categoryColor ?? '#00BFA5',
              }}
            >
              <CategoryIcon icon={item.categoryIcon} className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-cc-primary truncate flex items-center gap-1.5 flex-wrap">
                {item.description}
                <PaymentModeBadge autoRegister={item.autoRegister} />
              </p>
              <p className="text-[11px] text-cc-secondary">
                {item.categoryName} · {fmt(item.amount)} ·{' '}
                {formatFrequency(item.frequency)}
              </p>
              <p className="text-[10px] text-cc-muted flex items-center gap-1 mt-0.5">
                <CalendarClock className="w-3 h-3" />
                Próxima: {formatShortDate(item.nextBillingDate)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-cc-muted hover:text-[#00BFA5] hover:bg-[#E0F2F1] dark:hover:bg-[#00BFA5]/10"
                aria-label="Editar programación"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={removingId === item.id}
                onClick={() => handleRemove(item.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-cc-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                aria-label="Eliminar programación"
              >
                {removingId === item.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function FijosClient({
  schedules: initialSchedules,
  householdId,
  currency,
  period,
  categories,
}: {
  schedules: RecurringScheduleItem[]
  householdId: string
  currency: CurrencyCode
  period: Period
  categories: Category[]
}) {
  const router = useRouter()
  const labels = getPeriodLabels(period)
  const [schedules, setSchedules] = useState(initialSchedules)
  const [editingItem, setEditingItem] = useState<RecurringScheduleItem | null>(null)

  const incomes = schedules.filter(s => s.type === 'income')
  const expenses = schedules.filter(s => s.type === 'expense')

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Link
          href="/predicciones"
          className="w-9 h-9 rounded-xl cc-surface-muted flex items-center justify-center text-cc-secondary shrink-0 mt-0.5"
          aria-label="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-bold text-cc-primary flex items-center gap-2">
            <Repeat className="w-5 h-5 text-[#00BFA5]" />
            Ingresos y gastos fijos
          </h1>
          <p className="text-[12px] text-cc-secondary mt-0.5">
            Programaciones activas · se cuentan {labels.ofPeriod} en el dashboard
          </p>
        </div>
      </div>

      <Link
        href="/nuevo"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#00BFA5] text-white text-[13px] font-bold"
      >
        <Plus className="w-4 h-4" />
        Añadir ingreso o gasto fijo
      </Link>

      {schedules.length === 0 ? (
        <section className="cc-surface rounded-[24px] p-6 text-center">
          <p className="text-[13px] text-cc-secondary">
            Aún no tienes movimientos fijos. Usa el botón de arriba o el asistente
            para añadir salario, arriendo o suscripciones.
          </p>
        </section>
      ) : (
        <>
          <ScheduleList
            title="Ingresos fijos"
            items={incomes}
            currency={currency}
            householdId={householdId}
            categories={categories}
            onEdit={setEditingItem}
            onRemoved={id => {
              setSchedules(prev => prev.filter(s => s.id !== id))
              router.refresh()
            }}
          />
          <ScheduleList
            title="Gastos fijos"
            items={expenses}
            currency={currency}
            householdId={householdId}
            categories={categories}
            onEdit={setEditingItem}
            onRemoved={id => {
              setSchedules(prev => prev.filter(s => s.id !== id))
              router.refresh()
            }}
          />
        </>
      )}

      {editingItem && (
        <EditFixedScheduleSheet
          item={editingItem}
          categories={categories}
          householdId={householdId}
          currency={currency}
          onClose={() => setEditingItem(null)}
          onUpdated={updated => {
            setSchedules(prev =>
              prev.map(s => (s.id === updated.id ? updated : s))
            )
          }}
        />
      )}
    </div>
  )
}
