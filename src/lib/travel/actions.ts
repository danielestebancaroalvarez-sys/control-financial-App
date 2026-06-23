'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createSavingsGoal } from '@/lib/finance/actions'
import { estimateContributionFromTargetDate } from '@/lib/finance/savings-plan'
import { calculateItemTotal, calculateTripTotal } from './budget'
import { buildDefaultPrepSteps } from './prep-templates'
import { syncTripSavingsTarget } from './savings-bridge'
import { resolveSplitAllocations } from './split'
import { getTrip } from './queries'
import type {
  CreateBudgetItemInput,
  CreateItineraryActivityInput,
  CreateItineraryDayInput,
  CreatePrepStepInput,
  CreateTripInput,
  TripDailyCategory,
  UpdateTripInput,
  UpsertDailyEstimateInput,
} from './types'

const TRAVEL_PATHS = [
  '/viajes',
  '/viajes/buscar',
  '/viajes/nuevo',
  '/viajes/presupuesto',
  '/viajes/preparacion',
  '/viajes/ajustes',
]

function revalidateTravel(tripId?: string) {
  for (const path of TRAVEL_PATHS) revalidatePath(path)
  if (tripId) revalidatePath(`/viajes/${tripId}`)
  revalidatePath('/ahorros')
  revalidatePath('/')
}

async function refreshTripSavingsTarget(
  householdId: string,
  tripId: string
): Promise<void> {
  const trip = await getTrip(householdId, tripId)
  if (!trip?.savingsGoalId) return
  const target = Math.max(1, trip.totalEstimated)
  await syncTripSavingsTarget(
    trip.savingsGoalId,
    target,
    trip.name,
    trip.startDate
  )
}

export async function createTrip(
  input: CreateTripInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }
  if (!input.name.trim()) return { error: 'El nombre del viaje es obligatorio.' }
  if (!input.destination.trim()) return { error: 'El destino es obligatorio.' }
  if (input.endDate < input.startDate) {
    return { error: 'La fecha de fin debe ser posterior al inicio.' }
  }

  const initialTotal =
    input.initialBudgetItems?.reduce(
      (sum, item) => sum + calculateItemTotal(item.quantity, item.unitAmount),
      0
    ) ?? 0

  const targetAmount = Math.max(1, initialTotal)
  let contributionAmount = input.contributionAmount
  let targetDate: string | undefined = input.contributionAmount
    ? undefined
    : input.startDate

  if (!contributionAmount && targetDate) {
    contributionAmount =
      estimateContributionFromTargetDate(
        {
          target_amount: targetAmount,
          current_amount: 0,
          contribution_amount: null,
          contribution_frequency: input.contributionFrequency ?? 'monthly',
          savings_mode: 'static',
          annual_interest_rate: null,
          target_date: targetDate,
        },
        targetDate,
        input.contributionFrequency ?? 'monthly'
      ) ?? undefined
  }

  const savingsResult = await createSavingsGoal({
    householdId: input.householdId,
    name: `Viaje: ${input.name.trim()}`,
    category: 'vacation',
    icon: 'plane',
    color: '#2DD4BF',
    targetAmount,
    targetDate,
    contributionAmount,
    contributionFrequency: input.contributionFrequency,
    autoContribute: input.autoContribute,
  })

  if (savingsResult.error || !savingsResult.id) {
    return { error: savingsResult.error ?? 'No se pudo crear la meta de ahorro.' }
  }

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      household_id: input.householdId,
      created_by: user.id,
      name: input.name.trim(),
      destination: input.destination.trim(),
      destination_country: input.destinationCountry?.trim() || null,
      start_date: input.startDate,
      end_date: input.endDate,
      travelers_count: input.travelersCount,
      status: 'planning',
      savings_goal_id: savingsResult.id,
      notes: input.notes?.trim() || null,
    })
    .select('id')
    .single()

  if (error || !trip) {
    return { error: error?.message ?? 'No se pudo crear el viaje.' }
  }

  const prepSteps = buildDefaultPrepSteps(
    trip.id,
    input.householdId,
    input.startDate
  )
  if (prepSteps.length > 0) {
    await supabase.from('trip_prep_steps').insert(
      prepSteps.map((step, index) => ({
        trip_id: step.tripId,
        household_id: step.householdId,
        title: step.title,
        step_type: step.stepType ?? 'milestone',
        step_order: step.stepOrder ?? index,
        category: step.category ?? 'other',
        due_date: step.dueDate ?? null,
      }))
    )
  }

  if (input.initialBudgetItems?.length) {
    for (const [index, item] of input.initialBudgetItems.entries()) {
      await createBudgetItem({ ...item, tripId: trip.id, sortOrder: index })
    }
  }

  const daysCount = Math.max(
    1,
    Math.round(
      (new Date(`${input.endDate}T12:00:00`).getTime() -
        new Date(`${input.startDate}T12:00:00`).getTime()) /
        86_400_000
    ) + 1
  )

  await supabase.from('trip_daily_estimates').insert([
    {
      trip_id: trip.id,
      household_id: input.householdId,
      category: 'food',
      amount_per_day: 0,
      days_count: daysCount,
    },
    {
      trip_id: trip.id,
      household_id: input.householdId,
      category: 'local_transport',
      amount_per_day: 0,
      days_count: daysCount,
    },
  ])

  revalidateTravel(trip.id)
  return { id: trip.id }
}

