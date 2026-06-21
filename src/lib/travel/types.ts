export type TripStatus =
  | 'planning'
  | 'saving'
  | 'booked'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type TripBudgetCategory =
  | 'flights'
  | 'hotels'
  | 'transport'
  | 'insurance'
  | 'visas'
  | 'activities'
  | 'food'
  | 'shopping'
  | 'other'

export type TripSplitMode = 'equal' | 'custom'

export type TripPrepStepType = 'milestone' | 'action'

export type TripPrepCategory =
  | 'booking'
  | 'visa'
  | 'packing'
  | 'payment'
  | 'research'
  | 'other'

export type TripDailyCategory =
  | 'food'
  | 'local_transport'
  | 'activities'
  | 'misc'

export type SplitAllocation = {
  userId: string
  amount: number
  sharePct?: number
}

export type TripBudgetItem = {
  id: string
  tripId: string
  category: TripBudgetCategory
  name: string
  description: string | null
  quantity: number
  unitAmount: number
  currency: string
  amountTotal: number
  splitMode: TripSplitMode
  splitAllocations: SplitAllocation[] | null
  dueDate: string | null
  isBooked: boolean
  bookingUrl: string | null
  bookingReference: string | null
  amountActual: number | null
  priceUpdatedAt: string | null
  sortOrder: number
}

export type TripPrepStep = {
  id: string
  tripId: string
  title: string
  description: string | null
  stepType: TripPrepStepType
  stepOrder: number
  category: TripPrepCategory
  dueDate: string | null
  estimatedCost: number | null
  isCompleted: boolean
  completedAt: string | null
  assignedTo: string | null
  assigneeName: string | null
  householdTaskId: string | null
}

export type TripItineraryActivity = {
  id: string
  dayId: string
  title: string
  startTime: string | null
  endTime: string | null
  location: string | null
  category: string | null
  estimatedCost: number | null
  notes: string | null
  sortOrder: number
}

export type TripItineraryDay = {
  id: string
  tripId: string
  dayDate: string
  dayNumber: number
  title: string | null
  activities: TripItineraryActivity[]
}

export type TripDailyEstimate = {
  id: string
  tripId: string
  category: TripDailyCategory
  amountPerDay: number
  daysCount: number
  notes: string | null
}

export type TripSavingsSummary = {
  goalId: string | null
  goalName: string | null
  targetAmount: number
  currentAmount: number
  percent: number
  remaining: number
  estimatedTimeLabel: string | null
}

export type Trip = {
  id: string
  name: string
  destination: string
  destinationCountry: string | null
  startDate: string
  endDate: string
  travelersCount: number
  status: TripStatus
  savingsGoalId: string | null
  coverImagePath: string | null
  notes: string | null
  createdBy: string
  creatorName: string | null
  daysCount: number
  budgetItems: TripBudgetItem[]
  prepSteps: TripPrepStep[]
  itineraryDays: TripItineraryDay[]
  dailyEstimates: TripDailyEstimate[]
  savings: TripSavingsSummary | null
  totalEstimated: number
  totalPerPerson: number
  donePrepSteps: number
  totalPrepSteps: number
  nextPrepStepTitle: string | null
  nextPrepStepDate: string | null
}

export type TripSummary = {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  travelersCount: number
  status: TripStatus
  totalEstimated: number
  totalPerPerson: number
  savingsPercent: number
  daysUntilStart: number | null
  nextPrepStepTitle: string | null
  nextPrepStepDate: string | null
}

export type TravelDashboardSummary = {
  activeTrips: TripSummary[]
  totalBudgetAllTrips: number
  pendingPrepSteps: number
  upcomingTrips: TripSummary[]
}

export type CreateTripInput = {
  householdId: string
  name: string
  destination: string
  destinationCountry?: string
  startDate: string
  endDate: string
  travelersCount: number
  notes?: string
  contributionAmount?: number
  contributionFrequency?: 'weekly' | 'monthly'
  autoContribute?: boolean
  initialBudgetItems?: CreateBudgetItemInput[]
}

export type CreateBudgetItemInput = {
  tripId: string
  householdId: string
  category: TripBudgetCategory
  name: string
  description?: string
  quantity: number
  unitAmount: number
  currency?: string
  splitMode?: TripSplitMode
  dueDate?: string
  bookingUrl?: string
}

export type UpdateTripInput = {
  id: string
  householdId: string
  name?: string
  destination?: string
  destinationCountry?: string | null
  startDate?: string
  endDate?: string
  travelersCount?: number
  status?: TripStatus
  notes?: string | null
}

export type CreatePrepStepInput = {
  tripId: string
  householdId: string
  title: string
  description?: string
  stepType?: TripPrepStepType
  stepOrder?: number
  category?: TripPrepCategory
  dueDate?: string
  estimatedCost?: number
  assignedTo?: string
}

export type CreateItineraryDayInput = {
  tripId: string
  householdId: string
  dayDate: string
  dayNumber: number
  title?: string
}

export type CreateItineraryActivityInput = {
  dayId: string
  householdId: string
  title: string
  startTime?: string
  endTime?: string
  location?: string
  category?: string
  estimatedCost?: number
  notes?: string
}

export type UpsertDailyEstimateInput = {
  tripId: string
  householdId: string
  category: TripDailyCategory
  amountPerDay: number
  daysCount: number
  notes?: string
}
