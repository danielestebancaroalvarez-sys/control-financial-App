export type TaskDifficulty = 1 | 2 | 3
export type GoalStepType = 'milestone' | 'action'

export type TimeFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'

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
  endTime: string | null
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
  startTime: string | null
  endTime: string | null
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
  difficulty: TaskDifficulty
  color: string
  icon: string
  scheduledStart: string | null
  scheduledEnd: string | null
  status: 'pending' | 'done' | 'cancelled'
  completedAt: string | null
}

export type GoalStep = {
  id: string
  goalId: string
  title: string
  stepOrder: number
  stepType: GoalStepType
  estimatedMinutes: number | null
  dueDate: string | null
  assignedTo: string | null
  assigneeName: string | null
  status: 'pending' | 'done'
}

export type ProductivityGoal = {
  id: string
  title: string
  vision: string | null
  targetDate: string | null
  color: string | null
  icon: string | null
  imageUrl: string | null
  createdBy: string
  creatorName: string | null
  steps: GoalStep[]
  doneSteps: number
  totalSteps: number
  estimatedRemainingMinutes: number
  percent: number
  nextMilestoneTitle: string | null
  nextMilestoneDate: string | null
  daysToNextMilestone: number | null
}

export type TimeMemberMetrics = {
  userId: string
  name: string
  avatarUrl: string | null
  totalMinutes: number
  productivityMinutes: number
  productivityPercent: number
  leisureMinutes: number
  leisurePercent: number
  effortMinutes: number
  productivityScore: number
  doneTasks: number
  sleepMinutes: number
  goalProgressPercent: number
  dailyCategories: { name: string; minutes: number; color: string }[]
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
  productivityMinutes: number
  productivityPercent: number
  leisureMinutes: number
  leisurePercent: number
  memberMetrics: TimeMemberMetrics[]
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
  startTime: string
  endTime: string
}

export type UpdateTimeBlockInput = {
  householdId: string
  blockId: string
  categoryId: string
  title: string
  assignedTo?: string | null
  frequency: TimeFrequency
  anchorDate: string
  startTime: string
  endTime: string
}

export type CreateTimeEntryInput = {
  householdId: string
  categoryId: string
  title: string
  entryDate: string
  durationMinutes?: number
  startTime: string
  endTime: string
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
  difficulty?: TaskDifficulty
  color?: string
  icon?: string
  scheduledStart?: string | null
  scheduledEnd?: string | null
}

export type CreateProductivityGoalInput = {
  householdId: string
  title: string
  vision?: string | null
  targetDate?: string | null
  color?: string | null
  icon?: string | null
  imagePath?: string | null
  steps: {
    title: string
    stepType: GoalStepType
    estimatedMinutes?: number | null
    dueDate?: string | null
    assignedTo?: string | null
  }[]
}

export const TASK_DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  1: 'Baja',
  2: 'Media',
  3: 'Alta',
}

export const TASK_DIFFICULTY_COLORS: Record<TaskDifficulty, string> = {
  1: '#4CAF50',
  2: '#FF9800',
  3: '#E53935',
}
