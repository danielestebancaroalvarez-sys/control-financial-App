'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  createBudgetItem,
  deleteBudgetItem,
  generateItineraryDays,
  togglePrepStep,
  upsertDailyEstimate,
} from '@/lib/travel/actions'
import { groupBudgetByCategory } from '@/lib/travel/budget'
import { formatMoney, formatShortDate } from '@/lib/travel/format'
import {
  BUDGET_CATEGORY_LABELS,
  DAILY_CATEGORY_LABELS,
  TRIP_STATUS_LABELS,
} from '@/lib/travel/prep-templates'
import type { Trip, TripBudgetCategory, TripDailyCategory } from '@/lib/travel/types'
import type { CurrencyCode } from '@/lib/household/types'

const TABS = [
  { id: 'summary', label: 'Resumen' },
  { id: 'budget', label: 'Presupuesto' },
  { id: 'prep', label: 'Preparación' },
  { id: 'itinerary', label: 'Itinerario' },
] as const

type TabId = (typeof TABS)[number]['id']

export function TripDetailClient({
  trip,
  currency,
  householdId,
  initialTab = 'summary',
}: {
  trip: Trip
  currency: CurrencyCode
  householdId: string
  initialTab?: TabId
}) {
  const [tab, setTab] = useState<TabId>(initialTab)
  const [pending, startTransition] = useTransition()
  const [stepLoadingId, setStepLoadingId] = useState<string | null>(null)
  const [newItemCategory, setNewItemCategory] = useState<TripBudgetCategory>('activities')
  const [newItemName, setNewItemName] = useState('')
  const [newItemQty, setNewItemQty] = useState(1)
  const [newItemPrice, setNewItemPrice] = useState('')

  const groups = groupBudgetByCategory(trip.budgetItems)
  const milestones = trip.prepSteps.filter(s => s.stepType === 'milestone')
  const actions = trip.prepSteps.filter(s => s.stepType === 'action')

  function handleToggleStep(stepId: string, completed: boolean) {
    setStepLoadingId(stepId)
    startTransition(async () => {
      await togglePrepStep(householdId, trip.id, stepId, completed)
      setStepLoadingId(null)
    })
  }

  function handleAddBudgetItem() {
    if (!newItemName.trim() || !newItemPrice) return
    startTransition(async () => {
      await createBudgetItem({
        tripId: trip.id,
        householdId,
        category: newItemCategory,
        name: newItemName,
        quantity: newItemQty,
        unitAmount: parseFloat(newItemPrice),
        currency,
      })
      setNewItemName('')
      setNewItemPrice('')
    })
  }

  function handleDailyEstimate(
    category: TripDailyCategory,
    amountPerDay: number,
    daysCount: number
  ) {
    startTransition(async () => {
      await upsertDailyEstimate({
        tripId: trip.id,
        householdId,
        category,
        amountPerDay,
        daysCount,
      })
    })
  }

  function handleGenerateItinerary() {
    startTransition(async () => {
      await generateItineraryDays(householdId, trip.id)
    })
  }

  const inputClass =
    'w-full rounded-xl border border-[#E8E8E8] px-3 py-2 text-[13px] text-cc-primary bg-white dark:bg-[var(--cc-surface-muted)]'

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/viajes"
          className="text-[12px] text-[#0EA5E9] font-semibold flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </Link>
        <h1 className="text-[22px] font-bold text-cc-primary">{trip.name}</h1>
        <p className="text-[12px] text-cc-secondary flex items-center gap-1 mt-0.5">
          <MapPin className="w-3.5 h-3.5 text-[#0EA5E9]" />
          {trip.destination}
          {trip.destinationCountry && ` · ${trip.destinationCountry}`}
        </p>
        <p className="text-[11px] text-cc-muted mt-1">
          {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)} ·{' '}
          {trip.travelersCount} viajeros · {TRIP_STATUS_LABELS[trip.status]}
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
              tab === t.id
                ? 'bg-[#0EA5E9] text-white'
                : 'bg-[#F1F5F9] text-cc-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="space-y-3">
          <div className="cc-surface rounded-[20px] p-4">
            <p className="text-[10px] font-bold text-cc-muted uppercase">Presupuesto total</p>
            <p className="text-[28px] font-bold text-[#0EA5E9]">
              {formatMoney(trip.totalEstimated, currency)}
            </p>
            <p className="text-[12px] text-cc-secondary">
              {formatMoney(trip.totalPerPerson, currency)} por persona
            </p>
          </div>

          {trip.savings && (
            <div className="cc-surface rounded-[20px] p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-cc-muted uppercase">Meta de ahorro</p>
                  <p className="text-[14px] font-bold text-cc-primary mt-0.5">
                    {trip.savings.goalName}
                  </p>
                </div>
                {trip.savingsGoalId && (
                  <Link
                    href="/ahorros"
                    className="text-[11px] font-bold text-[#00BFA5]"
                  >
                    Ver en Finanzas →
                  </Link>
                )}
              </div>
              <div className="mt-3 h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                <div
                  className="h-full bg-[#0EA5E9] rounded-full transition-all"
                  style={{ width: `${trip.savings.percent}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[11px]">
                <span className="text-cc-secondary">
                  {formatMoney(trip.savings.currentAmount, currency)} de{' '}
                  {formatMoney(trip.savings.targetAmount, currency)}
                </span>
                <span className="font-bold text-cc-primary">{trip.savings.percent}%</span>
              </div>
              <p className="text-[11px] text-cc-secondary mt-2">
                Faltan {formatMoney(trip.savings.remaining, currency)} ·{' '}
                {trip.savings.estimatedTimeLabel}
              </p>
            </div>
          )}

          <div className="cc-surface rounded-[20px] p-4">
            <p className="text-[12px] font-bold text-cc-primary mb-2">Desglose</p>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-cc-secondary">Ítems fijos</span>
                <span className="font-semibold">
                  {formatMoney(
                    trip.budgetItems.reduce((s, i) => s + i.amountTotal, 0),
                    currency
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cc-secondary">Gastos diarios estimados</span>
                <span className="font-semibold">
                  {formatMoney(
                    trip.dailyEstimates.reduce(
                      (s, e) => s + e.amountPerDay * e.daysCount,
                      0
                    ),
                    currency
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cc-secondary">Actividades en itinerario</span>
                <span className="font-semibold">
                  {formatMoney(
                    trip.itineraryDays.reduce(
                      (s, d) =>
                        s + d.activities.reduce((a, act) => a + (act.estimatedCost ?? 0), 0),
                      0
                    ),
                    currency
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'budget' && (
        <div className="space-y-3">
          {groups.map(group => (
            <div key={group.category} className="cc-surface rounded-[20px] p-4">
              <div className="flex justify-between mb-2">
                <p className="text-[12px] font-bold text-cc-primary">
                  {BUDGET_CATEGORY_LABELS[group.category]}
                </p>
                <p className="text-[12px] font-bold text-[#0EA5E9]">
                  {formatMoney(group.total, currency)}
                </p>
              </div>
              <ul className="space-y-2">
                {group.items.map(item => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-2 text-[12px] py-2 border-b border-[#F5F5F5] last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-cc-primary">{item.name}</p>
                      <p className="text-cc-muted text-[10px]">
                        {item.quantity} × {formatMoney(item.unitAmount, currency)}
                        {item.isBooked && ' · Reservado'}
                      </p>
                      {item.bookingUrl && (
                        <a
                          href={item.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#0EA5E9] flex items-center gap-0.5 mt-0.5"
                        >
                          Enlace <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold">
                        {formatMoney(item.amountTotal, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            await deleteBudgetItem(householdId, item.id, trip.id)
                          })
                        }
                        className="text-cc-muted hover:text-red-500"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="cc-surface rounded-[20px] p-4 space-y-2">
            <p className="text-[12px] font-bold text-cc-primary">Añadir ítem</p>
            <select
              className={inputClass}
              value={newItemCategory}
              onChange={e => setNewItemCategory(e.target.value as TripBudgetCategory)}
            >
              {Object.entries(BUDGET_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              placeholder="Nombre"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1}
                className={inputClass}
                placeholder="Cantidad"
                value={newItemQty}
                onChange={e => setNewItemQty(parseFloat(e.target.value) || 1)}
              />
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                placeholder={`Precio (${currency})`}
                value={newItemPrice}
                onChange={e => setNewItemPrice(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleAddBudgetItem}
              disabled={pending}
              className="w-full py-2.5 rounded-xl bg-[#0EA5E9] text-white text-[13px] font-bold flex items-center justify-center gap-1"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Añadir
            </button>
          </div>

          <div className="cc-surface rounded-[20px] p-4 space-y-3">
            <p className="text-[12px] font-bold text-cc-primary">Gastos diarios estimados</p>
            {(['food', 'local_transport', 'activities', 'misc'] as TripDailyCategory[]).map(
              cat => {
                const existing = trip.dailyEstimates.find(e => e.category === cat)
                return (
                  <DailyEstimateRow
                    key={cat}
                    label={DAILY_CATEGORY_LABELS[cat]}
                    amountPerDay={existing?.amountPerDay ?? 0}
                    daysCount={existing?.daysCount ?? trip.daysCount}
                    currency={currency}
                    onSave={(amount, days) => handleDailyEstimate(cat, amount, days)}
                  />
                )
              }
            )}
          </div>
        </div>
      )}

      {tab === 'prep' && (
        <div className="space-y-3">
          {milestones.length > 0 && (
            <div className="relative pl-6">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[#BAE6FD]" />
              <ul className="space-y-3">
                {milestones.map(step => (
                  <PrepStepRow
                    key={step.id}
                    step={step}
                    loading={stepLoadingId === step.id}
                    onToggle={handleToggleStep}
                  />
                ))}
              </ul>
            </div>
          )}
          {actions.length > 0 && (
            <div className="cc-surface rounded-[20px] p-3">
              <p className="text-[11px] font-bold text-cc-secondary mb-2">Acciones</p>
              <ul className="space-y-2">
                {actions.map(step => (
                  <PrepStepRow
                    key={step.id}
                    step={step}
                    loading={stepLoadingId === step.id}
                    onToggle={handleToggleStep}
                    compact
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'itinerary' && (
        <div className="space-y-3">
          {trip.itineraryDays.length === 0 ? (
            <div className="cc-surface rounded-[20px] p-6 text-center">
              <p className="text-[13px] text-cc-secondary mb-3">
                Genera los días del viaje automáticamente según las fechas.
              </p>
              <button
                type="button"
                onClick={handleGenerateItinerary}
                disabled={pending}
                className="px-4 py-2.5 rounded-xl bg-[#0EA5E9] text-white text-[13px] font-bold"
              >
                Generar itinerario
              </button>
            </div>
          ) : (
            trip.itineraryDays.map(day => (
              <div key={day.id} className="cc-surface rounded-[20px] p-4">
                <p className="text-[12px] font-bold text-[#0EA5E9]">
                  Día {day.dayNumber} · {formatShortDate(day.dayDate)}
                </p>
                {day.title && (
                  <p className="text-[13px] font-semibold text-cc-primary mt-0.5">{day.title}</p>
                )}
                {day.activities.length === 0 ? (
                  <p className="text-[11px] text-cc-muted mt-2">Sin actividades aún</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {day.activities.map(act => (
                      <li key={act.id} className="text-[12px] flex justify-between">
                        <span className="text-cc-primary">{act.title}</span>
                        {act.estimatedCost != null && (
                          <span className="font-semibold">
                            {formatMoney(act.estimatedCost, currency)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function PrepStepRow({
  step,
  loading,
  onToggle,
  compact = false,
}: {
  step: Trip['prepSteps'][number]
  loading: boolean
  onToggle: (id: string, done: boolean) => void
  compact?: boolean
}) {
  return (
    <li
      className={`flex items-start gap-3 ${compact ? '' : 'relative'}`}
    >
      <button
        type="button"
        disabled={loading}
        onClick={() => onToggle(step.id, !step.isCompleted)}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          step.isCompleted
            ? 'bg-[#0EA5E9] border-[#0EA5E9] text-white'
            : 'border-[#CBD5E1] bg-white'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : step.isCompleted ? (
          <Check className="w-3.5 h-3.5" />
        ) : null}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] font-semibold ${
            step.isCompleted ? 'text-cc-muted line-through' : 'text-cc-primary'
          }`}
        >
          {step.title}
        </p>
        {step.dueDate && (
          <p className="text-[10px] text-cc-secondary">{formatShortDate(step.dueDate)}</p>
        )}
      </div>
    </li>
  )
}

function DailyEstimateRow({
  label,
  amountPerDay,
  daysCount,
  currency,
  onSave,
}: {
  label: string
  amountPerDay: number
  daysCount: number
  currency: CurrencyCode
  onSave: (amount: number, days: number) => void
}) {
  const [amount, setAmount] = useState(String(amountPerDay || ''))
  const [days, setDays] = useState(daysCount)

  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="flex-1 text-cc-secondary min-w-0">{label}</span>
      <input
        type="number"
        min={0}
        className="w-20 rounded-lg border px-2 py-1 text-right"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        onBlur={() => onSave(parseFloat(amount) || 0, days)}
      />
      <span className="text-cc-muted">×</span>
      <input
        type="number"
        min={1}
        className="w-14 rounded-lg border px-2 py-1 text-right"
        value={days}
        onChange={e => {
          const d = parseInt(e.target.value, 10) || 1
          setDays(d)
          onSave(parseFloat(amount) || 0, d)
        }}
      />
      <span className="text-cc-muted w-16 text-right text-[10px]">
        {formatMoney((parseFloat(amount) || 0) * days, currency)}
      </span>
    </div>
  )
}
