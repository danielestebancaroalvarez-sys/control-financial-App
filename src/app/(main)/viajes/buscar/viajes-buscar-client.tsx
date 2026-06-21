'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { TripCard } from '@/components/travel/trip-card'
import type { TripSummary } from '@/lib/travel/types'
import type { CurrencyCode } from '@/lib/household/types'

export function ViajesBuscarClient({
  trips,
  currency,
}: {
  trips: TripSummary[]
  currency: CurrencyCode
}) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return trips
    return trips.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q)
    )
  }, [query, trips])

  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-bold text-cc-primary">Buscar viajes</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cc-muted" />
        <input
          className="w-full rounded-xl border border-[#E8E8E8] pl-10 pr-3 py-2.5 text-[14px] bg-white dark:bg-[var(--cc-surface-muted)]"
          placeholder="Destino o nombre del viaje"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      {results.length === 0 && (
        <p className="text-[13px] text-cc-secondary text-center py-8">Sin resultados</p>
      )}
      <div className="space-y-3">
        {results.map(trip => (
          <TripCard key={trip.id} trip={trip} currency={currency} />
        ))}
      </div>
    </div>
  )
}