export async function updateTrip(
  input: UpdateTripInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.destination !== undefined) patch.destination = input.destination.trim()
  if (input.destinationCountry !== undefined) {
    patch.destination_country = input.destinationCountry
  }
  if (input.startDate !== undefined) patch.start_date = input.startDate
  if (input.endDate !== undefined) patch.end_date = input.endDate
  if (input.travelersCount !== undefined) patch.travelers_count = input.travelersCount
  if (input.status !== undefined) patch.status = input.status
  if (input.notes !== undefined) patch.notes = input.notes

  const { error } = await supabase
    .from('trips')
    .update(patch)
    .eq('id', input.id)
    .eq('household_id', input.householdId)

  if (error) return { error: error.message }
  await refreshTripSavingsTarget(input.householdId, input.id)
  revalidateTravel(input.id)
  return {}
}

export async function deleteTrip(
  householdId: string,
  tripId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('trips')
    .update({ status: 'cancelled' })
    .eq('id', tripId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }
  revalidateTravel(tripId)
  return {}
}

export async function createBudgetItem(
  input: CreateBudgetItemInput & { sortOrder?: number }
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }
  if (!input.name.trim()) return { error: 'El nombre es obligatorio.' }

  const amountTotal = calculateItemTotal(input.quantity, input.unitAmount)
  const { data: members } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', input.householdId)
  const memberIds = (members ?? []).map(m => m.user_id)
  const splitAllocations = resolveSplitAllocations(
    amountTotal,
    input.splitMode ?? 'equal',
    memberIds,
    null
  )

  const { data, error } = await supabase
    .from('trip_budget_items')
    .insert({
      trip_id: input.tripId,
      household_id: input.householdId,
      category: input.category,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      quantity: input.quantity,
      unit_amount: input.unitAmount,
      currency: input.currency ?? 'AUD',
      amount_total: amountTotal,
      split_mode: input.splitMode ?? 'equal',
      split_allocations: splitAllocations,
      due_date: input.dueDate ?? null,
      booking_url: input.bookingUrl ?? null,
      price_updated_at: new Date().toISOString(),
      sort_order: input.sortOrder ?? 0,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'No se pudo crear el ítem.' }
  await refreshTripSavingsTarget(input.householdId, input.tripId)
  revalidateTravel(input.tripId)
  return { id: data.id }
}

export async function updateBudgetItem(
  householdId: string,
  itemId: string,
  tripId: string,
  patch: Partial<{
    name: string
    quantity: number
    unitAmount: number
    isBooked: boolean
    bookingUrl: string | null
    bookingReference: string | null
    amountActual: number | null
    dueDate: string | null
  }>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const update: Record<string, unknown> = { price_updated_at: new Date().toISOString() }
  if (patch.name !== undefined) update.name = patch.name.trim()
  if (patch.quantity !== undefined) update.quantity = patch.quantity
  if (patch.unitAmount !== undefined) update.unit_amount = patch.unitAmount
  if (patch.isBooked !== undefined) update.is_booked = patch.isBooked
  if (patch.bookingUrl !== undefined) update.booking_url = patch.bookingUrl
  if (patch.bookingReference !== undefined) {
    update.booking_reference = patch.bookingReference
  }
  if (patch.amountActual !== undefined) update.amount_actual = patch.amountActual
  if (patch.dueDate !== undefined) update.due_date = patch.dueDate

  if (patch.quantity !== undefined || patch.unitAmount !== undefined) {
    const { data: current } = await supabase
      .from('trip_budget_items')
      .select('quantity, unit_amount')
      .eq('id', itemId)
      .single()
    const qty = patch.quantity ?? Number(current?.quantity ?? 1)
    const unit = patch.unitAmount ?? Number(current?.unit_amount ?? 0)
    update.amount_total = calculateItemTotal(qty, unit)
  }

  const { error } = await supabase
    .from('trip_budget_items')
    .update(update)
    .eq('id', itemId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }
  await refreshTripSavingsTarget(householdId, tripId)
  revalidateTravel(tripId)
  return {}
}

