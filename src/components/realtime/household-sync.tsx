'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type SyncStatus = 'connecting' | 'live' | 'offline'

export function HouseholdSync({ householdId }: { householdId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<SyncStatus>('connecting')
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const refresh = () => {
      setLastSync(new Date())
      router.refresh()
    }

    const channel = supabase
      .channel(`household:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'savings_goals',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recurring_schedules',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .subscribe(subscriptionStatus => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          setStatus('live')
        } else if (
          subscriptionStatus === 'CLOSED' ||
          subscriptionStatus === 'CHANNEL_ERROR'
        ) {
          setStatus('offline')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, router])

  if (status === 'connecting') return null

  return (
    <div
      className="fixed top-[max(0.5rem,env(safe-area-inset-top))] right-4 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-sm"
      title={
        lastSync
          ? `Última sync: ${lastSync.toLocaleTimeString('es')}`
          : 'Sincronización en tiempo real'
      }
    >
      <span
        className={`w-2 h-2 rounded-full ${
          status === 'live'
            ? 'bg-[#00BFA5] animate-pulse'
            : 'bg-[#B2BEC3]'
        }`}
      />
      <span className="text-[10px] font-semibold text-[#636E72]">
        {status === 'live' ? 'En vivo' : 'Sin sync'}
      </span>
    </div>
  )
}
