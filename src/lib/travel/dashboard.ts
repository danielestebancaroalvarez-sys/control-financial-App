import { formatEstimatedTime } from '@/lib/finance/savings'
import type { SavingsGoal } from '@/lib/finance/types'
import { calculatePerPerson, calculateTripTotal } from './budget'
import type {
  Trip,
  TripBudgetItem,
  TripDailyEstimate,
  TripItineraryActivity,
  TripItineraryDay,
  TripPrepStep,
  TripSavingsSummary,
  TripSummary,
} from './types'
import { countTripDays, daysUntilDate } from './format'

type MemberRow = { user_id: string; full_name: string | null }

type TripRow = {
  id: string
  name: string
  destination: string
  destination_country: string | null
  start_date: string
  end_date: string
  travelers_count: number
  status: Trip['status']
  savings_goal_id: string | null
  cover_image_path: string | null
  notes: string | null
  created_by: string
  trip_budget_items?: BudgetItemRow[]
  trip_prep_steps?: PrepStepRow[]
  trip_itinerary_days?: ItineraryDayRow[]
  trip_daily_estimates?: DailyEstimateRow[]
}

type BudgetItemRow = {
  id: string
  trip_id: string
  category: TripBudgetItem['category']
  name: string
  description: string | null
  quantity: number
  unit_amount: number
  currency: string
  amount_total: number
  split_mode: TripBudgetItem['splitMode']
  split_allocations: TripBudgetItem['splitAllocations']
  due_date: string | null
  is_booked: boolean
  booking_url: string | null
  booking_reference: string | null
  amount_actual: number | null
  price_updated_at: string | null
  sort_order: number
}

type PrepStepRow = {
  id: string
  trip_id: string
  title: string
  description: string | null
  step_type: TripPrepStep['stepType']
  step_order: number
  category: TripPrepStep['category']
  due_date: string | null
  estimated_cost: number | null
  is_completed: boolean
  completed_at: string | null
  assigned_to: string | null
  household_task_id: string | null
}

type ItineraryDayRow = {
  id: string
  trip_id: string
  day_date: string
  day_number: number
  title: string | null
  trip_itinerary_activities?: ActivityRow[]
}

type ActivityRow = {
  id: string
  day_id: string
  title: string
  start_time: string | null
  end_time: string | null
  location: string | null
  category: string | null
  estimated_cost: number | null
  notes: string | null
  sort_order: number
}

type DailyEstimateRow = {
  id: string
  trip_id: string
  category: TripDailyEstimate['category']
  amount_per_day: number
  days_count: number
  notes: string | null
}

type SavingsRow = {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  contribution_amount: number | null
  contribution_frequency: 'weekly' | 'monthly' | null
  savings_mode: 'static' | 'compound'
  annual_interest_rate: number | null
}

function memberName(members: MemberRow[], userId: string | null): string | null {
  if (!userId) return null
  return members.find(m => m.user_id === userId)?.full_name ?? null
}

export function mapBudgetItem(row: BudgetItemRow): TripBudgetItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    category: row.category,
    name: row.name,
    description: row.description,
    quantity: Number(row.quantity),
    unitAmount: Number(row.unit_amount),
    currency: row.currency,
    amountTotal: Number(row.amount_total),
    splitMode: row.split_mode,
    splitAllocations: row.split_allocations,
    dueDate: row.due_date,
    isBooked: row.is_booked,
    bookingUrl: row.booking_url,
    bookingReference: row.booking_reference,
    amountActual: row.amount_actual != null ? Number(row.amount_actual) : null,
    priceUpdatedAt: row.price_updated_at,
    sortOrder: row.sort_order,
  }
}

export function mapPrepStep(row: PrepStepRow, members: MemberRow[]): TripPrepStep {
  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title,
    description: row.description,
    stepType: row.step_type,
    stepOrder: row.step_order,
    category: row.category,
    dueDate: row.due_date,
    estimatedCost: row.estimated_cost != null ? Number(row.estimated_cost) : null,
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    assignedTo: row.assigned_to,
    assigneeName: memberName(members, row.assigned_to),
    householdTaskId: row.household_task_id,
  }
}

export function mapActivity(row: ActivityRow): TripItineraryActivity {
  return {
    id: row.id,
    dayId: row.day_id,
    title: row.title,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    category: row.category,
    estimatedCost: row.estimated_cost != null ? Number(row.estimated_cost) : null,
    notes: row.notes,
    sortOrder: row.sort_order,
  }
}

export function mapItineraryDay(row: ItineraryDayRow): TripItineraryDay {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayDate: row.day_date,
    dayNumber: row.day_number,
    title: row.title,
    activities: (row.trip_itinerary_activities ?? [])
      .map(mapActivity)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }
}

