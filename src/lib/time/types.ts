export type TimeFrequency = 'weekly' | 'biweekly' | 'monthly'

export type TimeCategory = {
  id: string
  name: string
  icon: string | null
  color: string | null
  is_system: boolean
}

export type TimeBlock = {
  id: string
  categoryId: string
  categoryName: string
  categoryIcon: string | null
  categoryColor: string | null
  assignedTo: string | null
  assigneeName: string | null
  title: string
  frequency: TimeFrequency
  anchorDate: string
  durationMinutes: number
  startTime: string | null
}

export type TimeEntry = {
  id: string
  userId: string
  userName: string | null
  categoryId: string
  categoryName: string
  categoryIcon: string | null
  categoryColor: string | null
  title: string
  entryDate: string
  durationMinutes: number
}

export type HouseholdTask = {
  id: string
  title: string
  description: string | null
  assignedTo: string | null
  assigneeName: string | null
  createdBy: string
  creatorName: string | null
  dueDate: string | null
  estimatedMinutes: number | null
  status: 'pending' | 'done' | 'cancelled'
  completedAt: string | null
}

export type GoalStep = {
  id: string
  goalId: string
  title: string
  stepOrder: number
  estimatedMinutes: number | null
  dueDate: string | null
  assignedTo: string | null
  assigneeName: string | null
  status: 'pending' | 'done'
}

export type ProductivityGoal = {
  id: string
  title: string
  targetDate: string | null
  color: string | null
  icon: string | null
  steps: GoalStep[]
  doneSteps: number
  totalSteps: number
  estimatedRemainingMinutes: number
  percent: number
}

export type TimeDashboardSummary = {
  periodStart: string
  periodEnd: string
  periodLabel: string
  totalMinutes: number
  byCategory: { name: string; minutes: number; color: string }[]
  byMember: {
    userId: string
    name: string
    minutes: number
    percent: number
    avatarUrl: string | null
  }[]
  sleepMinutes: number
  pendingTasks: number
  doneTasks: number
  activeGoals: ProductivityGoal[]
}

export type CreateTimeBlockInput = {
  householdId: string
  categoryId: string
  title: string
  assignedTo?: string | null
  frequency: TimeFrequency
  anchorDate: string
  durationMinutes: number
  startTime?: string | null
}

export type CreateTimeEntryInput = {
  householdId: string
  categoryId: string
  title: string
  entryDate: string
  durationMinutes: number
  timeBlockId?: string | null
  taskId?: string | null
}

export type CreateHouseholdTaskInput = {
  householdId: string
  title: string
  description?: string
  assignedTo?: string | null
  dueDate?: string | null
  estimatedMinutes?: number | null
}

export type CreateProductivityGoalInput = {
  householdId: string
  title: string
  targetDate?: string | null
  color?: string | null
  icon?: string | null
  steps: {
    title: string
    estimatedMinutes?: number | null
    dueDate?: string | null
    assignedTo?: string | null
  }[]
}
