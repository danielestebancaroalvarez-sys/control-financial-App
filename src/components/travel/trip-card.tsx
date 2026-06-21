'use client'

import Link from 'next/link'
import { Calendar, MapPin, Plane, Users } from 'lucide-react'
import { formatMoney, formatShortDate } from '@/lib/travel/format'
import { TRIP_STATUS_LABELS } from '@/lib/travel/prep-templates'
import type { TripSummary } from '@/lib/travel/types'
import type { CurrencyCode } from '@/lib/household/types'

export function TripCard({
  trip,
  currency,
}: {
  trip: TripSummary
  currency: CurrencyCode
}) {
  return (
    <Link
      href={`/viajes/${trip.id}`}
      className="block cc-surface rounded-[20px] p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-cc-primary truncate">{trip.name}</p>
          <p className="text-[12px] text-cc-secondary flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#0EA5E9]" />
            {trip.destination}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] shrink-0">
          {TRIP_STATUS_LABELS[trip.status]}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-cc-secondary">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {trip.travelersCount}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] text-cc-muted uppercase font-bold">Presupuesto</p>
          <p className="text-[18px] font-bold text-[#0EA5E9]">
            {formatMoney(trip.totalEstimated, currency)}
          </p>
          <p className="text-[10px] text-cc-secondary">
            {formatMoney(trip.totalPerPerson, currency)} / persona
          </p>
        </div>
        {trip.savingsPercent > 0 && (
          <div className="text-right">
            <p className="text-[10px] text-cc-muted uppercase font-bold">Ahorro</p>
            <p className="text-[14px] font-bold text-cc-primary">{trip.savingsPercent}%</p>
          </div>
        )}
      </div>

      {trip.nextPrepStepTitle && (
        <p className="text-[10px] text-cc-secondary mt-2 pt-2 border-t border-[#F0F0F0]">
          Próximo: {trip.nextPrepStepTitle}
          {trip.nextPrepStepDate && ` · ${formatShortDate(trip.nextPrepStepDate)}`}
        </p>
      )}
    </Link>
  )
}

export function EmptyTripsState() {
  return (
    <div className="cc-surface rounded-[20px] p-8 text-center">
      <Plane className="w-10 h-10 text-[#0EA5E9] mx-auto mb-3" />
      <p className="text-[14px] font-bold text-cc-primary">Sin viajes planificados</p>
      <p className="text-[12px] text-cc-secondary mt-1">
        Crea tu primer viaje para presupuesto, ahorro e itinerario.
      </p>
      <Link
        href="/viajes/nuevo"
        className="inline-block mt-4 text-[13px] font-bold text-[#0EA5E9]"
      >
        Planificar viaje →
      </Link>
    </div>
  )
}
