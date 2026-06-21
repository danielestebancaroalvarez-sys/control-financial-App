'use client'

import { useTransition } from 'react'
import { Loader2, Plane } from 'lucide-react'
import { completeTravelSetup } from '@/lib/setup/travel-actions'

export function TravelSetupWizard({
  householdName,
  currency,
}: {
  householdName: string
  currency: string
}) {
  const [pending, startTransition] = useTransition()

  function handleComplete() {
    startTransition(async () => {
      await completeTravelSetup()
    })
  }

  return (
    <div className="min-h-[70vh] flex flex-col justify-center space-y-6 px-1">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E0F2FE] flex items-center justify-center mx-auto mb-4">
          <Plane className="w-8 h-8 text-[#0EA5E9]" />
        </div>
        <h1 className="text-[24px] font-bold text-cc-primary">Bienvenido a Viajes</h1>
        <p className="text-[14px] text-cc-secondary mt-2 max-w-sm mx-auto">
          Planifica presupuestos, metas de ahorro e itinerarios para {householdName}.
        </p>
      </div>

      <div className="cc-surface rounded-[24px] p-5 space-y-3 text-[13px] text-cc-secondary">
        <p className="font-bold text-cc-primary">Qué puedes hacer:</p>
        <ul className="space-y-2 list-disc pl-4">
          <li>Crear viajes con presupuesto detallado (vuelos, hoteles, etc.)</li>
          <li>Ver cuánto toca a cada persona</li>
          <li>Vincular una meta de ahorro en Finanzas</li>
          <li>Seguir pasos de preparación con fechas</li>
          <li>Planificar gastos diarios e itinerario</li>
        </ul>
        <p className="text-[12px] pt-2 border-t border-[#F0F0F0]">
          Moneda de presupuesto: <strong>{currency}</strong>
        </p>
      </div>

      <button
        type="button"
        onClick={handleComplete}
        disabled={pending}
        className="w-full py-3.5 rounded-2xl bg-[#0EA5E9] text-white text-[15px] font-bold flex items-center justify-center gap-2"
      >
        {pending && <Loader2 className="w-5 h-5 animate-spin" />}
        Empezar a planificar
      </button>
    </div>
  )
}