export function mapDailyEstimate(row: DailyEstimateRow): TripDailyEstimate {
  return {
    id: row.id,
    tripId: row.trip_id,
    category: row.category,
    amountPerDay: Number(row.amount_per_day),
    daysCount: row.days_count,
    notes: row.notes,
  }
}

export function mapSavingsSummary(
  savings: SavingsRow | null | undefined
): TripSavingsSummary | null {
  if (!savings) return null
  const target = Number(savings.target_amount)
  const current = Number(savings.current_amount)
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const goal: SavingsGoal = {
    id: savings.id,
    name: savings.name,
    category: 'vacation',
    icon: 'plane',
    color: '#2DD4BF',
    target_amount: target,
    current_amount: current,
    target_date: savings.target_date,
    contribution_amount: savings.contribution_amount,
    contribution_frequency: savings.contribution_frequency,
    auto_contribute: false,
    next_contribution: null,
    savings_mode: savings.savings_mode,
    annual_interest_rate: savings.annual_interest_rate,
    is_active: true,
  }
  return {
    goalId: savings.id,
    goalName: savings.name,
    targetAmount: target,
    currentAmount: current,
    percent,
    remaining: Math.max(0, target - current),
    estimatedTimeLabel: formatEstimatedTime(goal),
  }
}

export function mapTrip(
  row: TripRow,
  members: MemberRow[],
  savings?: SavingsRow | null
): Trip {
  const budgetItems = (row.trip_budget_items ?? []).map(mapBudgetItem)
  const prepSteps = (row.trip_prep_steps ?? [])
    .map(s => mapPrepStep(s, members))
    .sort((a, b) => a.stepOrder - b.stepOrder)
  const itineraryDays = (row.trip_itinerary_days ?? [])
    .map(mapItineraryDay)
    .sort((a, b) => a.dayNumber - b.dayNumber)
  const dailyEstimates = (row.trip_daily_estimates ?? []).map(mapDailyEstimate)
  const totalEstimated = calculateTripTotal(
    budgetItems,
    dailyEstimates,
    itineraryDays
  )
  const pendingSteps = prepSteps.filter(s => !s.isCompleted)
  const nextStep = pendingSteps.find(s => s.stepType === 'milestone') ?? pendingSteps[0]

  return {
    id: row.id,
    name: row.name,
    destination: row.destination,
    destinationCountry: row.destination_country,
    startDate: row.start_date,
    endDate: row.end_date,
    travelersCount: row.travelers_count,
    status: row.status,
    savingsGoalId: row.savings_goal_id,
    coverImagePath: row.cover_image_path,
    notes: row.notes,
    createdBy: row.created_by,
    creatorName: memberName(members, row.created_by),
    daysCount: countTripDays(row.start_date, row.end_date),
    budgetItems,
    prepSteps,
    itineraryDays,
    dailyEstimates,
    savings: mapSavingsSummary(savings),
    totalEstimated,
    totalPerPerson: calculatePerPerson(totalEstimated, row.travelers_count),
    donePrepSteps: prepSteps.filter(s => s.isCompleted).length,
    totalPrepSteps: prepSteps.length,
    nextPrepStepTitle: nextStep?.title ?? null,
    nextPrepStepDate: nextStep?.dueDate ?? null,
  }
}

export function mapTripSummary(trip: Trip): TripSummary {
  return {
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelersCount: trip.travelersCount,
    status: trip.status,
    totalEstimated: trip.totalEstimated,
    totalPerPerson: trip.totalPerPerson,
    savingsPercent: trip.savings?.percent ?? 0,
    daysUntilStart: daysUntilDate(trip.startDate),
    nextPrepStepTitle: trip.nextPrepStepTitle,
    nextPrepStepDate: trip.nextPrepStepDate,
  }
}

export const TRIP_DETAIL_SELECT = `
  id, name, destination, destination_country, start_date, end_date, travelers_count,
  status, savings_goal_id, cover_image_path, notes, created_by,
  trip_budget_items (
    id, trip_id, category, name, description, quantity, unit_amount, currency,
    amount_total, split_mode, split_allocations, due_date, is_booked, booking_url,
    booking_reference, amount_actual, price_updated_at, sort_order
  ),
  trip_prep_steps (
    id, trip_id, title, description, step_type, step_order, category, due_date,
    estimated_cost, is_completed, completed_at, assigned_to, household_task_id
  ),
  trip_itinerary_days (
    id, trip_id, day_date, day_number, title,
    trip_itinerary_activities (
      id, day_id, title, start_time, end_time, location, category,
      estimated_cost, notes, sort_order
    )
  ),
  trip_daily_estimates (
    id, trip_id, category, amount_per_day, days_count, notes
  )
`
