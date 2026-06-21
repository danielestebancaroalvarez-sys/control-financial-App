import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { getHouseholdMembers } from '@/lib/household/queries'
import {
  mapTrip,
  mapTripSummary,
  TRIP_DETAIL_SELECT,
} from './dashboard'
import { fetchSavingsForTrip } from './savings-bridge'
import type { TravelDashboardSummary, Trip, TripSummary } from './types'

const ACTIVE_STATUSES = ['planning', 'saving', 'booked', 'in_progress']

export const getTrips = cache(async (householdId: string): Promise<TripSummary[]> => {
  const supabase = await createClient()
  const members = await getHouseholdMembers(householdId)
  const memberRows = members.map(m => ({
    user_id: m.user_id,
    full_name: m.full_name,
  }))

  const { data } = await supabase
    .from('trips')
    .select(TRIP_DETAIL_SELECT)
    .eq('household_id', householdId)
    .neq('status', 'cancelled')
    .order('start_date', { ascending: true })

  const goalIds = (data ?? [])
    .map(row => row.savings_goal_id as string | null)
    .filter((id): id is string => !!id)

  let savingsMap = new Map<string, Awaited<ReturnType<typeof fetchSavingsForTrip>>>()
  if (goalIds.length > 0) {
    const { data: goals } = await supabase
      .from('savings_goals')
      .select(
        'id, name, target_amount, current_amount, target_date, contribution_amount, contribution_frequency, savings_mode, annual_interest_rate'
      )
      .in('id', goalIds)
    for (const g of goals ?? []) {
      savingsMap.set(g.id, g)
    }
  }

  return (data ?? []).map(row => {
    const savings = row.savings_goal_id
      ? savingsMap.get(row.savings_goal_id as string)
      : null
    return mapTripSummary(mapTrip(row, memberRows, savings))
  })
})

export async function getTravelDashboard(
  householdId: string
): Promise<TravelDashboardSummary> {
  const trips = await getTrips(householdId)
  const activeTrips = trips.filter(t => ACTIVE_STATUSES.includes(t.status))
  const upcomingTrips = activeTrips.filter(
    t => t.daysUntilStart != null && t.daysUntilStart >= 0
  )

  const supabase = await createClient()
  const { count } = await supabase
    .from('trip_prep_steps')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('is_completed', false)

  return {
    activeTrips,
    totalBudgetAllTrips: activeTrips.reduce((s, t) => s + t.totalEstimated, 0),
    pendingPrepSteps: count ?? 0,
    upcomingTrips,
  }
}

export async function getTrip(
  householdId: string,
  tripId: string
): Promise<Trip | null> {
  const supabase = await createClient()
  const members = await getHouseholdMembers(householdId)
  const memberRows = members.map(m => ({
    user_id: m.user_id,
    full_name: m.full_name,
  }))

  const { data } = await supabase
    .from('trips')
    .select(TRIP_DETAIL_SELECT)
    .eq('household_id', householdId)
    .eq('id', tripId)
    .maybeSingle()

  if (!data) return null

  const savings = await fetchSavingsForTrip(data.savings_goal_id)
  return mapTrip(data, memberRows, savings)
}

export async function searchTrips(
  householdId: string,
  query: string
): Promise<TripSummary[]> {
  const trips = await getTrips(householdId)
  const q = query.trim().toLowerCase()
  if (!q) return trips
  return trips.filter(
    t =>
      t.name.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q)
  )
}

export async function getAllPrepSteps(householdId: string) {
  const supabase = await createClient()
  const members = await getHouseholdMembers(householdId)
  const memberRows = members.map(m => ({
    user_id: m.user_id,
    full_name: m.full_name,
  }))

  const { data } = await supabase
    .from('trip_prep_steps')
    .select(
      `id, trip_id, title, description, step_type, step_order, category, due_date,
      estimated_cost, is_completed, completed_at, assigned_to, household_task_id,
      trips ( id, name, destination, start_date )`
    )
    .eq('household_id', householdId)
    .eq('is_completed', false)
    .order('due_date', { ascending: true, nullsFirst: false })

  return (data ?? []).map(row => {
    const tripData = row.trips
    const trip =
      tripData && !Array.isArray(tripData)
        ? (tripData as { id: string; name: string; destination: string; start_date: string })
        : null
    return {
      ...row,
      trip,
      assigneeName: memberRows.find(m => m.user_id === row.assigned_to)?.full_name ?? null,
    }
  })
}

export async function getBudgetOverview(householdId: string) {
  const trips = await getTrips(householdId)
  const active = trips.filter(t => ACTIVE_STATUSES.includes(t.status))
  return active
}
