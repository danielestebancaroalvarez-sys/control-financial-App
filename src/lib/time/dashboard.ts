import type {
  HouseholdTask,
  ProductivityGoal,
  TimeBlock,
  TimeCategory,
  TimeDashboardSummary,
  TimeEntry,
} from './types'
import type { TimeFrequency } from './types'
import { scheduledMinutesInRange } from './recurring-blocks'
import { getPeriodRangeAtOffset } from './format'

type MemberRow = {
  user_id: string
  full_name: string | null
  avatar_url: string | null
}

type CategoryRow = {
  id?: string
  name: string
  icon: string | null
  color: string | null
}

type BlockRow = {
  id: string
  category_id: string
  assigned_to: string | null
  title: string
  frequency: string
  anchor_date: string
  duration_minutes: number
  start_time: string | null
  time_categories: CategoryRow | CategoryRow[] | null
}

type EntryRow = {
  id: string
  user_id: string
  category_id: string
  title: string
  entry_date: string
  duration_minutes: number
  time_categories: CategoryRow | CategoryRow[] | null
}

type TaskRow = {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  created_by: string
  due_date: string | null
  estimated_minutes: number | null
  status: 'pending' | 'done' | 'cancelled'
  completed_at: string | null
}

type GoalRow = {
  id: string
  title: string
  target_date: string | null
  color: string | null
  icon: string | null
  goal_steps: {
    id: string
    title: string
    step_order: number
    estimated_minutes: number | null
    due_date: string | null
    assigned_to: string | null
    status: 'pending' | 'done'
  }[]
}

function pickCat(
  raw: CategoryRow | CategoryRow[] | null
): CategoryRow | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

function memberName(members: MemberRow[], userId: string | null): string | null {
  if (!userId) return null
  return members.find(m => m.user_id === userId)?.full_name ?? 'Miembro'
}

export function mapTimeBlock(row: BlockRow, members: MemberRow[]): TimeBlock {
  const cat = pickCat(row.time_categories)
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: cat?.name ?? 'Sin categoría',
    categoryIcon: cat?.icon ?? null,
    categoryColor: cat?.color ?? '#6366F1',
    assignedTo: row.assigned_to,
    assigneeName: memberName(members, row.assigned_to),
    title: row.title,
    frequency: row.frequency as TimeFrequency,
    anchorDate: row.anchor_date,
    durationMinutes: row.duration_minutes,
    startTime: row.start_time,
  }
}

export function mapTimeEntry(row: EntryRow, members: MemberRow[]): TimeEntry {
  const cat = pickCat(row.time_categories)
  return {
    id: row.id,
    userId: row.user_id,
    userName: memberName(members, row.user_id),
    categoryId: row.category_id,
    categoryName: cat?.name ?? 'Sin categoría',
    categoryIcon: cat?.icon ?? null,
    categoryColor: cat?.color ?? '#6366F1',
    title: row.title,
    entryDate: row.entry_date,
    durationMinutes: row.duration_minutes,
  }
}

export function mapHouseholdTask(row: TaskRow, members: MemberRow[]): HouseholdTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assignedTo: row.assigned_to,
    assigneeName: memberName(members, row.assigned_to),
    createdBy: row.created_by,
    creatorName: memberName(members, row.created_by),
    dueDate: row.due_date,
    estimatedMinutes: row.estimated_minutes,
    status: row.status,
    completedAt: row.completed_at,
  }
}

export function mapProductivityGoal(
  row: GoalRow,
  members: MemberRow[]
): ProductivityGoal {
  const steps = [...(row.goal_steps ?? [])].sort(
    (a, b) => a.step_order - b.step_order
  )
  const doneSteps = steps.filter(s => s.status === 'done').length
  const totalSteps = steps.length
  const estimatedRemainingMinutes = steps
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + (s.estimated_minutes ?? 0), 0)

  return {
    id: row.id,
    title: row.title,
    targetDate: row.target_date,
    color: row.color,
    icon: row.icon,
    doneSteps,
    totalSteps,
    estimatedRemainingMinutes,
    percent: totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0,
    steps: steps.map(s => ({
      id: s.id,
      goalId: row.id,
      title: s.title,
      stepOrder: s.step_order,
      estimatedMinutes: s.estimated_minutes,
      dueDate: s.due_date,
      assignedTo: s.assigned_to,
      assigneeName: memberName(members, s.assigned_to),
      status: s.status,
    })),
  }
}

export function buildTimeDashboardSummary(
  periodOffset: number,
  members: MemberRow[],
  categories: TimeCategory[],
  blocks: BlockRow[],
  entries: EntryRow[],
  tasks: TaskRow[],
  goals: GoalRow[]
): TimeDashboardSummary {
  const { start, end } = getPeriodRangeAtOffset('weekly', periodOffset)
  const periodLabel =
    periodOffset === 0
      ? 'Semana actual'
      : periodOffset === 1
        ? 'Semana anterior'
        : `${start} → ${end}`

  const categoryTotals = new Map<string, number>()
  const memberTotals = new Map<string, number>()
  let totalMinutes = 0
  let sleepMinutes = 0

  for (const entry of entries) {
    if (entry.entry_date < start || entry.entry_date > end) continue
    const cat = pickCat(entry.time_categories)
    const name = cat?.name ?? 'Otros'
    const color = cat?.color ?? '#94A3B8'
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + entry.duration_minutes)
    memberTotals.set(
      entry.user_id,
      (memberTotals.get(entry.user_id) ?? 0) + entry.duration_minutes
    )
    totalMinutes += entry.duration_minutes
    if (name === 'Sueño') sleepMinutes += entry.duration_minutes
  }

  for (const block of blocks) {
    const minutes = scheduledMinutesInRange(
      block.anchor_date,
      block.frequency as TimeFrequency,
      block.duration_minutes,
      start,
      end
    )
    if (minutes <= 0) continue
    const cat = pickCat(block.time_categories)
    const name = cat?.name ?? 'Otros'
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + minutes)
    if (block.assigned_to) {
      memberTotals.set(
        block.assigned_to,
        (memberTotals.get(block.assigned_to) ?? 0) + minutes
      )
    }
    totalMinutes += minutes
    if (name === 'Sueño') sleepMinutes += minutes
  }

  const byCategory = [...categoryTotals.entries()]
    .map(([name, minutes]) => {
      const cat = categories.find(c => c.name === name)
      return {
        name,
        minutes,
        color: cat?.color ?? '#94A3B8',
      }
    })
    .sort((a, b) => b.minutes - a.minutes)

  const byMember = members
    .map(m => {
      const minutes = memberTotals.get(m.user_id) ?? 0
      return {
        userId: m.user_id,
        name: m.full_name ?? 'Miembro',
        minutes,
        percent: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
        avatarUrl: m.avatar_url,
      }
    })
    .filter(m => m.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)

  const pendingTasks = tasks.filter(t => t.status === 'pending').length
  const doneTasks = tasks.filter(
    t => t.status === 'done' && t.completed_at
  ).length

  const activeGoals = goals
    .map(g => mapProductivityGoal(g, members))
    .filter(g => g.percent < 100)
    .slice(0, 5)

  return {
    periodStart: start,
    periodEnd: end,
    periodLabel,
    totalMinutes,
    byCategory,
    byMember,
    sleepMinutes,
    pendingTasks,
    doneTasks,
    activeGoals,
  }
}