export async function deleteBudgetItem(
  householdId: string,
  itemId: string,
  tripId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('trip_budget_items')
    .delete()
    .eq('id', itemId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }
  await refreshTripSavingsTarget(householdId, tripId)
  revalidateTravel(tripId)
  return {}
}

export async function createPrepStep(
  input: CreatePrepStepInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { data, error } = await supabase
    .from('trip_prep_steps')
    .insert({
      trip_id: input.tripId,
      household_id: input.householdId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      step_type: input.stepType ?? 'action',
      step_order: input.stepOrder ?? 0,
      category: input.category ?? 'other',
      due_date: input.dueDate ?? null,
      estimated_cost: input.estimatedCost ?? null,
      assigned_to: input.assignedTo ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'No se pudo crear el paso.' }
  revalidateTravel(input.tripId)
  return { id: data.id }
}

export async function togglePrepStep(
  householdId: string,
  tripId: string,
  stepId: string,
  completed: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('trip_prep_steps')
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', stepId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }
  revalidateTravel(tripId)
  return {}
}

export async function deletePrepStep(
  householdId: string,
  tripId: string,
  stepId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('trip_prep_steps')
    .delete()
    .eq('id', stepId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }
  revalidateTravel(tripId)
  return {}
}

export async function upsertDailyEstimate(
  input: UpsertDailyEstimateInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase.from('trip_daily_estimates').upsert(
    {
      trip_id: input.tripId,
      household_id: input.householdId,
      category: input.category,
      amount_per_day: input.amountPerDay,
      days_count: input.daysCount,
      notes: input.notes ?? null,
    },
    { onConflict: 'trip_id,category' }
  )

  if (error) return { error: error.message }
  await refreshTripSavingsTarget(input.householdId, input.tripId)
  revalidateTravel(input.tripId)
  return {}
}

export async function createItineraryDay(
  input: CreateItineraryDayInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { data, error } = await supabase
    .from('trip_itinerary_days')
    .insert({
      trip_id: input.tripId,
      household_id: input.householdId,
      day_date: input.dayDate,
      day_number: input.dayNumber,
      title: input.title?.trim() || null,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'No se pudo crear el día.' }
  revalidateTravel(input.tripId)
  return { id: data.id }
}

export async function createItineraryActivity(
  input: CreateItineraryActivityInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { data, error } = await supabase
    .from('trip_itinerary_activities')
    .insert({
      day_id: input.dayId,
      household_id: input.householdId,
      title: input.title.trim(),
      start_time: input.startTime ?? null,
      end_time: input.endTime ?? null,
      location: input.location ?? null,
      category: input.category ?? null,
      estimated_cost: input.estimatedCost ?? null,
      notes: input.notes ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'No se pudo crear la actividad.' }
  revalidateTravel()
  return { id: data.id }
}

export async function seedItineraryFromTripDates(
  householdId: string,
  tripId: string,
  startDate: string,
  endDate: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { count } = await supabase
    .from('trip_itinerary_days')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)

  if ((count ?? 0) > 0) return {}

  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)
  const rows = []
  let dayNum = 1
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    rows.push({
      trip_id: tripId,
      household_id: householdId,
      day_date: d.toISOString().slice(0, 10),
      day_number: dayNum++,
      title: `Día ${dayNum - 1}`,
    })
  }

  const { error } = await supabase.from('trip_itinerary_days').insert(rows)
  if (error) return { error: error.message }
  revalidateTravel(tripId)
  return {}
}

export async function generateItineraryDays(
  householdId: string,
  tripId: string
): Promise<{ error?: string }> {
  const trip = await getTrip(householdId, tripId)
  if (!trip) return { error: 'Viaje no encontrado.' }
  return seedItineraryFromTripDates(
    householdId,
    tripId,
    trip.startDate,
    trip.endDate
  )
}
