'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plane } from 'lucide-react'
import { createTrip } from '@/lib/travel/actions'
import type { CreateBudgetItemInput, TripBudgetCategory } from '@/lib/travel/types'
import { BUDGET_CATEGORY_LABELS } from '@/lib/travel/prep-templates'

type WizardBudgetItem = {
  category: TripBudgetCategory
  name: string
  quantity: number
  unitAmount: number
}

export function TripCreateWizard({
  householdId,
  currency,
}: {
  householdId: string
  currency: string
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [destinationCountry, setDestinationCountry] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [travelersCount, setTravelersCount] = useState(2)
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionFrequency, setContributionFrequency] = useState<'weekly' | 'monthly'>('monthly')
  const [budgetItems, setBudgetItems] = useState<WizardBudgetItem[]>([
    { category: 'flights', name: 'Vuelos', quantity: 2, unitAmount: 0 },
    { category: 'hotels', name: 'Hotel', quantity: 1, unitAmount: 0 },
  ])

  function updateBudgetItem(index: number, patch: Partial<WizardBudgetItem>) {
    setBudgetItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  function handleSubmit() {
    setError(null)
    const initialBudgetItems: CreateBudgetItemInput[] = budgetItems
      .filter(item => item.unitAmount > 0)
      .map(item => ({
        tripId: '',
        householdId,
        category: item.category,
        name: item.name,
        quantity: item.quantity,
        unitAmount: item.unitAmount,
        currency,
      }))

    startTransition(async () => {
      const result = await createTrip({
        householdId,
        name,
        destination,
        destinationCountry: destinationCountry || undefined,
        startDate,
        endDate,
        travelersCount,
        contributionAmount: contributionAmount
          ? parseFloat(contributionAmount)
          : undefined,
        contributionFrequency: contributionAmount ? contributionFrequency : undefined,
        initialBudgetItems:
          initialBudgetItems.length > 0 ? initialBudgetItems : undefined,
      })

      if (result.error) {
        setError(result.error)
        return
      }
      if (result.id) router.push(`/viajes/${result.id}`)
    })
  }

  const inputClass =
    'w-full rounded-xl border border-[#E8E8E8] dark:border-[var(--cc-border)] bg-white dark:bg-[var(--cc-surface-muted)] px-3 py-2.5 text-[14px] text-cc-primary'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-cc-primary flex items-center gap-2">
          <Plane className="w-5 h-5 text-[#0EA5E9]" />
          Nuevo viaje
        </h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">
          Paso {step + 1} de 3
        </p>
      </div>

      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-[#0EA5E9]' : 'bg-[#E2E8F0]'}`}
          />
        ))}
      </div>

      {step === 0 && (
        <div className="cc-surface rounded-[20px] p-4 space-y-3">
          <label className="block">
            <span className="text-[11px] font-bold text-cc-secondary">Nombre del viaje</span>
            <input
              className={inputClass + ' mt-1'}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Europa verano 2026"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-cc-secondary">Destino</span>
            <input
              className={inputClass + ' mt-1'}
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="Ej: Roma, Italia"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-cc-secondary">País (opcional)</span>
            <input
              className={inputClass + ' mt-1'}
              value={destinationCountry}
              onChange={e => setDestinationCountry(e.target.value)}
              placeholder="Italia"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-bold text-cc-secondary">Inicio</span>
              <input
                type="date"
                className={inputClass + ' mt-1'}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-cc-secondary">Fin</span>
              <input
                type="date"
                className={inputClass + ' mt-1'}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[11px] font-bold text-cc-secondary">Viajeros</span>
            <input
              type="number"
              min={1}
              className={inputClass + ' mt-1'}
              value={travelersCount}
              onChange={e => setTravelersCount(parseInt(e.target.value, 10) || 1)}
            />
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="cc-surface rounded-[20px] p-4 space-y-4">
          <p className="text-[12px] text-cc-secondary">
            Ingresa precios manualmente. Puedes añadir más ítems después.
          </p>
          {budgetItems.map((item, index) => (
            <div key={index} className="rounded-xl bg-[#F8FAFC] dark:bg-[var(--cc-surface-muted)] p-3 space-y-2">
              <p className="text-[11px] font-bold text-[#0EA5E9]">
                {BUDGET_CATEGORY_LABELS[item.category]}
              </p>
              <input
                className={inputClass}
                value={item.name}
                onChange={e => updateBudgetItem(index, { name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] text-cc-muted">Cantidad</span>
                  <input
                    type="number"
                    min={1}
                    className={inputClass + ' mt-0.5'}
                    value={item.quantity}
                    onChange={e =>
                      updateBudgetItem(index, {
                        quantity: parseFloat(e.target.value) || 1,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] text-cc-muted">Precio unit. ({currency})</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputClass + ' mt-0.5'}
                    value={item.unitAmount || ''}
                    onChange={e =>
                      updateBudgetItem(index, {
                        unitAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="cc-surface rounded-[20px] p-4 space-y-3">
          <p className="text-[12px] text-cc-secondary">
            Se creará una meta de ahorro vinculada en Finanzas.
          </p>
          <label className="block">
            <span className="text-[11px] font-bold text-cc-secondary">
              Aporte periódico (opcional)
            </span>
            <input
              type="number"
              min={0}
              className={inputClass + ' mt-1'}
              value={contributionAmount}
              onChange={e => setContributionAmount(e.target.value)}
              placeholder={`Monto en ${currency}`}
            />
          </label>
          {contributionAmount && (
            <label className="block">
              <span className="text-[11px] font-bold text-cc-secondary">Frecuencia</span>
              <select
                className={inputClass + ' mt-1'}
                value={contributionFrequency}
                onChange={e =>
                  setContributionFrequency(e.target.value as 'weekly' | 'monthly')
                }
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </label>
          )}
          <div className="rounded-xl bg-[#E0F2FE] p-3 text-[12px] text-[#0369A1]">
            Incluye checklist de preparación con fechas sugeridas (visas, reservas, maletas…).
          </div>
        </div>
      )}

      {error && (
        <p className="text-[12px] text-red-500 font-medium">{error}</p>
      )}

      <div className="flex gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 rounded-xl border border-[#E8E8E8] text-[14px] font-bold text-cc-primary"
            disabled={pending}
          >
            Atrás
          </button>
        )}
        {step < 2 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            className="flex-1 py-3 rounded-xl bg-[#0EA5E9] text-white text-[14px] font-bold"
            disabled={!name || !destination || !startDate || !endDate}
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="flex-1 py-3 rounded-xl bg-[#0EA5E9] text-white text-[14px] font-bold flex items-center justify-center gap-2"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear viaje
          </button>
        )}
      </div>
    </div>
  )
}
