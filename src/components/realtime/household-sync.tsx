'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function HouseholdSync({ householdId }: { householdId: string }) {
  const router = useRouter()
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const refresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      refreshTimer.current = setTimeout(() => {
        router.refresh()
      }, 800)
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_tasks',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_blocks',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'productivity_goals',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_steps',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_budget_items',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_prep_steps',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_members',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_shopping_checks',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .subscribe()

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      supabase.removeChannel(channel)
    }
  }, [householdId, router])

  return null
}
