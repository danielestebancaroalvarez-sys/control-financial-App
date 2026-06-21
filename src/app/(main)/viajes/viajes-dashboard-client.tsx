'use client'

import Link from 'next/link'
import { ClipboardList, Plane, Wallet } from 'lucide-react'
import { EmptyTripsState, TripCard } from '@/components/travel/trip-card'
import { formatMoney } from '@/lib/travel/format'
import type { TravelDashboardSummary } from '@/lib/travel/types'
import type { CurrencyCode } from '@/lib/household/types'

export function ViajesDashboardClient({
  summary,
  householdName,
  currency,
}: {
  summary: TravelDashboardSummary
  householdName: string
  currency: CurrencyCode
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-cc-primary flex items-center gap-2">
          <Plane className="w-5 h-5 text-[#0EA5E9]" />
          Tus viajes
        </h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">{householdName}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="cc-surface rounded-[20px] p-3.5">
          <p className="text-[10px] font-bold text-cc-secondary uppercase flex items-center gap-1">
            <Wallet className="w-3 h-3 text-[#0EA5E9]" />
            Presupuesto activo
          </p>
          <p className="text-[20px] font-bold text-[#0EA5E9] mt-0.5">
            {formatMoney(summary.totalBudgetAllTrips, currency)}
          </p>
        </div>
        <div className="cc-surface rounded-[20px] p-3.5">
          <p className="text-[10px] font-bold text-cc-secondary uppercase flex items-center gap-1">
            <ClipboardList className="w-3 h-3 text-[#0EA5E9]" />
            Pasos pendientes
          </p>
          <p className="text-[20px] font-bold text-cc-primary mt-0.5">
            {summary.pendingPrepSteps}
          </p>
        </div>
      </div>

      {summary.activeTrips.length === 0 ? (
        <EmptyTripsState />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-cc-primary">Viajes activos</p>
            <Link href="/viajes/nuevo" className="text-[12px] font-bold text-[#0EA5E9]">
              + Nuevo
            </Link>
          </div>
          {summary.activeTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} currency={currency} />
          ))}
        </div>
      )}
    </div>
  )
}
